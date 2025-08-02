"""
Provider Services Routes Module

This module defines the API routes for provider services mappings.
"""

import logging
from fastapi import APIRouter, HTTPException, Query, status, Request
from database.connections import supabase
from typing import List, Optional, Dict, Any
from schema.provider_services import ProviderService

from utils.logger import logger

router = APIRouter()


@router.get(
    "/provider-services",
    tags=["Provider Services"],
    summary="Get provider services mappings",
    response_description="List of provider services mappings",
    response_model=List[ProviderService],
    status_code=status.HTTP_200_OK,
)
async def get_provider_services(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of records to return"
    ),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    service_id: Optional[str] = Query(None, description="Filter by service ID"),
) -> List[ProviderService]:
    """
    Retrieve all provider services mappings with optional filtering.

    Parameters:
    - skip: Number of records to skip for pagination
    - limit: Maximum number of records to return
    - provider_id: Filter by provider ID
    - service_id: Filter by service ID
    """
    try:
        query = supabase.table("provider_services").select("*")

        if provider_id:
            query = query.eq("provider_id", provider_id)

        if service_id:
            query = query.eq("service_id", service_id)

        response = query.range(skip, skip + limit - 1).execute()

        if hasattr(response, "error") and response.error is not None:
            logger.error(f"Database error: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(response.error)
            )

        logger.info(f"Retrieved {len(response.data or [])} provider services mappings")
        return response.data or []

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving provider services: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve provider services: {str(e)}",
        )
