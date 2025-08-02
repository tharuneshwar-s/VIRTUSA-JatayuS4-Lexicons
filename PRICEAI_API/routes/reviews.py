"""
Reviews Routes Module

This module defines the API routes for reviews information.
"""

import logging
from fastapi import APIRouter, HTTPException, Query, status
from database.connections import supabase
from schema.reviews import Review, ReviewStats
from typing import List, Optional, Dict, Any

from utils.logger import logger


router = APIRouter()


@router.get(
    "/reviews",
    tags=["Reviews"],
    summary="Get reviews with filtering options",
    response_description="List of reviews",
    response_model=List[Review],
    status_code=status.HTTP_200_OK,
)
async def get_reviews(
    skip: int = Query(0, ge=0, description="Number of reviews to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    ),
    provider_id: Optional[str] = Query(None, description="Filter by provider ID"),
    service_id: Optional[str] = Query(None, description="Filter by service ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    min_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Minimum rating filter"
    ),
    max_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Maximum rating filter"
    ),
) -> List[Review]:
    """
    Retrieve reviews with optional filtering.

    Parameters:
    - skip: Number of reviews to skip for pagination
    - limit: Maximum number of reviews to return
    - provider_id: Filter by provider ID
    - service_id: Filter by service ID
    - user_id: Filter by user ID
    - min_rating: Minimum rating (1-5)
    - max_rating: Maximum rating (1-5)

    Returns:
        List of review records with user, provider, and service information
    """
    try:
        # Build query with joins to get related information
        query = supabase.table("reviews").select(
            """
            review_id,
            user_id,
            provider_id,
            service_id,
            rating,
            reviews,
            created_at,
            updated_at,
            providers!inner(provider_name, provider_city, provider_state),
            services!inner(service_name, service_category)
        """
        )

        # Apply filters
        if provider_id:
            query = query.eq("provider_id", provider_id)

        if service_id:
            query = query.eq("service_id", service_id)

        if user_id:
            query = query.eq("user_id", user_id)

        if min_rating is not None:
            query = query.gte("rating", min_rating)

        if max_rating is not None:
            query = query.lte("rating", max_rating)

        # Order by most recent first
        query = query.order("created_at", desc=True)

        # Apply pagination
        response = query.range(skip, skip + limit - 1).execute()

        if hasattr(response, "error") and response.error is not None:
            logger.error(f"Database error: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(response.error)
            )

        reviews_data = response.data or []

        # Transform the data to flatten the nested relationships
        transformed_reviews = []
        for review in reviews_data:
            transformed_review = {
                "review_id": review.get("review_id"),
                "user_id": review.get("user_id"),
                "provider_id": review.get("provider_id"),
                "service_id": review.get("service_id"),
                "rating": review.get("rating"),
                "review_text": review.get(
                    "reviews"
                ),  # Note: column is named 'reviews' in table
                "created_at": review.get("created_at"),
                "updated_at": review.get("updated_at"),
                "provider_name": review.get("providers", {}).get("provider_name"),
                "provider_city": review.get("providers", {}).get("provider_city"),
                "provider_state": review.get("providers", {}).get("provider_state"),
                "service_name": review.get("services", {}).get("service_name"),
                "service_category": review.get("services", {}).get("service_category"),
            }
            transformed_reviews.append(transformed_review)

        filter_info = []
        if provider_id:
            filter_info.append(f"provider_id: {provider_id}")
        if service_id:
            filter_info.append(f"service_id: {service_id}")
        if user_id:
            filter_info.append(f"user_id: {user_id}")
        if min_rating is not None:
            filter_info.append(f"min_rating: {min_rating}")
        if max_rating is not None:
            filter_info.append(f"max_rating: {max_rating}")

        filter_str = ", ".join(filter_info) if filter_info else "no filters"
        logger.info(f"Retrieved {len(transformed_reviews)} reviews with {filter_str}")

        return transformed_reviews

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving reviews: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve reviews: {str(e)}",
        )


@router.get(
    "/reviews/provider/{provider_id}",
    tags=["Reviews"],
    summary="Get reviews for a specific provider",
    response_description="List of reviews for the provider",
    response_model=List[Review],
    status_code=status.HTTP_200_OK,
)
async def get_reviews_by_provider(
    provider_id: str,
    skip: int = Query(0, ge=0, description="Number of reviews to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    ),
    service_id: Optional[str] = Query(None, description="Filter by specific service"),
    min_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Minimum rating filter"
    ),
) -> List[Review]:
    """
    Get all reviews for a specific provider.

    Parameters:
        provider_id: The ID of the provider
        skip: Number of reviews to skip for pagination
        limit: Maximum number of reviews to return
        service_id: Optional filter by specific service
        min_rating: Optional minimum rating filter
    """
    return await get_reviews(
        skip=skip,
        limit=limit,
        provider_id=provider_id,
        service_id=service_id,
        user_id=None,
        min_rating=min_rating,
        max_rating=None,
    )


@router.get(
    "/reviews/provider/{provider_id}/service/{service_id}",
    tags=["Reviews"],
    summary="Get reviews for a specific provider and service combination",
    response_description="List of reviews for the provider-service combination",
    response_model=List[Review],
    status_code=status.HTTP_200_OK,
)
async def get_reviews_by_provider_and_service(
    provider_id: str,
    service_id: str,
    skip: int = Query(0, ge=0, description="Number of reviews to skip"),
    limit: int = Query(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    ),
    min_rating: Optional[int] = Query(
        None, ge=1, le=5, description="Minimum rating filter"
    ),
) -> List[Review]:
    """
    Get all reviews for a specific provider and service combination.

    Parameters:
        provider_id: The ID of the provider
        service_id: The ID of the service
        skip: Number of reviews to skip for pagination
        limit: Maximum number of reviews to return
        min_rating: Optional minimum rating filter
    """
    return await get_reviews(
        skip=skip,
        limit=limit,
        provider_id=provider_id,
        service_id=service_id,
        user_id=None,
        min_rating=min_rating,
        max_rating=None,
    )


@router.get(
    "/reviews/stats/provider/{provider_id}",
    tags=["Reviews"],
    summary="Get review statistics for a provider",
    response_description="Review statistics for the provider",
    response_model=ReviewStats,
    status_code=status.HTTP_200_OK,
)
async def get_provider_review_stats(
    provider_id: str,
    service_id: Optional[str] = Query(None, description="Filter by specific service"),
) -> ReviewStats:
    """
    Get review statistics for a provider.

    Parameters:
        provider_id: The ID of the provider
        service_id: Optional filter by specific service

    Returns:
        Dictionary containing review statistics
    """
    try:
        query = supabase.table("reviews").select("rating")
        query = query.eq("provider_id", provider_id)

        if service_id:
            query = query.eq("service_id", service_id)

        response = query.execute()

        if hasattr(response, "error") and response.error is not None:
            logger.error(f"Database error: {response.error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(response.error)
            )

        reviews = response.data or []

        if not reviews:
            return {
                "provider_id": provider_id,
                "service_id": service_id,
                "total_reviews": 0,
                "average_rating": 0,
                "rating_distribution": {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0},
            }

        # Calculate statistics
        ratings = [review["rating"] for review in reviews]
        total_reviews = len(ratings)
        average_rating = sum(ratings) / total_reviews

        # Rating distribution
        rating_distribution = {"1": 0, "2": 0, "3": 0, "4": 0, "5": 0}
        for rating in ratings:
            rating_distribution[str(rating)] += 1

        return {
            "provider_id": provider_id,
            "service_id": service_id,
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 2),
            "rating_distribution": rating_distribution,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving review stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve review statistics: {str(e)}",
        )
