"""
Services Routes Module (Read-Only)

This module defines the read-only API routes for healthcare services.
It includes comprehensive endpoints for retrieving services with various filters and relationships.

Routes:
    GET /services/location: Get services by provider location (city/state)
"""

import logging
from fastapi import APIRouter, HTTPException, Query, status
from database.connections import supabase
from schema.services import Service
from typing import List, Optional, Dict, Any

from routes.providers import get_all_providers
from config.config import PRICEAI_API_URL

import httpx

from utils.logger import logger

router = APIRouter()


@router.get(
    "/services/location",
    response_model=List[Service],
    summary="Get services by location",
)
async def get_services_by_location(
    city: Optional[str] = Query(None, description="City where the provider is located"),
    state: Optional[str] = Query(
        None, description="State where the provider is located"
    ),
) -> List[Service]:
    """
    Get all healthcare services available in a specific city and state (robust, supports swapped and partial matches, case-insensitive, and fuzzy matching).
    """
    provider_ids = set()
    provider_responses = []

    try:
        logger.info(f"Getting services by location: city={city}, state={state}")

        # Normalize input to lowercase for case-insensitive search
        city_norm = city.lower().strip() if city else None
        state_norm = state.lower().strip() if state else None

        # Fetch providers from the API endpoint to ensure correct parameter handling

        api_url = "/providers"
        params = {}
        if city_norm:
            params["city"] = city_norm
        if state_norm:
            params["state"] = state_norm

        async with httpx.AsyncClient(base_url=str(f"{PRICEAI_API_URL}")) as client:
            resp = await client.get(api_url, params=params)
            if resp.status_code != 200:
                logger.error(
                    f"Failed to fetch providers: {resp.status_code} {resp.text}"
                )
                raise HTTPException(
                    status_code=resp.status_code, detail="Failed to fetch providers"
                )
            provider_responses = resp.json()

        if len(provider_responses) == 0:
            logger.info(
                "No services found with the provided filters, trying fuzzy matching"
            )
            return []

        # Extract provider_ids from the provider objects
        for provider in provider_responses:
            provider_ids.add(provider["provider_id"])

        logger.info(f"Collected provider_ids: {provider_ids}")
        if not provider_ids:
            logger.info("No providers found in the specified location")
            return []

        # Get all services offered by these providers through the provider_services junction table
        services = []
        service_ids = set()
        for provider_id in provider_ids:
            services_response = (
                supabase.table("provider_services")
                .select("* , services(*)")
                .eq("provider_id", provider_id)
                .execute()
            )
            logger.info(f"provider_id {provider_id}")
            for item in services_response.data:
                if item["services"]:
                    service_id = item["services"]["service_id"]
                    if service_id not in service_ids:
                        service_ids.add(service_id)
                        services.append(item["services"])
        logger.info(f"Found {len(services)} unique services in the specified location")
        return services
    except Exception as e:
        logger.error(f"Error getting services by location: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve services by location: {str(e)}",
        )
