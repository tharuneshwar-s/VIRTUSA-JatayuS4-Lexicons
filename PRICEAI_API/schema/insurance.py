"""
Insurance Schema Module (Read-Only)

This module defines the Pydantic models for insurance plans.
These models are used for response validation and documentation.

Models:
    InsuranceWithPricing: Represents an insurance plan with pricing details for a specific provider and service
"""

from pydantic import BaseModel, Field
from typing import Optional


class InsuranceWithPricing(BaseModel):
    """
    Insurance Plan With Pricing Model

    Represents an insurance plan with pricing details for a specific provider and service.

    Attributes:
        insurance_id: Unique identifier for the insurance record
        insurance_name: Name of the insurance company
        insurance_plan: Name of the specific insurance plan
        insurance_benefits: Description of benefits provided by this insurance
        pricing_id: Unique identifier for the pricing record
        provider_id: Unique identifier for the provider record
        service_id: Unique identifier for the service record
        negotiated_price: Negotiated price for the service under this insurance plan
        in_network: Indicates if the provider is in-network for this insurance plan
        standard_price: Standard price for the service without any discounts or negotiations
    """

    insurance_id: str = Field(
        ..., description="Unique identifier for the insurance record"
    )
    insurance_name: str = Field(..., description="Name of the insurance company")
    insurance_plan: Optional[str] = Field(
        None, description="Name of the specific insurance plan"
    )
    insurance_benefits: Optional[str] = Field(
        None, description="Description of benefits provided by this insurance"
    )
    pricing_id: Optional[str] = Field(
        None, description="Unique identifier for the pricing record"
    )
    provider_id: Optional[str] = Field(
        None, description="Unique identifier for the provider record"
    )
    service_id: Optional[str] = Field(
        None, description="Unique identifier for the service record"
    )
    negotiated_price: Optional[float] = Field(
        None, description="Negotiated price for the service under this insurance plan"
    )
    in_network: Optional[bool] = Field(
        None,
        description="Indicates if the provider is in-network for this insurance plan",
    )
    standard_price: Optional[float] = Field(
        None,
        description="Standard price for the service without any discounts or negotiations",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "insurance_id": "ins_12345",
                "insurance_name": "Blue Cross Blue Shield",
                "insurance_plan": "PPO Gold",
                "insurance_benefits": "Low deductible, nationwide coverage",
                "pricing_id": "price_12345",
                "provider_id": "prov_12345",
                "service_id": "srv_12345",
                "negotiated_price": 125.50,
                "in_network": True,
                "standard_price": 250.00,
            }
        }

class InsuranceWithMultiProviderPricing(BaseModel):
    """
    Insurance Plan With Multiple Provider Pricing Model

    Represents an insurance plan with pricing details for multiple providers and a specific service.
    This model is used for comparing insurance options across multiple providers for the same service.

    Attributes:
        insurance_id: Unique identifier for the insurance record
        insurance_name: Name of the insurance company
        insurance_plan: Name of the specific insurance plan
        insurance_benefits: Description of benefits provided by this insurance
        pricing_id: Unique identifier for the pricing record
        provider_id: Unique identifier for the provider record
        service_id: Unique identifier for the service record
        negotiated_price: Negotiated price for the service under this insurance plan
        in_network: Indicates if the provider is in-network for this insurance plan
        standard_price: Standard price for the service without any discounts or negotiations
    """

    insurance_id: Optional[str] = Field(
        None, description="Unique identifier for the insurance record"
    )
    insurance_name: str = Field(..., description="Name of the insurance company")
    insurance_plan: Optional[str] = Field(
        None, description="Name of the specific insurance plan"
    )
    insurance_benefits: Optional[str] = Field(
        None, description="Description of benefits provided by this insurance"
    )
    pricing_id: Optional[str] = Field(
        None, description="Unique identifier for the pricing record"
    )
    provider_id: Optional[str] = Field(
        None, description="Unique identifier for the provider record"
    )
    service_id: Optional[str] = Field(
        None, description="Unique identifier for the service record"
    )
    negotiated_price: Optional[float] = Field(
        None, description="Negotiated price for the service under this insurance plan"
    )
    in_network: Optional[str] = Field(
        None, description="Whether the provider is in-network for this insurance"
    )
    standard_price: Optional[float] = Field(
        None,
        description="Standard price for the service without any discounts or negotiations",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "insurance_id": "ins_12345",
                "insurance_name": "Blue Cross Blue Shield",
                "insurance_plan": "PPO Gold",
                "insurance_benefits": "Low deductible, nationwide coverage",
                "pricing_id": "price_12345",
                "provider_id": "prov_12345",
                "service_id": "srv_12345",
                "negotiated_price": 125.50,
                "in_network": True,
                "standard_price": 250.00,
            }
        }
