from datetime import datetime
from typing import Optional, Dict, Any
import asyncio

from src.config.supabase_config import supabase
from src.monitoring.logger import logger
from src.utils.cli_output import get_cli
from src.utils.file_hash import calculate_sha256
from datetime import datetime


class DBQueue:

    def __init__(self):
        """Initialize the database queue manager."""
        self.cli = get_cli("db_queue.py")

    async def _execute_with_retry(
        self, operation_func, operation_name: str, max_retries: int = 3
    ):
        """
        Execute database operation with retry logic for socket errors.

        Args:
            operation_func: Function to execute
            operation_name: Name of operation for logging
            max_retries: Maximum number of retries

        Returns:
            Result of operation or None if all retries failed
        """
        for attempt in range(max_retries + 1):
            try:
                # Add small delay to prevent overwhelming the connection
                if attempt > 0:
                    await asyncio.sleep(
                        min(2**attempt, 10)
                    )  # Exponential backoff, max 10s

                result = operation_func()
                return result

            except Exception as e:
                error_str = str(e)
                is_socket_error = (
                    "WinError 10035" in error_str
                    or "socket" in error_str.lower()
                    or "connection" in error_str.lower()
                    or "timeout" in error_str.lower()
                )

                if attempt < max_retries and is_socket_error:
                    logger.warning(
                        f"[DB_QUEUE]: Socket error in {operation_name} (attempt {attempt + 1}/{max_retries + 1}): {e}. Retrying..."
                    )
                    continue
                else:
                    logger.error(
                        f"[DB_QUEUE]: Failed {operation_name} after {attempt + 1} attempts: {e}"
                    )
                    raise e

        return None

    async def enqueue_file(
        self,
        source_provider_uuid: str,
        provider_name: str,
        filename: str,
        file_path: str,
    ) -> bool:
        """
        Add a file to the processing queue with hash-based duplicate detection.

        Args:
            source_provider_uuid (str): Provider UUID from ftp_sources table
            provider_name (str): Name of the healthcare provider
            filename (str): Name of the file
            file_path (str): Full path to the file

        Returns:
            bool: True if successfully queued, False if already processed or error occurred
        """
        try:
            # Calculate file hash
            file_hash = calculate_sha256(file_path)
            if file_hash is None:
                self.cli.error(f"Failed to calculate hash for {filename}")
                return False

            # Check if file with same content has already been processed
            existing_result = await self._execute_with_retry(
                lambda: supabase.table("processed_ftp_files")
                .select("id, status, processed_at")
                .eq("hospital_name", provider_name)
                .eq("file_name", filename)
                .eq("file_hash", file_hash)
                .execute(),
                f"check existing file {filename}",
            )

            if existing_result and existing_result.data:
                existing_record = existing_result.data[0]
                status = existing_record["status"]

                if status == "completed":
                    self.cli.info(
                        f"Skipping {filename} - already processed (hash: {file_hash[:8]}...)"
                    )

                    return False
                elif status in ["pending", "processing"]:
                    self.cli.info(
                        f"Skipping {filename} - already in queue (hash: {file_hash[:8]}...)"
                    )

                    return False
                else:
                    # File exists but failed - update it to retry with new timestamp
                    self.cli.info(
                        f"Retrying previously failed file {filename} (hash: {file_hash[:8]}...)"
                    )
                    timestamp = datetime.now().isoformat()
                    update_result = await self._execute_with_retry(
                        lambda: supabase.table("processed_ftp_files")
                        .update(
                            {
                                "status": "pending",
                                "last_checked_at": timestamp,
                                "retry_count": 0,
                                "error_message": None,
                                "updated_at": timestamp,
                            }
                        )
                        .eq("id", existing_record["id"])
                        .execute(),
                        f"update failed file {filename}",
                    )
                    return bool(update_result and update_result.data)

            # Check if a file with same name but different content exists
            name_conflict_result = await self._execute_with_retry(
                lambda: supabase.table("processed_ftp_files")
                .select("id, file_hash, status")
                .eq("hospital_name", provider_name)
                .eq("file_name", filename)
                .neq("file_hash", file_hash)
                .execute(),
                f"check name conflict for {filename}",
            )

            if name_conflict_result and name_conflict_result.data:
                self.cli.info(
                    f"File {filename} has changed content - new hash: {file_hash[:8]}..."
                )

                # Update the existing record instead of creating a new one
                existing_record = name_conflict_result.data[0]
                timestamp = datetime.now().isoformat()
                update_result = await self._execute_with_retry(
                    lambda: supabase.table("processed_ftp_files")
                    .update(
                        {
                            "file_hash": file_hash,
                            "status": "pending",
                            "last_checked_at": timestamp,
                            "retry_count": 0,
                            "error_message": None,
                            "updated_at": timestamp,
                            "processed_at": None,  # Reset processed timestamp
                        }
                    )
                    .eq("id", existing_record["id"])
                    .execute(),
                    f"update existing record for {filename}",
                )

                if update_result and update_result.data:
                    self.cli.success(
                        f"Updated existing record for {filename} with new content (hash: {file_hash[:8]}...)"
                    )
                    return True
                else:
                    self.cli.error(f"Failed to update existing record for {filename}")
                    return False

            # Create new record for this file version
            timestamp = datetime.now().isoformat()
            record = {
                "hospital_name": provider_name,
                "file_name": filename,
                "file_hash": file_hash,
                "status": "pending",
                "last_checked_at": timestamp,
                "source_provider_uuid": source_provider_uuid,
                "created_at": timestamp,
                "retry_count": 0,
            }

            result = await self._execute_with_retry(
                lambda: supabase.table("processed_ftp_files").insert(record).execute(),
                f"insert new record for {filename}",
            )

            if result and result.data:
                self.cli.success(
                    f"Queued {filename} for processing (hash: {file_hash[:8]}...)"
                )

                return True
            else:
                self.cli.error(f"Failed to queue {filename}")

                return False

        except Exception as e:
            self.cli.error(f"Error queuing {filename}: {str(e)}")
            return False

    def is_file_already_processed(self, provider_name: str, filename: str) -> bool:
        """
        Check if a file has already been processed (completed status).

        Args:
            provider_name (str): Name of the healthcare provider
            filename (str): Name of the file

        Returns:
            bool: True if file is already processed, False otherwise
        """
        try:
            result = (
                supabase.table("processed_ftp_files")
                .select("id")
                .match(
                    {
                        "hospital_name": provider_name,
                        "file_name": filename,
                        "status": "completed",
                    }
                )
                .limit(1)
                .execute()
            )
            return bool(result.data)

        except Exception as e:
            self.cli.error(
                f"Error checking file status for {provider_name}/{filename}: {e}"
            )
            return False

    def update_source_last_checked(self, source_uuid: str) -> bool:
        """
        Update the last_checked_at timestamp for a source.

        Args:
            source_uuid (str): UUID of the FTP source

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = (
                supabase.table("ftp_sources")
                .update({"last_checked_at": datetime.now().isoformat()})
                .eq("uuid", source_uuid)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            self.cli.error(f"Error updating source last_checked: {str(e)}")
            return False

    def mark_as_completed(
        self, file_id: str, storage_info: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Mark a file as completed.

        Args:
            file_id (str): ID of the file record
            storage_info (Optional[Dict[str, Any]]): Storage information

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            update_data = {
                "status": "completed",
                "processed_at": datetime.now().isoformat(),
                "error_message": None,
            }

            # Add storage information if provided
            if storage_info:
                update_data["storage_path"] = storage_info.get("storage_path")
                update_data["storage_bucket"] = storage_info.get("bucket_name")
                update_data["public_url"] = storage_info.get("public_url")

            result = (
                supabase.table("processed_ftp_files")
                .update(update_data)
                .eq("id", file_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            self.cli.error(f"Error marking file as completed: {e}")
            return False

    def mark_as_failed(self, file_id: str, error_message: str) -> bool:
        """
        Mark a file as failed.

        Args:
            file_id (str): ID of the file record
            error_message (str): Error message

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = (
                supabase.table("processed_ftp_files")
                .update(
                    {
                        "status": "failed",
                        "error_message": str(error_message)[
                            :500
                        ],  # Limit error message length
                        "processed_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", file_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            self.cli.error(f"Error marking file as failed: {e}")
            return False

    def mark_as_processing(self, file_id: str) -> bool:
        """
        Mark a file as currently being processed.

        Args:
            file_id (str): ID of the file record

        Returns:
            bool: True if successful, False otherwise
        """
        try:
            result = (
                supabase.table("processed_ftp_files")
                .update(
                    {
                        "status": "processing",
                        "last_checked_at": datetime.now().isoformat(),
                    }
                )
                .eq("id", file_id)
                .execute()
            )

            return bool(result.data)

        except Exception as e:
            self.cli.error(f"Error marking file as processing: {e}")
            return False

    def get_queue_stats(self) -> Dict[str, int]:
        """
        Get statistics about the queue.

        Returns:
            Dict[str, int]: Queue statistics
        """
        try:
            # Get counts for each status using the correct status values
            statuses = ["pending", "processing", "completed", "failed"]
            stats = {}

            for status in statuses:
                result = (
                    supabase.table("processed_ftp_files")
                    .select("id", count="exact")
                    .eq("status", status)
                    .execute()
                )
                stats[status] = result.count or 0

            stats["total"] = sum(stats.values())
            return stats

        except Exception as e:
            self.cli.error(f"Error getting queue stats: {e}")
            return {
                "pending": 0,
                "processing": 0,
                "completed": 0,
                "failed": 0,
                "total": 0,
            }

    def get_pending_files(self, limit: int = 10) -> list:
        """
        Get pending files from the queue.

        Args:
            limit (int): Maximum number of files to retrieve

        Returns:
            list: List of pending file records
        """
        try:
            result = (
                supabase.table("processed_ftp_files")
                .select("*")
                .eq("status", "pending")
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )

            if result.data:
                logger.info(f"[DB_QUEUE]: Retrieved {len(result.data)} pending files")
                return result.data
            else:
                return []

        except Exception as e:
            logger.error(f"[DB_QUEUE]: Error retrieving pending files: {str(e)}")
            return []

    def update_file_status(
        self,
        id: str,
        file_name: str,
        provider_name: str,
        status: str,
        file_hash: Optional[str] = None,
        storage_info: Optional[Dict[str, Any]] = None,
    ):

        try:

            timestamp = datetime.now().isoformat()
            update_data = {
                "status": status,
                "processed_at": timestamp if status != "processing" else None,
                "last_checked_at": timestamp,
                "error_message": None,
            }

            # Add storage information if provided
            if storage_info:
                update_data["storage_path"] = storage_info.get("storage_path")
                update_data["storage_bucket"] = storage_info.get("bucket_name")
                update_data["public_url"] = storage_info.get("public_url")

            # Base data for upsert
            upsert_data = {
                "id": id,
                "hospital_name": provider_name,
                "file_name": file_name,
                **update_data,
            }

            # Add file_hash if provided
            if file_hash:
                upsert_data["file_hash"] = file_hash

            # Strategy 3: Check if record exists and update, or insert new
            existing = (
                supabase.table("processed_ftp_files")
                .select("id")
                .match(
                    {"hospital_name": provider_name, "file_name": file_name, "id": id}
                )
                .limit(1)
                .execute()
            )

            if existing.data:
                supabase.table("processed_ftp_files").update(update_data).eq(
                    "id", existing.data[0]["id"]
                ).execute()
            else:
                supabase.table("processed_ftp_files").insert(upsert_data).execute()

            # If we get here, the operation was successful
            status_indicator = (
                "[SUCCESS]"
                if status == "completed"
                else ("[WARNING]" if status == "failed" else "[INFO]")
            )
            self.cli.info(
                f"{status_indicator} [FILE-PROCESSOR]: {provider_name}/{file_name} to {status}"
            )
            return  # Success, exit the retry loop

        except Exception as e:

            self.cli.error(
                f" [FILE-PROCESSOR]: Failed to update status for {provider_name}/{file_name}: {e}"
            )
            return


# Global database queue instance
db_queue = DBQueue()
