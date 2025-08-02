"""
Reviews Schema Module

This module defines the Pydantic models for reviews data validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class ReviewBase(BaseModel):
    """Base model for review data"""

    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    review_text: str = Field(
        ..., min_length=10, max_length=2000, description="Review text content"
    )


class ReviewCreate(ReviewBase):
    """Model for creating a new review"""

    user_id: uuid.UUID = Field(..., description="ID of the user submitting the review")
    provider_id: uuid.UUID = Field(..., description="ID of the provider being reviewed")
    service_id: uuid.UUID = Field(..., description="ID of the service being reviewed")


class Review(ReviewBase):
    """Complete review model with all fields"""

    review_id: uuid.UUID = Field(..., description="Unique review identifier")
    user_id: uuid.UUID = Field(
        ..., description="ID of the user who submitted the review"
    )
    provider_id: uuid.UUID = Field(..., description="ID of the provider being reviewed")
    service_id: uuid.UUID = Field(..., description="ID of the service being reviewed")
    created_at: Optional[datetime] = Field(
        None, description="When the review was created"
    )
    updated_at: Optional[datetime] = Field(
        None, description="When the review was last updated"
    )

    # Related information
    provider_name: Optional[str] = Field(None, description="Name of the provider")
    provider_city: Optional[str] = Field(None, description="City of the provider")
    provider_state: Optional[str] = Field(None, description="State of the provider")
    service_name: Optional[str] = Field(None, description="Name of the service")
    service_category: Optional[str] = Field(None, description="Category of the service")

    class Config:
        from_attributes = True
        json_encoders = {datetime: lambda v: v.isoformat() if v else None}


class ReviewStats(BaseModel):
    """Model for review statistics"""

    provider_id: uuid.UUID = Field(..., description="Provider ID")
    service_id: Optional[uuid.UUID] = Field(
        None, description="Service ID (if filtered)"
    )
    total_reviews: int = Field(..., description="Total number of reviews")
    average_rating: float = Field(..., description="Average rating")
    rating_distribution: dict = Field(..., description="Distribution of ratings (1-5)")

    class Config:
        from_attributes = True


class ReviewQuery(BaseModel):
    """Model for review query parameters"""

    skip: int = Field(0, ge=0, description="Number of reviews to skip")
    limit: int = Field(
        100, ge=1, le=1000, description="Maximum number of reviews to return"
    )
    provider_id: Optional[uuid.UUID] = Field(None, description="Filter by provider ID")
    service_id: Optional[uuid.UUID] = Field(None, description="Filter by service ID")
    user_id: Optional[uuid.UUID] = Field(None, description="Filter by user ID")
    min_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Minimum rating filter"
    )
    max_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Maximum rating filter"
    )

    class Config:
        from_attributes = True
