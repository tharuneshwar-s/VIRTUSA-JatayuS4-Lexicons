"""
Provider Services Schema Module

This module defines the Pydantic models for provider services mapping data validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional
import uuid


class ProviderServiceBase(BaseModel):
    """Base model for provider service mapping data"""

    provider_id: uuid.UUID = Field(..., description="ID of the provider")
    service_id: uuid.UUID = Field(..., description="ID of the service")


class ProviderService(ProviderServiceBase):
    """Complete provider service mapping model"""

    # Additional fields could be added here if needed (e.g., availability, notes)

    class Config:
        from_attributes = True


class ProviderServiceCreate(ProviderServiceBase):
    """Model for creating a new provider service mapping"""

    pass  # Same as base model for now


class ProviderServiceQuery(BaseModel):
    """Model for provider service query parameters"""

    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(
        100, ge=1, le=1000, description="Maximum number of records to return"
    )
    provider_id: Optional[uuid.UUID] = Field(None, description="Filter by provider ID")
    service_id: Optional[uuid.UUID] = Field(None, description="Filter by service ID")

    class Config:
        from_attributes = True


class ProviderServiceWithDetails(ProviderServiceBase):
    """Provider service mapping with detailed information"""

    # Provider details
    provider_name: Optional[str] = Field(None, description="Name of the provider")
    provider_city: Optional[str] = Field(None, description="City of the provider")
    provider_state: Optional[str] = Field(None, description="State of the provider")

    # Service details
    service_name: Optional[str] = Field(None, description="Name of the service")
    service_category: Optional[str] = Field(None, description="Category of the service")
    setting: Optional[str] = Field(
        None, description="Service setting (inpatient/outpatient)"
    )

    class Config:
        from_attributes = True
