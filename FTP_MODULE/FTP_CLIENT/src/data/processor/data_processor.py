"""
Data Processing Module

Handles parsing and processing of healthcare data records with schema validation.
"""

from typing import Dict, Any, Optional, Set, Tuple
from pydantic import ValidationError
from src.utils.colors import color_text
from src.utils.cli_output import get_cli
from src.utils.const import FIELD_MAPPINGS
from src.utils.data_utils import (
    hash_row,
    safe_float,
    is_valid_uuid,
    generate_uuid,
    normalize_phone,
)
from src.config.supabase_config import supabase


class DataProcessor:
    """Handles healthcare data processing and entity management with schema validation."""

    def __init__(self):
        # Initialize CLI with filename context
        self.cli = get_cli("data_processor.py")

        self.provider_cache: Dict[str, str] = {}
        self.service_cache: Dict[str, str] = {}
        self.insurance_cache: Dict[str, str] = {}

        # Storage for entities to be upserted
        self.providers_to_upsert: Dict[str, Dict[str, Any]] = {}
        self.services_to_upsert: Dict[str, Dict[str, Any]] = {}
        self.insurances_to_upsert: Dict[str, Dict[str, Any]] = {}

        # Sets for relationships
        self.provider_services_to_upsert: Set[Tuple[str, str, Optional[str]]] = set()
        self.service_insurance_to_upsert: Set[Tuple[str, str]] = set()
        self.service_pricing_to_upsert: Set[
            Tuple[str, str, Optional[str], Optional[str], Optional[bool]]
        ] = set()

        # Validation statistics
        self.validation_stats = {
            "providers_validated": 0,
            "services_validated": 0,
            "insurance_validated": 0,
            "service_pricing_validated": 0,
            "validation_errors": 0,
        }

        # Field name mappings for flexible CSV parsing
        self.field_mappings = FIELD_MAPPINGS

    def clear_caches(self):
        """Clear all caches and storage."""
        self.provider_cache.clear()
        self.service_cache.clear()
        self.insurance_cache.clear()

        self.providers_to_upsert.clear()
        self.services_to_upsert.clear()
        self.insurances_to_upsert.clear()

        self.provider_services_to_upsert.clear()
        self.service_insurance_to_upsert.clear()
        self.service_pricing_to_upsert.clear()

        # Reset validation statistics
        self.validation_stats = {
            "providers_validated": 0,
            "services_validated": 0,
            "insurance_validated": 0,
            "service_pricing_validated": 0,
            "validation_errors": 0,
        }

    def process_provider(self, row_dict: Dict[str, Any]) -> Optional[str]:
        """
        Process provider information from a row.

        Args:
            row_dict (Dict[str, Any]): Row data

        Returns:
            Optional[str]: Provider ID if successful, None otherwise
        """
        provider_id = None
        provider_key_fields = ["Provider Name", "City", "Zip Code"]

        if all(row_dict.get(field) for field in provider_key_fields):
            provider_key = hash_row(row_dict, provider_key_fields)

            if provider_key in self.provider_cache:
                provider_id = self.provider_cache[provider_key]
            else:
                filters = {
                    "provider_name": row_dict.get("Provider Name"),
                    "provider_city": row_dict.get("City"),
                    "provider_zip": row_dict.get("Zip Code"),
                }

                provider_id = self._get_existing_id("providers", filters, "provider_id")
                if not provider_id:
                    provider_id = generate_uuid()
                    provider_data = {
                        "provider_id": provider_id,
                        "provider_name": row_dict.get("Provider Name"),
                        "provider_address": row_dict.get("Address"),
                        "provider_city": row_dict.get("City"),
                        "provider_state": row_dict.get("State"),
                        "provider_zip": row_dict.get("Zip Code"),
                        "provider_country": row_dict.get("Country"),
                        "provider_phone": normalize_phone(
                            row_dict.get("Phone Number"),
                        ),
                        "provider_lat": safe_float(row_dict.get("Latitude")),
                        "provider_lng": safe_float(row_dict.get("Longitude")),
                        "provider_specialities": self._parse_specialities(
                            self._get_field_value(row_dict, "Provider Specialities")
                        ),
                        "provider_benefits": row_dict.get("Provider Benefits"),
                    }
                    self.providers_to_upsert[provider_id] = provider_data
                self.provider_cache[provider_key] = provider_id

        return provider_id

    def process_service(self, row_dict: Dict[str, Any]) -> Optional[str]:
        """
        Process service information from a row.

        Args:
            row_dict (Dict[str, Any]): Row data

        Returns:
            Optional[str]: Service ID if successful, None otherwise
        """
        service_id = None
        service_key_fields = ["Service Name", "Service Code"]

        if all(row_dict.get(field) for field in service_key_fields):
            service_key = hash_row(row_dict, service_key_fields)
            if service_key in self.service_cache:
                service_id = self.service_cache[service_key]
            else:
                filters = {
                    "service_code": row_dict.get("Service Code"),
                }
                service_id = self._get_existing_id("services", filters, "service_id")
                if not service_id:
                    service_id = generate_uuid()
                    service_data = {
                        "service_id": service_id,
                        "service_name": row_dict.get("Service Name"),
                        "service_code": row_dict.get("Service Code"),
                        "service_category": row_dict.get("Service Category"),
                        "service_description": row_dict.get("Service Description"),
                        "setting": row_dict.get("Setting"),
                    }
                    self.services_to_upsert[service_id] = service_data
                self.service_cache[service_key] = service_id

        return service_id

    def process_insurance(self, row_dict: Dict[str, Any]) -> Optional[str]:
        """
        Process insurance information from a row.

        Args:
            row_dict (Dict[str, Any]): Row data

        Returns:
            Optional[str]: Insurance ID if successful, None otherwise
        """
        insurance_id = None

        if row_dict.get("Insurance Name") and row_dict.get("Plan Name"):
            insurance_key_fields = ["Insurance Name", "Plan Name"]
            insurance_key = hash_row(row_dict, insurance_key_fields)
            if insurance_key in self.insurance_cache:
                insurance_id = self.insurance_cache[insurance_key]
            else:
                filters = {
                    "insurance_name": row_dict.get("Insurance Name"),
                    "insurance_plan": row_dict.get("Plan Name"),
                }
                insurance_id = self._get_existing_id(
                    "insurance", filters, "insurance_id"
                )
                if not insurance_id:
                    insurance_id = generate_uuid()
                    insurance_data = {
                        "insurance_id": insurance_id,
                        "insurance_name": row_dict.get("Insurance Name"),
                        "insurance_plan": row_dict.get("Plan Name"),
                        "insurance_benefits": row_dict.get("Insurance Benefits"),
                    }
                    self.insurances_to_upsert[insurance_id] = insurance_data
                self.insurance_cache[insurance_key] = insurance_id
        return insurance_id

    def process_pricing(
        self,
        row_dict: Dict[str, Any],
        provider_id: str,
        service_id: str,
        insurance_id: Optional[str] = None,
    ) -> bool:
        """
        Process pricing information from a row.

        Args:
            row_dict (Dict[str, Any]): Row data
            provider_id (str): Provider ID
            service_id (str): Service ID
            insurance_id (Optional[str]): Insurance ID

        Returns:
            bool: True if successful, False otherwise
        """
        # Parse pricing data using flexible field mapping
        standard_charge = safe_float(self._get_field_value(row_dict, "Standard Charge"))

        if standard_charge is not None:
            self.provider_services_to_upsert.add((provider_id, service_id))

        try:
            negotiated_price = safe_float(
                self._get_field_value(row_dict, "Negotiated Price")
            )
        except Exception as e:
            negotiated_price = None

        # Parse in-network status using flexible field mapping
        innetwork_str = row_dict.get("In Network", None)

        in_network = (
            True
            if (
                innetwork_str == True
                or innetwork_str == "True"
                or innetwork_str == "true"
            )
            else (
                False
                if (
                    innetwork_str == False
                    or innetwork_str == "False"
                    or innetwork_str == "false"
                )
                else None
            )
        )

        negotiated_price_str = (
            str(negotiated_price) if negotiated_price is not None else None
        )
        self.service_pricing_to_upsert.add(
            (
                provider_id,
                service_id,
                insurance_id,
                negotiated_price_str,
                in_network,
                str(standard_charge) if standard_charge is not None else None,
            )
        )

        if insurance_id is not None:
            self.service_insurance_to_upsert.add((service_id, insurance_id))

        return True

    def process_row(self, row_dict: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Process a complete data row.

        Args:
            row_dict (Dict[str, Any]): Row data

        Returns:
            Tuple[bool, str]: Success status and error message if any
        """
        try:
            # Validate input type
            if not isinstance(row_dict, dict):
                return False, f"Expected dict, got {type(row_dict)}"

            # Process provider
            provider_id = self.process_provider(row_dict)
            if not is_valid_uuid(provider_id):
                return False, "Invalid/missing provider identifier"

            # Process service
            service_id = self.process_service(row_dict)
            if not is_valid_uuid(service_id):
                return False, "Invalid/missing service identifier"

            # Process insurance (optional)
            insurance_id = self.process_insurance(row_dict)
            if not is_valid_uuid(insurance_id):
                insurance_id = None

            # Process pricing
            success = self.process_pricing(
                row_dict, provider_id, service_id, insurance_id
            )
            if not success:
                return False, "Failed to process pricing data"

            return True, ""

        except Exception as e:
            self.cli.error(f"Error processing row: {e}")
            return False, str(e)

    def get_stats(self) -> Dict[str, int]:
        """Get processing statistics including validation metrics."""
        base_stats = {
            "providers": len(self.providers_to_upsert),
            "services": len(self.services_to_upsert),
            "insurances": len(self.insurances_to_upsert),
            "provider_services": len(self.provider_services_to_upsert),
            "service_insurance": len(self.service_insurance_to_upsert),
            "service_pricing": len(self.service_pricing_to_upsert),
        }

        # Add validation statistics
        base_stats.update(self.validation_stats)
        return base_stats

    def do_database_insertion(self) -> Dict[str, Any]:
        """
        Perform database insertion of all processed entities and relationships.

        Follows two-phase approach:
        1. Insert core entities: providers, services, insurance
        2. Insert relationships: provider_services, service_insurance, service_pricing

        Returns:
            Dict[str, Any]: Insertion results and statistics
        """
        insertion_stats = {
            "providers_inserted": 0,
            "services_inserted": 0,
            "insurances_inserted": 0,
            "provider_services_inserted": 0,
            "service_insurance_inserted": 0,
            "service_pricing_inserted": 0,
            "errors": [],
        }

        try:
            self.cli.info("Starting database insertion process...")

            # Phase 1: Insert core entities
            self.cli.step("Phase 1: Inserting core entities")

            # Insert providers
            if self.providers_to_upsert:
                providers_result = self._insert_providers()
                insertion_stats["providers_inserted"] = providers_result.get(
                    "inserted", 0
                )
                if providers_result.get("errors"):
                    insertion_stats["errors"].extend(providers_result["errors"])

            # Insert services
            if self.services_to_upsert:
                services_result = self._insert_services()
                insertion_stats["services_inserted"] = services_result.get(
                    "inserted", 0
                )
                if services_result.get("errors"):
                    insertion_stats["errors"].extend(services_result["errors"])

            # Insert insurance
            if self.insurances_to_upsert:
                insurance_result = self._insert_insurance()
                insertion_stats["insurances_inserted"] = insurance_result.get(
                    "inserted", 0
                )
                if insurance_result.get("errors"):
                    insertion_stats["errors"].extend(insurance_result["errors"])

            # Phase 2: Insert relationships
            self.cli.step("Phase 2: Inserting relationships")

            # Insert provider-service relationships
            if self.provider_services_to_upsert:
                provider_services_result = self._insert_provider_services()
                insertion_stats["provider_services_inserted"] = (
                    provider_services_result.get("inserted", 0)
                )
                if provider_services_result.get("errors"):
                    insertion_stats["errors"].extend(provider_services_result["errors"])

            # Insert service-insurance relationships
            if self.service_insurance_to_upsert:
                service_insurance_result = self._insert_service_insurance()
                insertion_stats["service_insurance_inserted"] = (
                    service_insurance_result.get("inserted", 0)
                )
                if service_insurance_result.get("errors"):
                    insertion_stats["errors"].extend(service_insurance_result["errors"])

            # Insert service pricing
            if self.service_pricing_to_upsert:
                service_pricing_result = self._insert_service_pricing()
                insertion_stats["service_pricing_inserted"] = (
                    service_pricing_result.get("inserted", 0)
                )
                if service_pricing_result.get("errors"):
                    insertion_stats["errors"].extend(service_pricing_result["errors"])

            # Log summary
            total_inserted = (
                insertion_stats["providers_inserted"]
                + insertion_stats["services_inserted"]
                + insertion_stats["insurances_inserted"]
                + insertion_stats["provider_services_inserted"]
                + insertion_stats["service_insurance_inserted"]
                + insertion_stats["service_pricing_inserted"]
            )

            self.cli.success(
                f"Database insertion completed. Total records inserted: {total_inserted}"
            )
            if insertion_stats["errors"]:
                self.cli.warning(
                    f"Encountered {len(insertion_stats['errors'])} errors during insertion"
                )

            return insertion_stats

        except Exception as e:
            error_msg = f"Database insertion failed: {str(e)}"
            self.cli.error(error_msg)
            insertion_stats["errors"].append(error_msg)
            return insertion_stats

    def _insert_providers(self) -> Dict[str, Any]:
        """Insert providers into the database."""
        try:
            providers_list = list(self.providers_to_upsert.values())

            if not providers_list:
                return {"inserted": 0, "errors": []}

            self.cli.info(f"Inserting {len(providers_list)} providers...")

            # Batch insert providers with conflict resolution on id
            result = (
                supabase.table("providers")
                .upsert(providers_list, on_conflict="provider_id")
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(f"Successfully inserted {inserted_count} providers")

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting providers: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _insert_services(self) -> Dict[str, Any]:
        """Insert services into the database."""
        try:
            services_list = list(self.services_to_upsert.values())

            if not services_list:
                return {"inserted": 0, "errors": []}

            self.cli.info(f"Inserting {len(services_list)} services...")

            # Batch insert services with conflict resolution on id
            result = (
                supabase.table("services")
                .upsert(services_list, on_conflict="service_id")
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(f"Successfully inserted {inserted_count} services")

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting services: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _insert_insurance(self) -> Dict[str, Any]:
        """Insert insurance into the database."""
        try:
            insurance_list = list(self.insurances_to_upsert.values())

            if not insurance_list:
                return {"inserted": 0, "errors": []}

            self.cli.info(f"Inserting {len(insurance_list)} insurance records...")

            # Batch insert insurance with conflict resolution on id
            result = (
                supabase.table("insurance")
                .upsert(insurance_list, on_conflict="insurance_id")
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(
                f"Successfully inserted {inserted_count} insurance records"
            )

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting insurance: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _insert_provider_services(self) -> Dict[str, Any]:
        """Insert provider-service relationships into the database."""
        try:
            if not self.provider_services_to_upsert:
                return {"inserted": 0, "errors": []}

            # Convert set of tuples to list of dictionaries
            provider_services_list = []
            for provider_id, service_id in self.provider_services_to_upsert:
                provider_services_list.append(
                    {"provider_id": provider_id, "service_id": service_id}
                )

            self.cli.info(
                f"Inserting {len(provider_services_list)} provider-service relationships..."
            )

            # Batch insert provider-service relationships with conflict resolution
            result = (
                supabase.table("provider_services")
                .upsert(provider_services_list, on_conflict="provider_id,service_id")
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(
                f"Successfully inserted {inserted_count} provider-service relationships"
            )

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting provider-service relationships: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _insert_service_insurance(self) -> Dict[str, Any]:
        """Insert service-insurance relationships into the database."""
        try:
            if not self.service_insurance_to_upsert:
                return {"inserted": 0, "errors": []}

            # Convert set of tuples to list of dictionaries
            service_insurance_list = []
            for service_id, insurance_id in self.service_insurance_to_upsert:
                service_insurance_list.append(
                    {"service_id": service_id, "insurance_id": insurance_id}
                )

            self.cli.info(
                f"Inserting {len(service_insurance_list)} service-insurance relationships..."
            )

            # Batch insert service-insurance relationships with conflict resolution
            result = (
                supabase.table("service_insurance")
                .upsert(service_insurance_list, on_conflict="service_id,insurance_id")
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(
                f"Successfully inserted {inserted_count} service-insurance relationships"
            )

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting service-insurance relationships: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _insert_service_pricing(self) -> Dict[str, Any]:
        """Insert service pricing into the database."""
        try:
            if not self.service_pricing_to_upsert:
                return {"inserted": 0, "errors": []}

            # Convert set of tuples to list of dictionaries
            service_pricing_list = []
            for (
                provider_id,
                service_id,
                insurance_id,
                negotiated_price,
                in_network,
                standard_charge,
            ) in self.service_pricing_to_upsert:
                pricing_record = {
                    "provider_id": provider_id,
                    "service_id": service_id,
                    "insurance_id": insurance_id,
                    "negotiated_price": negotiated_price,
                    "in_network": in_network,
                    "standard_price": standard_charge,
                }
                service_pricing_list.append(pricing_record)

            self.cli.info(
                f"Inserting {len(service_pricing_list)} service pricing records..."
            )

            # Batch insert service pricing with conflict resolution on composite key
            result = (
                supabase.table("service_pricing")
                .upsert(
                    service_pricing_list,
                    on_conflict="provider_id,service_id,insurance_id",
                )
                .execute()
            )

            inserted_count = len(result.data) if result.data else 0
            self.cli.success(
                f"Successfully inserted {inserted_count} service pricing records"
            )

            return {"inserted": inserted_count, "errors": []}

        except Exception as e:
            error_msg = f"Error inserting service pricing: {str(e)}"
            self.cli.error(error_msg)
            return {"inserted": 0, "errors": [error_msg]}

    def _parse_specialities(self, specialities_str: Any) -> Optional[list]:
        """Parse provider specialities string into list."""
        if not specialities_str:
            return None

        specialities = [
            s.strip() for s in str(specialities_str).split(",") if s.strip()
        ]
        return specialities if specialities else None

    def _get_field_value(self, row_dict: Dict[str, Any], field_key: str) -> Any:
        """
        Get field value using flexible field name mapping.

        Args:
            row_dict: The row data dictionary
            field_key: The logical field key (e.g., 'standard_charge')

        Returns:
            The field value or None if not found
        """
        # Safety check
        if not isinstance(row_dict, dict):
            return None

        possible_names = self.field_mappings.get(field_key, [field_key])

        for name in possible_names:
            if name in row_dict and row_dict[name] is not None:
                return row_dict[name]
        return None

    def _get_existing_id(
        self, table_name: str, filters: Dict[str, Any], id_column: str
    ) -> Optional[str]:
        """
        Checks if a record exists in the database and returns its ID.

        Args:
            table_name (str): Target table name
            filters (Dict[str, Any]): Query filter conditions
            id_column (str): ID column to return

        Returns:
            Optional[str]: Record ID if found, None otherwise
        """
        try:
            result = (
                supabase.table(table_name)
                .select(id_column)
                .match(filters)
                .limit(1)
                .execute()
            )
            if result.data:
                return result.data[0].get(id_column)
        except Exception as e:
            self.cli.warning(f"Error checking existing ID in {table_name}: {e}")
        return None
