"""
Services Schema Module (Read-Only)

This module defines the Pydantic models for healthcare services.
These models are used for response validation and documentation.

Models:
    Service: Represents a healthcare service
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class Service(BaseModel):
    """
    Healthcare Service Model

    Represents a healthcare service with its details.

    Attributes:
        service_id: Unique identifier for the service
        service_name: Name of the healthcare service
        service_code: Medical code for the service (e.g., CPT, HCPCS)
        service_category: Category of the service (e.g., Diagnostic, Preventive)
        setting: Setting where the service is provided (e.g., Inpatient, Outpatient)
        service_description: Detailed description of the service
    """

    service_id: str = Field(..., description="Unique identifier for the service")
    service_name: str = Field(..., description="Name of the healthcare service")
    service_code: Optional[str] = Field(
        None, description="Medical code for the service (e.g., CPT, HCPCS)"
    )
    service_category: Optional[str] = Field(
        None, description="Category of the service (e.g., Diagnostic, Preventive)"
    )
    setting: Optional[str] = Field(
        None,
        description="Setting where the service is provided (e.g., Inpatient, Outpatient)",
    )
    service_description: Optional[str] = Field(
        None, description="Detailed description of the service"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "service_id": "srv_12345",
                "service_name": "Comprehensive Metabolic Panel",
                "service_code": "80053",
                "service_category": "Laboratory",
                "setting": "Outpatient",
                "service_description": "Blood test that measures sugar (glucose) level, electrolyte and fluid balance, kidney function, and liver function",
            }
        }
