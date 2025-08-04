"""
Providers Routes Module (Read-Only)

This module defines the read-only API routes for healthcare providers.
It includes comprehensive endpoints for retrieving providers with various filters and relationships.

Routes:
    GET /providers/services/{provider_id}: Get services for a provider
"""

import asyncio
import httpx
import logging
import traceback
from fastapi import APIRouter, HTTPException, Query, Path, status, Request
from database.connections import supabase
from typing import List, Optional, Dict, Any

from schema.providers import ProviderWithPricing, Provider, ProviderWithServices
from utils.utils import calculate_distance
from config.config import PRICEAI_API_URL
from utils.logger import logger

router = APIRouter()


@router.get(
    "/providers",
    tags=["Providers"],
    summary="Get all providers",
    response_description="List of healthcare providers",
    response_model=List[Provider],
    status_code=status.HTTP_200_OK,
)
def get_all_providers(
    skip: int = Query(0, ge=0, description="Number of providers to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of providers to return"
    ),
    state: Optional[str] = Query(None, description="Filter by state"),
    city: Optional[str] = Query(None, description="Filter by city"),
    specialty: Optional[str] = Query(None, description="Filter by provider specialty"),
) -> List[Provider]:
    """
    Optimized provider search with flexible filtering logic.
    Searches both city and state fields for both parameters to handle cases where
    users might input a state name in the city field or vice versa.
    """

    try:
        # For complex OR conditions, we'll collect results from multiple queries
        all_providers = []
        provider_ids_seen = set()

        # Build search queries
        queries_to_run = []

        if city:
            # Search city in provider_city column
            queries_to_run.append(("city_in_city", "provider_city", city))
            # Search city in provider_state column (in case user mixed up fields)
            queries_to_run.append(("city_in_state", "provider_state", city))

        if state:
            # Search state in provider_state column
            queries_to_run.append(("state_in_state", "provider_state", state))
            # Search state in provider_city column (in case user mixed up fields)
            queries_to_run.append(("state_in_city", "provider_city", state))

        # If no location filters, get all providers
        if not (city or state):
            queries_to_run.append(("all", None, None))

        # Execute each query
        for query_type, column, value in queries_to_run:
            query = supabase.table("providers").select("*")

            if column and value:
                query = query.ilike(column, f"%{value}%")

            # Apply specialty filter to each query
            if specialty:
                query = query.ilike("provider_specialties", f"%{specialty}%")

            # Apply pagination to each query (we'll handle final pagination later)
            query = query.limit(1000)  # Get more results initially

            response = query.execute()

            if hasattr(response, "error") and response.error is not None:
                logger.error(f"Database error in {query_type}: {response.error}")
                continue

            # Add unique providers to results
            for provider in response.data or []:
                provider_id = provider.get("provider_id")
                if provider_id and provider_id not in provider_ids_seen:
                    provider_ids_seen.add(provider_id)
                    all_providers.append(provider)

        # Apply final pagination
        start_idx = skip
        end_idx = skip + limit
        paginated_providers = all_providers[start_idx:end_idx]

        # Log results
        filter_info = []
        if city:
            filter_info.append(f"city: {city}")
        if state:
            filter_info.append(f"state: {state}")
        if specialty:
            filter_info.append(f"specialty: {specialty}")

        filter_str = ", ".join(filter_info) if filter_info else "no filters"
        logger.info(
            f"Found {len(all_providers)} total providers, returning {len(paginated_providers)} with {filter_str}"
        )

        return paginated_providers

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving providers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve providers: {str(e)}",
        )


@router.get(
    "/providers/services/{provider_id}",
    response_model=ProviderWithServices,
    summary="Get services for a provider",
    response_description="Provider information with all their services",
    status_code=status.HTTP_200_OK,
    tags=["Providers"],
)
async def get_services_for_provider(
    provider_id: str = Path(..., description="The ID of the provider"),
    include_pricing: bool = Query(False, description="Include pricing information"),
    category: Optional[str] = Query(None, description="Filter by service category"),
    setting: Optional[str] = Query(None, description="Filter by service setting"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of services to return"
    ),
    offset: int = Query(0, ge=0, description="Number of services to skip"),
) -> ProviderWithServices:
    """
    Get all services offered by a specific provider.

    Parameters:
        provider_id: The ID of the provider
        include_pricing: Whether to include pricing information
        category: Optional filter by service category
        setting: Optional filter by service setting
        limit: Maximum number of services to return
        offset: Number of services to skip

    Returns:
        Dictionary containing provider information and their services
    """
    try:
        logger.info(f"Getting services for provider: {provider_id}")

        # First get provider details
        provider_response = (
            supabase.table("providers")
            .select("*")
            .eq("provider_id", provider_id)
            .execute()
        )

        if not provider_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Provider {provider_id} not found",
            )

        provider = provider_response.data[0]

        # Get services offered by this provider
        services_query = (
            supabase.table("provider_services")
            .select("*, services(*)")
            .eq("provider_id", provider_id)
        )

        # Apply service filters if provided
        if category:
            services_query = services_query.eq("services.service_category", category)
        if setting:
            services_query = services_query.eq("services.setting", setting)

        # Apply pagination
        services_query = services_query.range(offset, offset + limit - 1)

        services_response = services_query.execute()

        services_data = []
        for ps_record in services_response.data:
            service_data = ps_record.get("services", {})

            if include_pricing:
                # Get pricing information for this service
                pricing_response = (
                    supabase.table("service_pricing")
                    .select("*")
                    .eq("provider_id", provider_id)
                    .eq("service_id", service_data.get("service_id"))
                    .execute()
                )
                service_data["pricing"] = pricing_response.data

            services_data.append(service_data)

        result = {
            "provider": provider,
            "services": services_data,
            "total_services": len(services_data),
            "filters_applied": {
                "category": category,
                "setting": setting,
                "include_pricing": include_pricing,
            },
        }

        logger.info(
            f"Retrieved {len(services_data)} services for provider {provider_id}"
        )
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting services for provider: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve services for provider: {str(e)}",
        )


@router.get(
    "/providers/service/{service_id}",
    response_model=List[ProviderWithPricing],
    summary="Get providers with pricing by service",
    response_description="List of providers with pricing information for the specified service",
    status_code=status.HTTP_200_OK,
    tags=["Providers"],
)
async def get_providers_with_pricing(
    request: Request,
    service_id: str = Path(
        ..., description="The ID of the service to get providers for", min_length=3
    ),
    insurance_id: Optional[str] = Query(
        None, description="Optional insurance ID to get negotiated rates"
    ),
    latitude: Optional[float] = Query(
        None, description="Latitude for distance calculation", ge=-90.0, le=90.0
    ),
    longitude: Optional[float] = Query(
        None, description="Longitude for distance calculation", ge=-180.0, le=180.0
    ),
    max_distance: Optional[float] = Query(
        None, description="Maximum distance in miles", gt=0.0, le=500.0
    ),
    city: Optional[str] = Query(
        None, description="Filter by city", min_length=2, max_length=100
    ),
    state: Optional[str] = Query(
        None, description="Filter by state", min_length=2, max_length=50
    ),
    include_null_insurance: bool = Query(
        True, description="Include pricing with null insurance ID"
    ),
    skip: int = Query(0, description="Number of providers to skip", ge=0),
    limit: int = Query(
        50, description="Maximum number of providers to return", ge=1, le=100
    ),
):
    """
    Get providers with their pricing information for a specific service in a given location.

    This endpoint returns providers that offer the specified service along with pricing details.
    If an insurance ID is provided, negotiated rates will be included.
    If latitude and longitude are provided, distance to each provider will be calculated.
    Results can be filtered by city, state, and maximum distance.
    Pagination is supported through skip and limit parameters.

    Parameters:
        request: FastAPI request object
        service_id: The ID of the service to get providers for
        insurance_id: Optional insurance ID to get negotiated rates
        latitude: Optional latitude for distance calculation (between -90 and 90)
        longitude: Optional longitude for distance calculation (between -180 and 180)
        max_distance: Optional maximum distance in miles (up to 500 miles)
        city: Optional filter by city
        state: Optional filter by state
        include_null_insurance: Include pricing with null insurance ID
        skip: Number of providers to skip for pagination (default: 0)
        limit: Maximum number of providers to return (default: 50, max: 100)

    Returns:
        List of providers with pricing information for the specified service, sorted by price and distance

    Raises:
        422: If input validation fails
        500: If an unexpected error occurs
    """
    providers_data = None

    try:
        # Validate service_id format
        if not service_id or not service_id.strip():
            logger.error("Invalid service_id provided")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid service ID format",
            )

        # Validate coordinates if provided
        if (latitude is not None and longitude is None) or (
            latitude is None and longitude is not None
        ):
            logger.error("Both latitude and longitude must be provided together")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Both latitude and longitude must be provided together",
            )

        # Log request details
        location_info = ""
        if city:
            location_info += f" in city '{city}'"
        if state:
            location_info += f" in state '{state}'"
        if latitude is not None and longitude is not None:
            location_info += f" near coordinates ({latitude}, {longitude})"

        logger.info(
            f"Getting providers with pricing for service ID: {service_id}{location_info}"
        )

        api_url = "/providers"
        params = {}
        if city:
            params["city"] = city
        if state:
            params["state"] = state

        async with httpx.AsyncClient(base_url=str(f"{PRICEAI_API_URL}")) as client:
            resp = await client.get(api_url, params=params)
            if resp.status_code != 200:
                logger.error(
                    f"Failed to fetch providers: {resp.status_code} {resp.text}"
                )
                raise HTTPException(
                    status_code=resp.status_code, detail="Failed to fetch providers"
                )
            providers_data = resp.json()

        if not providers_data:
            return []

        provider_ids = [p["provider_id"] for p in providers_data]
        providers_map = {p["provider_id"]: p for p in providers_data}

        # Step 2: Get providers with their services and pricing using Supabase inner joins
        # This replaces the separate HTTP calls with efficient database joins
        providers_with_pricing_query = (
            supabase.table("providers")
            .select(
                """
                provider_id,
                provider_services!inner(
                    service_id,
                    services!inner(service_id, service_name, service_category, setting, service_code)
                ),
                service_pricing(
                    pricing_id,
                    service_id,
                    insurance_id,
                    negotiated_price,
                    standard_price,
                    in_network
                )
            """
            )
            .eq("provider_services.service_id", service_id)
            .eq("service_pricing.service_id", service_id)
            .in_("provider_id", provider_ids)
        )

        # Add insurance filter if specified
        if insurance_id:
            providers_with_pricing_query = providers_with_pricing_query.eq(
                "service_pricing.insurance_id", insurance_id
            )
        elif not include_null_insurance:
            providers_with_pricing_query = providers_with_pricing_query.not_.is_(
                "service_pricing.insurance_id", "null"
            )

        providers_pricing_response = providers_with_pricing_query.execute()

        if not providers_pricing_response.data:
            return []

        results = []
        # Create a dictionary to track the best pricing per provider
        seen_providers = {}

        # Process the joined results
        for provider_data in providers_pricing_response.data:
            pid = provider_data.get("provider_id")
            provider_info = providers_map.get(pid)
            if not provider_info:
                continue

            # Get service data from the joined results
            provider_services = provider_data.get("provider_services", [])
            service_info = {}
            if provider_services and len(provider_services) > 0:
                services_data = provider_services[0].get("services", {})
                service_info = {
                    "service_name": services_data.get("service_name"),
                    "service_category": services_data.get("service_category"),
                    "setting": services_data.get("setting"),
                    "service_code": services_data.get("service_code"),
                }

            # Get pricing data from the joined results
            pricing_list = provider_data.get("service_pricing", [])

            # Handle case where provider has no pricing data
            if not pricing_list:
                # Still include the provider but with no pricing data
                result = {
                    "provider_id": pid,
                    "provider_name": provider_info.get("provider_name"),
                    "provider_address": provider_info.get("provider_address"),
                    "provider_city": provider_info.get("provider_city"),
                    "provider_state": provider_info.get("provider_state"),
                    "provider_zip": provider_info.get("provider_zip"),
                    "provider_phone": provider_info.get("provider_phone"),
                    "provider_specialities": provider_info.get("provider_specialities"),
                    "service_id": service_id,
                    "service_name": service_info.get("service_name"),
                    "service_category": service_info.get("service_category"),
                    "service_setting": service_info.get("setting"),
                    "pricing_id": None,
                    "service_code": service_info.get("service_code"),
                    "insurance_id": None,
                    "negotiated_price": None,
                    "standard_price": None,
                    "in_network": None,
                    "is_self_pay": True,  # Assume self-pay when no pricing data
                    "has_insurance": False,
                }
            else:
                # Sort pricing by negotiated_price (or standard_price if negotiated is None)
                pricing_list.sort(
                    key=lambda x: (
                        x.get("negotiated_price", float("inf"))
                        if x.get("negotiated_price") is not None
                        else x.get("standard_price", float("inf"))
                    )
                )

                # Use the best price for this provider
                best_price = pricing_list[0]

                # Build the result dictionary
                result = {
                    "provider_id": pid,
                    "provider_name": provider_info.get("provider_name"),
                    "provider_address": provider_info.get("provider_address"),
                    "provider_city": provider_info.get("provider_city"),
                    "provider_state": provider_info.get("provider_state"),
                    "provider_zip": provider_info.get("provider_zip"),
                    "provider_phone": provider_info.get("provider_phone"),
                    "provider_specialities": provider_info.get("provider_specialities"),
                    "service_id": best_price.get("service_id"),
                    "service_name": service_info.get("service_name"),
                    "service_category": service_info.get("service_category"),
                    "service_setting": service_info.get("setting"),
                    "service_code": service_info.get("service_code"),
                    "pricing_id": best_price.get("pricing_id"),
                    "insurance_id": best_price.get("insurance_id"),
                    "negotiated_price": best_price.get("negotiated_price"),
                    "standard_price": best_price.get("standard_price"),
                    "in_network": best_price.get("in_network"),
                    "is_self_pay": best_price.get("insurance_id") is None
                    and best_price.get("in_network") is None,
                    "has_insurance": not (
                        best_price.get("insurance_id") is None
                        and best_price.get("negotiated_price") is None
                        and best_price.get("in_network") is None
                    ),
                }

            # Distance calculation
            if latitude is not None and longitude is not None:
                provider_lat = provider_info.get("provider_lat")
                provider_lng = provider_info.get("provider_lng")

                if provider_lat is not None and provider_lng is not None:
                    result["provider_distance"] = round(
                        calculate_distance(
                            float(latitude),
                            float(longitude),
                            float(provider_lat),
                            float(provider_lng),
                        ),
                        2,
                    )
                    result["provider_lat"] = provider_lat
                    result["provider_lng"] = provider_lng
                else:
                    result["provider_distance"] = None
            else:
                result["provider_lat"] = provider_info.get("provider_lat")
                result["provider_lng"] = provider_info.get("provider_lng")

            # Only store the result if we haven't seen this provider yet
            # or if this price is better than what we've seen
            if pid not in seen_providers or (
                (
                    result.get("negotiated_price") is not None
                    and (
                        seen_providers[pid].get("negotiated_price") is None
                        or result.get("negotiated_price")
                        < seen_providers[pid].get("negotiated_price")
                    )
                )
                or (
                    result.get("negotiated_price") is None
                    and result.get("standard_price") is not None
                    and seen_providers[pid].get("standard_price") is not None
                    and result.get("standard_price")
                    < seen_providers[pid].get("standard_price")
                )
            ):
                seen_providers[pid] = result

        # Create the final results list from the seen_providers dictionary
        results = list(seen_providers.values())

        # Sort by distance if needed
        if latitude is not None and longitude is not None:
            results.sort(
                key=lambda x: (
                    float("inf")
                    if x.get("provider_distance") is None
                    else x.get("provider_distance")
                )
            )
        # Pagination
        return results[skip : skip + limit]

    except HTTPException:
        # Re-raise HTTP exceptions without modification
        raise
    except ValueError as ve:
        # Handle validation errors
        logger.error(f"Validation error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid input parameter: {str(ve)}",
        )
    except Exception as e:
        # Log the full exception with traceback for debugging
        logger.error(f"Error getting providers with pricing: {str(e)}")
        logger.error(traceback.format_exc())

        # Return a generic error message to the client
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while retrieving providers. Please try again later.",
        )
