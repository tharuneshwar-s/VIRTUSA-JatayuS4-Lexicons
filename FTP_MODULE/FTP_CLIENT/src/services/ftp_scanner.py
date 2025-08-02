"""
Simple FTP Scanner

Scans FTP directories and queues files for processing.
Simplified version without complex hash checking and concurrent processing.
"""

import os
from typing import List, Dict, Any

from src.config.config import CONTAINER_FTP_MOUNT_PATH
from src.config.supabase_config import supabase
from src.monitoring.logger import logger
from src.utils.cli_output import get_cli
from src.database.db_queue import DBQueue


class FTPScanner:
    """
    Simple FTP scanner that scans directories and queues files.
    """

    def __init__(self):
        """Initialize the FTP scanner."""
        self.cli = get_cli("ftp_scanner.py")

        self.stats = {
            "sources_scanned": 0,
            "files_found": 0,
            "files_queued": 0,
            "files_skipped": 0,
            "errors": 0,
        }

        self.db_queue = DBQueue()

    def get_active_sources(self) -> List[Dict[str, str]]:
        """
        Get active FTP sources from database.

        Returns:
            List[Dict[str, str]]: List of active FTP sources
        """
        try:
            result = (
                supabase.table("ftp_sources")
                .select("uuid, provider_name, remote_path")
                .eq("is_active", True)
                .execute()
            )

            if result.data:
                self.cli.success(f"Found {len(result.data)} active FTP sources")
                return result.data
            else:
                self.cli.warning("No active FTP sources found")
                return []

        except Exception as e:
            self.cli.error(f"Error getting active sources: {str(e)}")
            self.stats["errors"] += 1
            return []

    async def scan_files(self) -> Dict[str, int]:
        """
        Main scan function:
        1. Get active sources
        2. Process each source
        3. Read files from source directly
        4. Queue new files for processing

        Returns:
            Dict[str, int]: Scanning statistics
        """
        self.cli.section("Starting FTP scan", "🔍")

        # Reset stats for new scan cycle
        self.stats = {
            "sources_scanned": 0,
            "files_found": 0,
            "files_queued": 0,
            "files_skipped": 0,
            "errors": 0,
        }

        # Step 1: Get active sources
        active_sources = self.get_active_sources()

        if not active_sources:
            self.cli.warning("No active FTP sources found")
            return self.stats

        # Step 2: Process each source
        for source in active_sources:
            try:
                await self._process_source(source)
            except Exception as e:
                self.cli.error(
                    f"Error processing source {source.get('provider_name', 'unknown')}: {str(e)}"
                )
                self.stats["errors"] += 1
                continue

        # Print final stats
        self._print_stats()
        logger.info("[SCANNER]: FTP scan completed")
        return self.stats

    async def _process_source(self, source: Dict[str, str]) -> None:
        """
        Process a single FTP source.

        Args:
            source (Dict[str, str]): FTP source configuration
        """
        source_uuid = source["uuid"]
        provider_name = source["provider_name"]
        remote_path = source.get("remote_path", "")

        if not all([source_uuid, provider_name]):
            self.cli.warning("Source UUID or provider name is missing, skipping source")
            return

        self.cli.step(f"Processing source: {provider_name}")

        # Step 3: Read files from source directly
        scan_directory = os.path.join(CONTAINER_FTP_MOUNT_PATH, remote_path.lstrip("/"))

        # Validate directory exists
        if not os.path.isdir(scan_directory):
            self.cli.warning(f"Directory not found: {scan_directory}")
            return

        # Get CSV and Excel files
        files = self._get_files(scan_directory)

        if not files:
            self.cli.info(f"No files found for {provider_name}")
            self._update_source_processed(source_uuid)
            return

        self.stats["files_found"] += len(files)
        self.cli.info(f"Found {len(files)} files")

        # Step 4: Queue new files for processing
        await self._queue_files(source_uuid, provider_name, scan_directory, files)

        # Update source tracking
        self._update_source_processed(source_uuid)

    def _get_files(self, directory: str) -> List[str]:
        """
        Get CSV and Excel files from a directory.

        Args:
            directory (str): Directory to scan

        Returns:
            List[str]: List of CSV and Excel filenames
        """
        try:
            if not os.path.exists(directory):
                self.cli.warning(f"Directory does not exist: {directory}")
                return []

            files = [
                f
                for f in os.listdir(directory)
                if os.path.isfile(os.path.join(directory, f))
                and (f.lower().endswith(".csv") or f.lower().endswith(".xlsx"))
            ]

            return files

        except Exception as e:
            self.cli.error(f"Error scanning directory {directory}: {str(e)}")
            self.stats["errors"] += 1
            return []

    async def _queue_files(
        self,
        source_uuid: str,
        provider_name: str,
        scan_directory: str,
        files: List[str],
    ) -> None:
        """
        Queue files for processing.

        Args:
            source_uuid (str): UUID of the FTP source
            provider_name (str): Name of the provider
            scan_directory (str): Directory containing the files
            files (List[str]): List of filenames to queue
        """

        for filename in files:
            try:
                file_path = os.path.join(scan_directory, filename)

                # Queue the file using the new enqueue_file method
                if await self.db_queue.enqueue_file(
                    source_uuid, provider_name, filename, file_path
                ):
                    self.stats["files_queued"] += 1
                    self.cli.info(f"Queued file: {filename}")
                else:
                    self.stats["files_skipped"] += 1

            except Exception as e:
                self.cli.error(f"Error queuing file {filename}: {e}")
                self.stats["errors"] += 1

    def _update_source_processed(self, source_uuid: str) -> None:
        """
        Update source last checked timestamp.

        Args:
            source_uuid (str): UUID of the FTP source
        """
        if self.db_queue.update_source_last_checked(source_uuid):
            self.stats["sources_scanned"] += 1
        else:
            self.cli.warning(f"Failed to update last_checked for source {source_uuid}")
            self.stats["errors"] += 1

    def _print_stats(self):
        """Print scanning statistics."""
        self.cli.summary(self.stats)
        self.cli.info(f"Scan Complete - {self.stats}")


# Global scanner instance
simple_scanner = FTPScanner()
