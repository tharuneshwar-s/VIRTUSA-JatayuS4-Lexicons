"""
Service Pricing Routes Module

This module defines the API routes for service pricing information.
"""

import logging
from fastapi import APIRouter, HTTPException, Query, status, Request
from database.connections import supabase
from typing import List, Optional, Dict, Any
from schema.service_pricing import ServicePricing

from utils.logger import logger

router = APIRouter()


@router.get(
    "/service-pricing",
    tags=["Service Pricing"],
    summary="Get service pricing information",
    response_description="List of service pricing records",
    response_model=List[ServicePricing],
    status_code=status.HTTP_200_OK,
)
async def get_service_pricings(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    service_id: Optional[str] = Query(None, description="Filter by service ID"),
    insurance_id: Optional[str] = Query(None, description="Filter by insurance ID"),
    in_network: Optional[str] = Query(None, description="Filter by network status"),
    include_null_insurance: Optional[bool] = Query(
        False, description="Include records with null insurance ID"
    ),
) -> List[ServicePricing]:
    """
    Retrieve all service pricing information with optional filtering.

    Parameters:
    - skip: Number of records to skip for pagination
    - limit: Maximum number of records to return
    - provider_id: Filter by provider ID
    - service_id: Filter by service ID
    - insurance_id: Filter by insurance ID
    - in_network: Filter by network status
    - include_null_insurance: If True, also returns records where insurance_id is null
    """
    try:
        query = supabase.table("service_pricing").select("*")

        if provider_id:
            query = query.eq("provider_id", provider_id)

        if service_id:
            query = query.eq("service_id", service_id)

        if insurance_id is not None:
            if include_null_insurance and insurance_id == "":
                # Special case to search for null insurance_id
                query = query.is_("insurance_id", "null")
            else:
                query = query.eq("insurance_id", insurance_id)

        if in_network is not None:
            query = query.eq("in_network", in_network)

        response = query.range(skip, skip + limit - 1).execute()

        if hasattr(response, "error") and response.error is not None:
            logger.error(f"Database error: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(response.error)
            )

        logger.info(f"Retrieved {len(response.data or [])} service pricing records")
        return response.data or []

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving service pricing: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve service pricing: {str(e)}",
        )
