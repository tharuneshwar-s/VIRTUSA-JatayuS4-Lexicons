"""
Service Pricing Schema Module

This module defines the Pydantic models for service pricing data validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
import uuid


class ServicePricingBase(BaseModel):
    """Base model for service pricing data"""

    provider_id: Optional[uuid.UUID] = Field(None, description="ID of the provider")
    service_id: Optional[uuid.UUID] = Field(None, description="ID of the service")
    insurance_id: Optional[uuid.UUID] = Field(
        None, description="ID of the insurance plan"
    )
    negotiated_price: Optional[Decimal] = Field(
        None, description="Negotiated price for the service"
    )
    in_network: Optional[str] = Field(
        None, description="Network status (in/out of network)"
    )
    standard_price: Optional[Decimal] = Field(
        None, description="Standard price without negotiations"
    )


class ServicePricing(ServicePricingBase):
    """Complete service pricing model with all fields"""

    pricing_id: uuid.UUID = Field(..., description="Unique pricing record identifier")

    class Config:
        from_attributes = True


class ServicePricingCreate(ServicePricingBase):
    """Model for creating a new service pricing record"""

    provider_id: uuid.UUID = Field(..., description="ID of the provider")
    service_id: uuid.UUID = Field(..., description="ID of the service")


class ServicePricingQuery(BaseModel):
    """Model for service pricing query parameters"""

    skip: int = Field(0, ge=0, description="Number of records to skip")
    limit: int = Field(
        100, ge=1, le=1000, description="Maximum number of records to return"
    )
    provider_id: Optional[uuid.UUID] = Field(None, description="Filter by provider ID")
    service_id: Optional[uuid.UUID] = Field(None, description="Filter by service ID")
    insurance_id: Optional[uuid.UUID] = Field(
        None, description="Filter by insurance ID"
    )
    in_network: Optional[str] = Field(None, description="Filter by network status")
    include_null_insurance: Optional[bool] = Field(
        False, description="Include records with null insurance ID"
    )

    class Config:
        from_attributes = True
