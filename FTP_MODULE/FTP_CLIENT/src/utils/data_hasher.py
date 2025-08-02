from typing import Dict, Any
import hashlib
import json
import pandas as pd
from src.utils.data_utils import safe_float


class DataHasher:
    """Utility class for creating consistent hashes of data records."""

    def __init__(self, algorithm: str = "sha256"):
        self.algorithm = algorithm

    def hash_record(self, record: Dict[str, Any]) -> str:
        """Create a consistent hash for a data record"""
        # Clean the record by removing None values and converting to string
        cleaned_record = {}
        for key, value in record.items():
            if value is not None:
                cleaned_record[key] = str(value)

        sorted_items = sorted(cleaned_record.items())
        json_str = json.dumps(sorted_items, sort_keys=True, default=str)
        hash_obj = hashlib.new(self.algorithm)
        hash_obj.update(json_str.encode("utf-8"))
        return hash_obj.hexdigest()

    def hash_provider_record(self, row: pd.Series) -> str:
        """Create hash for provider record"""
        provider_data = {
            "name": str(row.get("Provider Name", "")).strip(),
            "address": str(row.get("Address", "")).strip(),
            "city": str(row.get("City", "")).strip(),
            "state": str(row.get("State", "")).strip(),
            "zip": str(row.get("Zip Code", "")).strip(),
            "phone": str(row.get("Phone Number", "")).strip(),
            "country": str(row.get("Country", "")).strip(),
            "lat": safe_float(row.get("Latitude")),
            "lng": safe_float(row.get("Longitude")),
            "specialities": str(row.get("Provider Specialities", "")).strip(),
            "benefits": str(row.get("Provider Benefits", "")).strip(),
        }
        return self.hash_record(provider_data)

    def hash_service_record(self, row: pd.Series) -> str:
        """Create hash for service record"""
        service_data = {
            "name": str(row.get("Service Name", "")).strip(),
            "code": str(row.get("Service Code", "")).strip(),
            "category": str(row.get("Service Category", "")).strip(),
            "description": str(row.get("Service Description", "")).strip(),
            "setting": str(row.get("Setting", "")).strip(),
        }
        return self.hash_record(service_data)

    def hash_insurance_record(self, row: pd.Series) -> str:
        """Create hash for insurance record"""
        insurance_data = {
            "name": str(row.get("Insurance Name", "")).strip(),
            "plan": str(row.get("Plan Name", "")).strip(),
            "benefits": str(row.get("Insurance Benefits", "")).strip(),
        }
        return self.hash_record(insurance_data)
