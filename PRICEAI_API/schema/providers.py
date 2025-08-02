"""
Providers Schema Module (Read-Only)

This module defines the Pydantic models for healthcare providers.
These models are used for response validation and documentation.

Models:
    Provider: Represents a healthcare provider
    ProviderWithPricing: Represents a provider with service pricing details
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any, Dict, Union


class Provider(BaseModel):
    """
    Healthcare Provider Model

    Represents a healthcare provider with its details.

    Attributes:
        provider_id: Unique identifier for the provider
        provider_name: Name of the healthcare provider
        provider_address: Street address of the provider
        provider_city: City where the provider is located
        provider_state: State where the provider is located
        provider_zip: ZIP code of the provider's location
        provider_phone: Contact phone number
        provider_lat: Latitude coordinate for mapping
        provider_lng: Longitude coordinate for mapping
        provider_specialities: List of provider specialties
        provider_benefits: Additional benefits offered by the provider
    """

    provider_id: str = Field(..., description="Unique identifier for the provider")
    provider_name: str = Field(..., description="Name of the healthcare provider")
    provider_address: Optional[str] = Field(
        None, description="Street address of the provider"
    )
    provider_city: Optional[str] = Field(
        None, description="City where the provider is located"
    )
    provider_state: Optional[str] = Field(
        None, description="State where the provider is located"
    )
    provider_zip: Optional[str] = Field(
        None, description="ZIP code of the provider's location"
    )
    provider_phone: Optional[str] = Field(None, description="Contact phone number")
    provider_lat: Optional[float] = Field(
        None, description="Latitude coordinate for mapping"
    )
    provider_lng: Optional[float] = Field(
        None, description="Longitude coordinate for mapping"
    )
    provider_specialities: Optional[List[str]] = Field(
        None, description="List of provider specialties"
    )
    provider_benefits: Optional[str] = Field(
        None, description="Additional benefits offered by the provider"
    )

    @validator("provider_specialities", pre=True)
    def validate_specialities(cls, v):
        """Ensure provider_specialities is a list"""
        if v is None:
            return []
        if isinstance(v, list):
            return v
        return []

    class Config:
        json_schema_extra = {
            "example": {
                "provider_id": "prov_12345",
                "provider_name": "City General Hospital",
                "provider_address": "123 Main Street",
                "provider_city": "New York",
                "provider_state": "NY",
                "provider_zip": "10001",
                "provider_phone": "212-555-1234",
                "provider_lat": 40.7128,
                "provider_lng": -74.0060,
                "provider_specialities": ["Cardiology", "Orthopedics"],
                "provider_benefits": "Free parking, 24/7 emergency care",
            }
        }


class ProviderWithPricing(BaseModel):
    """
    Provider With Pricing Model

    Represents a healthcare provider with service pricing details.

    Attributes:
        provider_id: Unique identifier for the provider
        provider_name: Name of the healthcare provider
        provider_address: Street address of the provider
        provider_city: City where the provider is located
        provider_state: State where the provider is located
        provider_zip: ZIP code of the provider's location
        provider_phone: Contact phone number
        provider_lat: Latitude coordinate for mapping
        provider_lng: Longitude coordinate for mapping
        provider_specialities: List of provider specialties
        standard_price: Standard price without insurance
        negotiated_price: Negotiated price with insurance
        in_network: Whether the provider is in-network for this insurance
        insurance_id: ID of the insurance plan
        provider_distance: Distance from user's location (if provided)
        is_self_pay: Whether this is a self-pay option
        has_insurance: Whether insurance is being used
    """

    provider_id: str = Field(..., description="Unique identifier for the provider")
    provider_name: str = Field(..., description="Name of the healthcare provider")
    provider_address: Optional[str] = Field(
        None, description="Street address of the provider"
    )
    provider_city: Optional[str] = Field(
        None, description="City where the provider is located"
    )
    provider_state: Optional[str] = Field(
        None, description="State where the provider is located"
    )
    provider_zip: Optional[str] = Field(
        None, description="ZIP code of the provider's location"
    )
    provider_phone: Optional[str] = Field(None, description="Contact phone number")
    provider_lat: Optional[float] = Field(
        None, description="Latitude coordinate for mapping"
    )
    provider_lng: Optional[float] = Field(
        None, description="Longitude coordinate for mapping"
    )
    provider_specialities: Optional[List[str]] = Field(
        None, description="List of provider specialties"
    )
    standard_price: Optional[float] = Field(
        None, description="Standard price without insurance"
    )
    negotiated_price: Optional[float] = Field(
        None, description="Negotiated price with insurance"
    )
    in_network: Optional[str] = Field(
        None, description="Whether the provider is in-network for this insurance"
    )
    insurance_id: Optional[str] = Field(None, description="ID of the insurance plan")
    provider_distance: Optional[float] = Field(
        None, description="Distance from user's location"
    )
    is_self_pay: bool = Field(False, description="Whether this is a self-pay option")
    has_insurance: bool = Field(False, description="Whether insurance is being used")

    class Config:
        json_schema_extra = {
            "example": {
                "provider_id": "prov_12345",
                "provider_name": "City General Hospital",
                "provider_address": "123 Main Street",
                "provider_city": "New York",
                "provider_state": "NY",
                "provider_zip": "10001",
                "provider_phone": "212-555-1234",
                "provider_lat": 40.7128,
                "provider_lng": -74.0060,
                "provider_specialities": ["Cardiology", "Orthopedics"],
                "standard_price": 250.00,
                "negotiated_price": 125.50,
                "in_network": "Yes",
                "insurance_id": "ins_12345",
                "provider_distance": 3.2,
                "is_self_pay": False,
                "has_insurance": True,
            }
        }


class ProviderWithServices(BaseModel):
    """
    Provider With Services Model

    Represents a healthcare provider with their offered services.

    Attributes:
        provider: Provider information
        services: List of services offered by the provider
        total_services: Total number of services
    """

    provider_id: str = Field(..., description="Unique identifier for the provider")
    provider_name: str = Field(..., description="Name of the healthcare provider")
    provider_address: Optional[str] = Field(
        None, description="Street address of the provider"
    )
    provider_city: Optional[str] = Field(
        None, description="City where the provider is located"
    )
    provider_state: Optional[str] = Field(
        None, description="State where the provider is located"
    )
    provider_zip: Optional[str] = Field(
        None, description="ZIP code of the provider's location"
    )
    provider_phone: Optional[str] = Field(None, description="Contact phone number")
    provider_lat: Optional[float] = Field(
        None, description="Latitude coordinate for mapping"
    )
    provider_lng: Optional[float] = Field(
        None, description="Longitude coordinate for mapping"
    )
    provider_specialities: Optional[List[str]] = Field(
        None, description="List of provider specialties"
    )
    provider_benefits: Optional[str] = Field(
        None, description="Additional benefits offered by the provider"
    )

    services: List[Dict[str, Any]] = Field(
        ..., description="List of services offered by the provider"
    )
    total_services: int = Field(..., description="Total number of services")

    class Config:
        json_schema_extra = {
            "example": {
                "provider_id": "prov_12345",
                "provider_name": "City General Hospital",
                "provider_address": "123 Main Street",
                "provider_city": "New York",
                "provider_state": "NY",
                "provider_zip": "10001",
                "provider_phone": "212-555-1234",
                "provider_lat": 40.7128,
                "provider_lng": -74.0060,
                "provider_specialities": ["Cardiology", "Orthopedics"],
                "provider_benefits": "Free parking, 24/7 emergency care",
                "services": [
                    {
                        "service_id": "srv_12345",
                        "service_name": "Comprehensive Metabolic Panel",
                        "service_category": "Diagnostic",
                        "setting": "Outpatient",
                    }
                ],
                "total_services": 1,
            }
        }
