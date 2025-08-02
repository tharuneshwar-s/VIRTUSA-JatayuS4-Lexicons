""" """

import asyncio
import time
from datetime import datetime
from croniter import croniter
from typing import Dict, Any

from src.services.ftp_scanner import FTPScanner
from src.data.processor.ftp_processor import FTPProcessor
from src.database.db_queue import DBQueue
from src.monitoring.logger import logger
from src.utils.cli_output import get_cli
from src.config.config import FETCH_CRON_EXPRESSION


class HealthcareFTPOrchestrator:

    def __init__(self):
        """Initialize the orchestrator."""
        self.cli = get_cli("orchestrator.py")

        # Initialize components
        self.scanner = FTPScanner()
        self.db_queue = DBQueue()
        self.processor = FTPProcessor()

        # Configuration
        self.cron_expr = FETCH_CRON_EXPRESSION
        self.running = False

    async def run(self) -> Dict[str, Any]:
        """
        Execute the main processing workflow:
        1. Scan and queue files
        2. Process queued files

        Returns:
            Dict[str, Any]: Results of the processing cycle
        """
        self.cli.section("Starting Healthcare FTP Processing Cycle", "🏥")
        start_time = datetime.now()

        try:
            # Phase 1: Scan and queue files
            self.cli.step("Scanning and Queuing Files")
            scan_results = await self.scan_and_queue_files()

            # Phase 2: Process queued files
            self.cli.step("Processing Queued Files")
            process_results = await self.process_files()

            # Calculate total duration
            duration = (datetime.now() - start_time).total_seconds()

            # Compile results
            results = {
                "scan_results": scan_results,
                "process_results": process_results,
                "total_duration": duration,
                "timestamp": start_time.isoformat(),
            }

            self.cli.success(f"Processing cycle completed in {duration:.2f}s")
            logger.info(f"[ORCHESTRATOR]: Cycle completed - {results}")

            return results

        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            error_msg = f"Processing cycle failed after {duration:.2f}s: {str(e)}"

            self.cli.error(error_msg)
            logger.error(f"[ORCHESTRATOR]: {error_msg}", exc_info=True)

            return {
                "error": str(e),
                "duration": duration,
                "timestamp": start_time.isoformat(),
            }

    async def scan_and_queue_files(self) -> Dict[str, Any]:
        """
        Scan FTP sources and queue new files for processing.

        Returns:
            Dict[str, Any]: Scan results
        """
        try:
            self.cli.info("Scanning FTP sources for new files...")
            results = await self.scanner.scan_files()

            files_queued = results.get("files_queued", 0)
            if files_queued > 0:
                self.cli.success(f"Queued {files_queued} files for processing")
            else:
                self.cli.info("No new files found to queue")

            return results

        except Exception as e:
            self.cli.error(f"Scan and queue failed: {str(e)}")
            logger.error(f"[ORCHESTRATOR]: Scan failed: {str(e)}", exc_info=True)
            raise

    async def process_files(self) -> Dict[str, Any]:
        """
        Process all queued files using the FTP processor.

        Returns:
            Dict[str, Any]: Processing results
        """
        try:
            self.cli.info("Processing queued files...")

            queue_stats = self.db_queue.get_queue_stats()
            pending_count = queue_stats.get("pending", 0)

            if pending_count == 0:
                self.cli.info("No files queued for processing")
                return {
                    "message": "No files queued for processing",
                    "stats": queue_stats,
                }

            self.cli.progress(f"Found {pending_count} pending files to process")

            # Use the FTP processor to handle all pending files
            results = await self.processor.process_pending_files()

            # Log summary
            if results.get("total_files", 0) > 0:
                success_count = results.get("success", 0)
                failed_count = results.get("failed", 0)
                skipped_count = results.get("skipped", 0)
                total_processed = results.get("total_processed", 0)

                if total_processed > 0:
                    success_rate = (
                        (success_count / total_processed) * 100
                        if total_processed > 0
                        else 0
                    )
                    self.cli.success(
                        f"Processed {total_processed} files: {success_count} successful, "
                    )
                    self.cli.success(
                        f"{failed_count} failed, {skipped_count} skipped ({success_rate:.1f}% success)"
                    )

            return results

        except Exception as e:
            self.cli.error(f"File processing failed: {str(e)}")
            logger.error(f"[ORCHESTRATOR]: Processing failed: {str(e)}", exc_info=True)
            raise

    async def run_once(self) -> Dict[str, Any]:
        """
        Run a single processing cycle.

        Returns:
            Dict[str, Any]: Results of the single cycle
        """
        self.cli.banner("Single Processing Cycle")
        return await self.run()

    async def run_scheduled(self) -> None:
        """
        Run the orchestrator on a schedule defined by FETCH_CRON_EXPRESSION.
        Continues until stopped.
        """
        self.cli.banner("Scheduled Healthcare FTP Processing")
        self.cli.info(f"Schedule: {self.cron_expr}")

        try:
            # Initialize scheduler
            from datetime import timezone

            now = datetime.now(timezone.utc)
            cron = croniter(self.cron_expr, now)
            next_run = cron.get_next(datetime)
            last_cleanup = datetime.now()
            last_health_check = datetime.now()

            self.cli.info(f"Next run: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")

            self.running = True

            # Initial cycle
            await self.run()

            # Main processing loop
            while self.running:
                current_time = datetime.now(timezone.utc)

                # Check for scheduled run
                if current_time >= next_run:
                    await self.run()
                    next_run = cron.get_next(datetime)
                    self.cli.info(f"Next run: {next_run.strftime('%Y-%m-%d %H:%M:%S')}")

                # Check for cleanup
                cleanup_interval_seconds = 24 * 3600  # 24 hours default
                if (
                    datetime.now() - last_cleanup
                ).total_seconds() >= cleanup_interval_seconds:
                    # TODO: Implement cleanup_old_records method
                    self.cli.info(
                        "Cleanup interval reached - cleanup not implemented yet"
                    )
                    last_cleanup = datetime.now()

                # Check for health check
                health_check_interval = 300  # 5 minutes default
                if (
                    datetime.now() - last_health_check
                ).total_seconds() >= health_check_interval:
                    health_status = await self.health_check()
                    if health_status.get("healthy", False):
                        self.cli.info("Health check passed")
                    else:
                        self.cli.warning("Health check failed")
                    last_health_check = datetime.now()

                # Sleep
                await asyncio.sleep(1)

        except asyncio.CancelledError:
            self.cli.warning("Scheduled processing cancelled")
        except KeyboardInterrupt:
            self.cli.warning("Scheduled processing interrupted by user")
        finally:
            self.running = False
            self.cli.info("Scheduled processing stopped")

    async def shutdown(self) -> None:
        """Shutdown the orchestrator gracefully."""
        self.cli.info("Shutting down orchestrator...")
        self.running = False
        logger.info("[ORCHESTRATOR]: Shutdown complete")

    async def health_check(self) -> Dict[str, Any]:
        """
        Perform a health check of the system.

        Returns:
            Dict[str, Any]: Health status
        """
        try:
            # Test database connectivity
            from config.supabase_config import supabase

            supabase.table("ftp_sources").select("uuid").limit(1).execute()

            # Test FTP mount path
            from config.config import CONTAINER_FTP_MOUNT_PATH
            import os

            mount_exists = os.path.exists(CONTAINER_FTP_MOUNT_PATH)

            health_status = {
                "healthy": True,
                "database": "connected",
                "ftp_mount": "accessible" if mount_exists else "not_found",
                "timestamp": datetime.now().isoformat(),
            }

            if not mount_exists:
                health_status["healthy"] = False

            return health_status

        except Exception as e:
            return {
                "healthy": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
            }


# Global orchestrator instance
orchestrator = HealthcareFTPOrchestrator()
