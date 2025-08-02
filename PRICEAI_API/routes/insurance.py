"""
Insurance Routes Module (Read-Only)

This module defines the read-only API routes for insurance plans.
It includes comprehensive endpoints for retrieving insurance plans with various filters and relationships.

Routes:
    GET /insurance/provider-service-insurance/{provider_id}/{service_id}: Get insurance with pricing for provider-service
"""

import logging
import traceback
from fastapi import APIRouter, HTTPException, Query, Path, status
from database.connections import supabase
from schema.insurance import InsuranceWithPricing, InsuranceWithMultiProviderPricing
from typing import List, Optional
from fastapi.responses import JSONResponse

from utils.logger import logger


router = APIRouter()


@router.get(
    "/insurance/provider-service-insurance/{provider_id}/{service_id}",
    response_model=List[InsuranceWithPricing],
    summary="Get insurance plans with pricing for a specific provider and service",
    response_description="List of insurance plans with pricing details for the specified provider and service",
    status_code=status.HTTP_200_OK,
    tags=["Insurance"],
)
async def get_insurance_for_provider_service(
    provider_id: str = Path(..., description="The ID of the provider", min_length=3),
    service_id: str = Path(..., description="The ID of the service", min_length=3),
    include_standard_price: Optional[bool] = Query(
        True, description="Include standard price in the response"
    ),
) -> List[InsuranceWithPricing]:
    """
    Get all insurance plans with pricing details for a specific provider and service.

    This endpoint returns insurance plans that are accepted by the specified provider for the specified service,
    along with pricing details such as negotiated prices and in-network status.

    Parameters:
        provider_id: The ID of the provider
        service_id: The ID of the service
        include_standard_price: Whether to include standard price in the response (default: True)

    Returns:
        List of insurance plans with pricing details for the specified provider and service

    Raises:
        404: If the provider or service is not found
        500: If an unexpected error occurs
    """
    try:
        logger.info(
            f"Getting insurance plans for provider ID: {provider_id} and service ID: {service_id}"
        )

        # First, check if the provider exists
        provider_check = (
            supabase.table("providers")
            .select("provider_id")
            .eq("provider_id", provider_id)
            .execute()
        )

        if not provider_check.data:
            logger.warning(f"Provider with ID {provider_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider with ID {provider_id} not found",
            )

        # Check if the service exists
        service_check = (
            supabase.table("services")
            .select("service_id")
            .eq("service_id", service_id)
            .execute()
        )

        if not service_check.data:
            logger.warning(f"Service with ID {service_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found",
            )

        # Check if the provider offers this service
        provider_service_check = (
            supabase.table("provider_services")
            .select("*")
            .eq("provider_id", provider_id)
            .eq("service_id", service_id)
            .execute()
        )

        if not provider_service_check.data:
            logger.warning(
                f"Provider {provider_id} does not offer service {service_id}"
            )
            return []

        # Get pricing information for this provider and service
        pricing_query = (
            supabase.table("service_pricing")
            .select("*")
            .eq("provider_id", provider_id)
            .eq("service_id", service_id)
            .execute()
        )

        # Get standard price for reference
        standard_price = None
        for price in pricing_query.data:
            if price.get("insurance_id") is None:
                standard_price = price.get("standard_price")
                break

        # Get all insurance IDs from the pricing data
        insurance_ids = []
        pricing_map = {}

        for price in pricing_query.data:
            if price.get("insurance_id"):
                insurance_ids.append(price.get("insurance_id"))
                pricing_map[price.get("insurance_id")] = price

        if not insurance_ids:
            logger.info(
                f"No insurance plans found for provider {provider_id} and service {service_id}"
            )
            return []

        # Get insurance details for these IDs
        insurance_response = (
            supabase.table("insurance")
            .select("*")
            .in_("insurance_id", insurance_ids)
            .execute()
        )

        # Combine insurance and pricing data
        result = []
        for insurance in insurance_response.data:
            insurance_id = insurance.get("insurance_id")
            pricing_data = pricing_map.get(insurance_id, {})

            insurance_with_pricing = {
                "insurance_id": insurance.get("insurance_id"),
                "insurance_name": insurance.get("insurance_name"),
                "insurance_plan": insurance.get("insurance_plan"),
                "insurance_benefits": insurance.get("insurance_benefits"),
                "pricing_id": pricing_data.get("pricing_id"),
                "provider_id": provider_id,
                "service_id": service_id,
                "negotiated_price": pricing_data.get("negotiated_price"),
                "in_network": pricing_data.get("in_network"),
            }

            # Include standard price if requested
            if include_standard_price:
                insurance_with_pricing["standard_price"] = standard_price

            result.append(insurance_with_pricing)

        logger.info(
            f"Retrieved {len(result)} insurance plans for provider {provider_id} and service {service_id}"
        )

        # Add cache control headers

        return JSONResponse(
            content=result,
            headers={
                "X-Total-Count": str(len(result)),
                "Cache-Control": "max-age=300, public",
            },
        )
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        # Log the full exception with traceback for debugging
        logger.error(
            f"Error getting insurance plans for provider and service: {str(e)}"
        )
        logger.error(traceback.format_exc())

        # Return a generic error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving insurance plans. Please try again later.",
        )


@router.get(
    "/insurance/multiple-providers-service/{provider_ids}/{service_id}",
    response_model=List[InsuranceWithMultiProviderPricing],
    summary="Get insurance plans with pricing for multiple providers and a specific service",
    response_description="List of insurance plans with pricing details for the specified providers and service",
    status_code=status.HTTP_200_OK,
    tags=["Insurance"],
)
async def read_insurances_by_multiple_providers_and_service(
    provider_ids: str = Path(
        ..., description="Comma-separated list of provider IDs", min_length=3
    ),
    service_id: str = Path(..., description="The ID of the service", min_length=3),
    include_null_insurance: Optional[bool] = Query(
        False, description="If True, also include null insurance (cash price) option"
    ),
) -> List[InsuranceWithMultiProviderPricing]:
    """
    Retrieve all insurance records that are associated with multiple providers for a specific service.

    This is useful for comparing insurance options across multiple providers for the same service.

    Parameters:
        request: FastAPI Request object
        provider_ids: Comma-separated list of provider IDs
        service_id: ID of the healthcare service
        include_null_insurance: If True, also include null insurance (cash price) option

    Returns:
        List of insurance records with pricing details for the specified providers and service

    Raises:
        404: If the service is not found
        500: If an unexpected error occurs
    """
    try:
        logger.info(
            f"Getting insurance plans for multiple providers: {provider_ids} and service ID: {service_id}"
        )

        # Parse the comma-separated provider_ids
        provider_id_list = provider_ids.split(",")
        if not provider_id_list:
            logger.warning("No valid provider IDs provided")
            return []

        # Check if the service exists
        service_check = (
            supabase.table("services")
            .select("service_id")
            .eq("service_id", service_id)
            .execute()
        )

        if not service_check.data:
            logger.warning(f"Service with ID {service_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service with ID {service_id} not found",
            )

        # Fetch all pricing records for all providers at once
        all_pricing_records = []
        unique_insurance_ids = set()

        # Collect pricing records for all providers
        for provider_id in provider_id_list:
            provider_id = provider_id.strip()

            # Check if the provider exists
            provider_check = (
                supabase.table("providers")
                .select("provider_id")
                .eq("provider_id", provider_id)
                .execute()
            )

            if not provider_check.data:
                logger.warning(f"Provider with ID {provider_id} not found, skipping")
                continue

            # Check if the provider offers this service
            provider_service_check = (
                supabase.table("provider_services")
                .select("*")
                .eq("provider_id", provider_id)
                .eq("service_id", service_id)
                .execute()
            )

            if not provider_service_check.data:
                logger.warning(
                    f"Provider {provider_id} does not offer service {service_id}, skipping"
                )
                continue

            # Get pricing information for this provider and service
            pricing_query = (
                supabase.table("service_pricing")
                .select("*")
                .eq("provider_id", provider_id)
                .eq("service_id", service_id)
                .execute()
            )

            for record in pricing_query.data:
                # Ensure we track which provider this is for
                record["provider_id"] = provider_id
                all_pricing_records.append(record)
                if record.get("insurance_id"):
                    unique_insurance_ids.add(record.get("insurance_id"))

        if not all_pricing_records:
            logger.info(
                f"No pricing records found for the specified providers and service"
            )
            return []

        # Batch fetch all needed insurance records at once
        insurance_map = {}
        if unique_insurance_ids:

            response = (
                supabase.table("insurance")
                .select("*")
                .in_("insurance_id", list(unique_insurance_ids))
                .execute()
            )

            if not hasattr(response, "error") or response.error is None:
                for insurance in response.data:
                    insurance_map[insurance["insurance_id"]] = insurance

        # Build the final result
        result = []
        for pricing in all_pricing_records:
            if pricing.get("insurance_id") is None and include_null_insurance:
                # Add cash/self-pay option
                result.append(
                    {
                        "insurance_id": None,
                        "insurance_name": "Cash / Self Pay",
                        "insurance_plan": "No Insurance",
                        "insurance_benefits": "N/A",
                        "pricing_id": pricing.get("pricing_id"),
                        "provider_id": pricing.get("provider_id"),
                        "service_id": service_id,
                        "negotiated_price": None,
                        "in_network": None,
                        "standard_price": pricing.get("standard_price"),
                    }
                )
            elif (
                pricing.get("insurance_id")
                and pricing.get("insurance_id") in insurance_map
            ):
                # Combine insurance details with pricing
                insurance = insurance_map[pricing.get("insurance_id")]
                result.append(
                    {
                        "insurance_id": insurance.get("insurance_id"),
                        "insurance_name": insurance.get("insurance_name"),
                        "insurance_plan": insurance.get("insurance_plan"),
                        "insurance_benefits": insurance.get("insurance_benefits"),
                        "pricing_id": pricing.get("pricing_id"),
                        "provider_id": pricing.get("provider_id"),
                        "service_id": service_id,
                        "negotiated_price": pricing.get("negotiated_price"),
                        "in_network": pricing.get("in_network"),
                        "standard_price": pricing.get("standard_price"),
                    }
                )

        logger.info(
            f"Retrieved {len(result)} insurance plans for multiple providers and service {service_id}"
        )

        # Add cache control headers
        from fastapi.responses import JSONResponse

        return JSONResponse(
            content=result,
            headers={
                "X-Total-Count": str(len(result)),
                "Cache-Control": "max-age=300, public",  # Cache for 5 minutes
            },
        )
    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except Exception as e:
        # Log the full exception with traceback for debugging
        import traceback

        logger.error(
            f"Error getting insurance plans for multiple providers and service: {str(e)}"
        )
        logger.error(traceback.format_exc())

        # Return a generic error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving insurance plans. Please try again later.",
        )
