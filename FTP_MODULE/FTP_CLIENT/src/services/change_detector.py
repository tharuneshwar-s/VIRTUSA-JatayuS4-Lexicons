"""
Change detection for healthcare data with hashing and synchronization.
"""

import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import pandas as pd

from src.config.supabase_config import supabase
from src.utils.colors import Colors, color_text
from src.utils.cli_output import get_cli
from src.utils.data_hasher import DataHasher


@dataclass
class ChangeStats:
    """Statistics for change detection operations."""

    total_csv_records: int = 0
    total_db_records: int = 0
    new_records: int = 0
    updated_records: int = 0
    deleted_records: int = 0
    unchanged_records: int = 0
    processing_time: float = 0.0
    errors: List[str] = None

    def __post_init__(self):
        if self.errors is None:
            self.errors = []


class ChangeDetector:
    """Handles change detection and database synchronization."""

    def __init__(self):
        # Initialize CLI with filename context
        self.cli = get_cli("change_detector.py")

        self.hasher = DataHasher()
        self.stats = ChangeStats()

    def _parse_in_network_value(self, value) -> Optional[bool]:
        """Parse in_network value to handle true/false/None cases"""
        if (
            value is None
            or value == ""
            or str(value).strip().lower() in ["nan", "none", "", "null"]
        ):
            return None

        str_value = str(value).strip().lower()
        if str_value == "true":
            return True
        elif str_value == "false":
            return False
        else:
            # For any other value, treat as None
            return None

    def load_existing_providers(self) -> Tuple[Dict[str, str], Dict[str, str]]:
        """Load all providers from database efficiently"""
        self.cli.info("Loading providers from database...")
        try:
            result = supabase.table("providers").select("*").execute()

            provider_id_mapping = {}  # key -> provider_id
            provider_hash_mapping = {}  # key -> content_hash

            for record in result.data:
                # Create provider key (same as CSV extraction)
                key = f"{record['provider_zip']}_{record['provider_state']}_{record['provider_city']}"
                provider_id_mapping[key] = record["provider_id"]

                # Create content hash for change detection
                content_hash = self.hasher.hash_record(
                    {
                        "name": record.get("provider_name", ""),
                        "address": record.get("provider_address", ""),
                        "phone": record.get("provider_phone", ""),
                        "country": record.get("provider_country", ""),
                        "lat": record.get("provider_lat"),
                        "lng": record.get("provider_lng"),
                        "specialities": record.get("provider_specialities", []),
                        "benefits": record.get("provider_benefits", ""),
                    }
                )
                provider_hash_mapping[key] = content_hash

            self.cli.success(
                f"Loaded {len(provider_id_mapping)} providers from database"
            )
            return provider_id_mapping, provider_hash_mapping
        except Exception as e:
            self.cli.error(f"Error loading providers: {e}")
            return {}, {}

    def load_existing_services(self) -> Tuple[Dict[str, str], Dict[str, str]]:
        """Load all services from database efficiently"""
        self.cli.info("Loading services from database...")
        try:
            result = supabase.table("services").select("*").execute()

            service_id_mapping = {}  # key -> service_id
            service_hash_mapping = {}  # key -> content_hash

            for record in result.data:
                # Create service key (same as CSV extraction)
                key = f"{record['service_category']}_{record['service_code']}"
                service_id_mapping[key] = record["service_id"]

                # Create content hash for change detection
                content_hash = self.hasher.hash_record(
                    {
                        "name": record.get("service_name", ""),
                        "description": record.get("service_description", ""),
                        "setting": record.get("setting", ""),
                    }
                )
                service_hash_mapping[key] = content_hash

            self.cli.success(f"Loaded {len(service_id_mapping)} services from database")
            return service_id_mapping, service_hash_mapping
        except Exception as e:
            self.cli.error(f"Error loading services: {e}")
            return {}, {}

    def load_existing_insurance(self) -> Tuple[Dict[str, str], Dict[str, str]]:
        """Load all insurance from database efficiently"""
        self.cli.info("Loading insurance from database...")
        try:
            result = supabase.table("insurance").select("*").execute()

            insurance_id_mapping = {}  # key -> insurance_id
            insurance_hash_mapping = {}  # key -> content_hash

            for record in result.data:
                # Create insurance key (same as CSV extraction)
                key = record["insurance_name"]
                insurance_id_mapping[key] = record["insurance_id"]

                # Create content hash for change detection
                content_hash = self.hasher.hash_record(
                    {
                        "plan": record.get("insurance_plan", ""),
                        "benefits": record.get("insurance_benefits", ""),
                    }
                )
                insurance_hash_mapping[key] = content_hash

            self.cli.success(
                f"Loaded {len(insurance_id_mapping)} insurance plans from database"
            )
            return insurance_id_mapping, insurance_hash_mapping
        except Exception as e:
            self.cli.error(f"Error loading insurance: {e}")
            return {}, {}

    def extract_unique_entities_from_dataframe(
        self, df: pd.DataFrame
    ) -> Tuple[Dict, Dict, Dict]:
        """Extract unique providers, services, and insurance from DataFrame with hashing"""
        self.cli.info("Extracting unique entities from DataFrame...")

        # Extract unique providers
        provider_cols = [
            "Provider Name",
            "Address",
            "City",
            "State",
            "Zip Code",
            "Phone Number",
            "Country",
            "Latitude",
            "Longitude",
            "Provider Specialities",
            "Provider Benefits",
        ]

        providers_df = df[provider_cols].drop_duplicates(
            subset=["Zip Code", "State", "City"]
        )

        csv_providers = {}
        for _, row in providers_df.iterrows():
            key = f"{row['Zip Code']}_{row['State']}_{row['City']}"
            csv_providers[key] = {
                "data": row.to_dict(),
                "hash": self.hasher.hash_provider_record(row),
            }

        # Extract unique services
        service_cols = [
            "Service Category",
            "Service Name",
            "Service Code",
            "Service Description",
            "Setting",
        ]

        services_df = df[service_cols].drop_duplicates(
            subset=["Service Category", "Service Code"]
        )

        csv_services = {}
        for _, row in services_df.iterrows():
            key = f"{row['Service Category']}_{row['Service Code']}"
            csv_services[key] = {
                "data": row.to_dict(),
                "hash": self.hasher.hash_service_record(row),
            }

        # Extract unique insurance (excluding empty records)
        df_with_insurance = df[
            df["Insurance Name"].notna()
            & (df["Insurance Name"].str.strip() != "")
            & (df["Insurance Name"].str.strip() != "nan")
        ]

        csv_insurance = {}
        if not df_with_insurance.empty:
            insurance_cols = ["Insurance Name", "Plan Name", "Insurance Benefits"]
            insurance_df = df_with_insurance[insurance_cols].drop_duplicates(
                subset=["Insurance Name"]
            )

            for _, row in insurance_df.iterrows():
                key = row["Insurance Name"]
                csv_insurance[key] = {
                    "data": row.to_dict(),
                    "hash": self.hasher.hash_insurance_record(row),
                }

        self.cli.success(
            f"Extracted {len(csv_providers)} providers, "
            f"{len(csv_services)} services, {len(csv_insurance)} insurance plans"
        )

        return csv_providers, csv_services, csv_insurance

    def _delete_providers(self, deleted_keys: set, provider_id_mapping: Dict):
        """Delete providers from database"""
        if not deleted_keys:
            return
        self.cli.warning(f"Deleting {len(deleted_keys)} providers...")

        for key in deleted_keys:
            provider_id = provider_id_mapping.get(key)
            if provider_id:
                try:
                    # Delete related records first (cascade)
                    supabase.table("service_pricing").delete().eq(
                        "provider_id", provider_id
                    ).execute()
                    supabase.table("provider_services").delete().eq(
                        "provider_id", provider_id
                    ).execute()

                except Exception as e:
                    self.cli.error(f"Error deleting provider {key}: {e}")
                    self.stats.errors.append(f"Delete provider {key}: {e}")

    def _delete_services(self, deleted_keys: set, service_id_mapping: Dict):
        """Delete services from database"""
        if not deleted_keys:
            return
        self.cli.warning(f"Deleting {len(deleted_keys)} services...")

        for key in deleted_keys:
            service_id = service_id_mapping.get(key)
            if service_id:
                try:
                    # Delete related records first (cascade)
                    supabase.table("service_pricing").delete().eq(
                        "service_id", service_id
                    ).execute()
                    supabase.table("provider_services").delete().eq(
                        "service_id", service_id
                    ).execute()
                    supabase.table("service_insurance").delete().eq(
                        "service_id", service_id
                    ).execute()

                    # CLIOutput already logs deletion above
                except Exception as e:
                    self.cli.error(f"Error deleting service {key}: {e}")
                    self.stats.errors.append(f"Delete service {key}: {e}")

    def _delete_insurance(self, deleted_keys: set, insurance_id_mapping: Dict):
        """Delete insurance from database"""
        if not deleted_keys:
            return
        self.cli.warning(f"Deleting {len(deleted_keys)} insurance plans...")

        for key in deleted_keys:
            insurance_id = insurance_id_mapping.get(key)
            if insurance_id:
                try:
                    # Delete related records first (cascade)
                    supabase.table("service_pricing").delete().eq(
                        "insurance_id", insurance_id
                    ).execute()
                    supabase.table("service_insurance").delete().eq(
                        "insurance_id", insurance_id
                    ).execute()

                    # # Delete the insurance
                    # supabase.table("insurance").delete().eq(
                    #     "insurance_id", insurance_id
                    # ).execute()
                    # CLIOutput already logs deletion above
                except Exception as e:
                    self.cli.error(f"Error deleting insurance {key}: {e}")
                    self.stats.errors.append(f"Delete insurance {key}: {e}")

    def detect_and_delete_missing_records_for_provider(
        self, df: pd.DataFrame, provider_info: Dict[str, str]
    ) -> Dict:
        """
        Provider-specific change detection for deletions. Only deletes provider-specific relationships,
        NOT the global services or insurance records.

        Args:
            df: DataFrame containing the current CSV data
            provider_info: Dict containing provider identification info (name, city, state, zip_code)

        Returns:
            Dict: Results of the deletion operation
        """
        start_time = time.time()
        self.cli.info(
            f"Starting provider-specific deletion detection for: {provider_info}"
        )
        try:
            if not provider_info:
                return {
                    "success": False,
                    "error": "Provider information is required for provider-specific deletion",
                    "processing_time": time.time() - start_time,
                }

            # First, get the provider ID from the database
            provider_key = f"{provider_info['zip_code']}_{provider_info['state']}_{provider_info['city']}"

            self.cli.info(
                f"Loading provider ID for: {provider_info['name']} (key: {provider_key})..."
            )

            # Get provider ID
            provider_result = (
                supabase.table("providers")
                .select("provider_id")
                .eq("provider_zip", provider_info["zip_code"])
                .eq("provider_state", provider_info["state"])
                .eq("provider_city", provider_info["city"])
                .eq("provider_name", provider_info["name"])
                .execute()
            )

            if not provider_result.data:
                self.cli.info(f"Provider not found in database: {provider_info}")
                return {
                    "success": True,
                    "summary": f"No provider found for deletion check: {provider_info['name']}",
                    "deleted_counts": {"relationships": 0, "total": 0},
                    "processing_time": time.time() - start_time,
                }

            provider_id = provider_result.data[0]["provider_id"]
            self.cli.success(
                f"Found provider ID: {provider_id} for {provider_info['name']}"
            )
            self.cli.info("Extracting current entities from CSV...")
            csv_providers, csv_services, csv_insurance = (
                self.extract_unique_entities_from_dataframe(df)
            )

            # Get current service IDs that should exist for this provider
            current_service_keys = set(csv_services.keys())
            current_service_ids = set()

            for service_key in current_service_keys:
                parts = service_key.split("_", 1)
                if len(parts) == 2:
                    category, code = parts
                    service_result = (
                        supabase.table("services")
                        .select("service_id")
                        .eq("service_category", category)
                        .eq("service_code", code)
                        .execute()
                    )
                    if service_result.data:
                        current_service_ids.add(service_result.data[0]["service_id"])

            # Get existing provider-service relationships
            existing_relationships = (
                supabase.table("provider_services")
                .select("service_id")
                .eq("provider_id", provider_id)
                .execute()
            )
            existing_service_ids = {
                rel["service_id"] for rel in existing_relationships.data
            }

            # Find relationships to delete (exist in DB but not in current CSV)
            relationships_to_delete = existing_service_ids - current_service_ids

            deletion_count = 0

            if relationships_to_delete:
                self.cli.warning(
                    f"Deleting {len(relationships_to_delete)} provider-service relationships no longer in CSV for provider {provider_info['name']}..."
                )

                # Delete provider-service relationships
                for service_id in relationships_to_delete:
                    try:
                        supabase.table("provider_services").delete().eq(
                            "provider_id", provider_id
                        ).eq("service_id", service_id).execute()
                        deletion_count += 1
                    except Exception as e:
                        self.cli.error(
                            f"Error deleting provider-service relationship: {e}"
                        )

                # Delete associated service pricing records
                for service_id in relationships_to_delete:
                    try:
                        supabase.table("service_pricing").delete().eq(
                            "provider_id", provider_id
                        ).eq("service_id", service_id).execute()
                    except Exception as e:
                        self.cli.error(f"Error deleting service pricing: {e}")

            processing_time = time.time() - start_time

            summary = f"Deleted {deletion_count} provider-specific relationships for {provider_info['name']} (relationships only, no global entities deleted)"

            self.cli.success(f"Provider-specific deletion completed: {summary}")
            # CLIOutput already logs completion above

            return {
                "success": True,
                "summary": summary,
                "deleted_counts": {
                    "relationships": deletion_count,
                    "total": deletion_count,
                },
                "processing_time": processing_time,
            }
        except Exception as e:
            self.cli.error(f"Error in provider-specific deletion detection: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": time.time() - start_time,
            }
