"""
FTP File Processor

Processes pending files from the queue using sequential processing.
Handles file parsing, change detection, and data processing.
"""

import os
from typing import Dict, Any, List
from datetime import datetime
from dataclasses import dataclass
import pandas as pd
from tqdm import tqdm

from src.config.config import (
    CONTAINER_FTP_MOUNT_PATH,
    DELETE_AFTER_PROCESS,
    UPLOAD_TO_SUPABASE,
)
from src.monitoring.logger import logger
from src.utils.cli_output import get_cli
from src.utils.colors import Colors
from src.data.parsing.file_parser import parse_files
from src.data.processor.data_processor import DataProcessor
from src.services.change_detector import ChangeDetector
from src.storage.storage_manager import StorageManager
from src.database.db_queue import DBQueue


@dataclass
class ProcessingTask:
    """Data class for processing task information."""

    file_id: str
    file_path: str
    hospital_name: str
    file_name: str
    source_provider_uuid: str


class FTPProcessor:
    """
    FTP file processor that handles pending files from the queue.
    """

    def __init__(self, batch_size: int = 10, change_detection_enabled=True):
        """
        Initialize the FTP processor.

        Args:
            batch_size (int): Maximum number of files to process in a batch
        """
        self.cli = get_cli("ftp_processor.py")
        self.batch_size = batch_size

        # Processing statistics
        self.stats = {
            "total_files": 0,
            "success": 0,
            "failed": 0,
            "skipped": 0,
            "total_rows": 0,
            "start_time": None,
            "end_time": None,
            "total_processed": 0,
        }

        self.change_detection_enabled = change_detection_enabled

        self.data_processor = DataProcessor()
        self.detector = ChangeDetector()
        self.storage_manager = StorageManager()
        self.db_queue = DBQueue()

        # Log configuration status
        if DELETE_AFTER_PROCESS:
            self.cli.info(
                "DELETE_AFTER_PROCESS enabled - files will be deleted after successful processing"
            )
        else:
            self.cli.info(
                "DELETE_AFTER_PROCESS disabled - files will be kept after processing"
            )

    async def process_pending_files(self) -> Dict[str, Any]:
        """
        Process all pending files using sequential processing.

        Returns:
            Dict[str, Any]: Processing statistics
        """
        self.stats.update(
            {
                "total_files": 0,
                "success": 0,
                "failed": 0,
                "skipped": 0,
                "total_rows": 0,
                "start_time": datetime.now(),
                "end_time": None,
                "total_processed": 0,
            }
        )

        self.cli.info("Started Processing")

        try:
            # Get pending files from database
            pending_files = self.db_queue.get_pending_files(limit=self.batch_size)

            if not pending_files:
                print(
                    f"{Colors.OKCYAN}ℹ️ [FTP-PROCESSOR]: No pending files to process{Colors.ENDC}"
                )
                logger.info("[FTP-PROCESSOR]: No pending files to process")

                self.stats["end_time"] = datetime.now()
                return self.get_stats()

            print(
                f"{Colors.OKCYAN}📁 [FTP-PROCESSOR]: Found {len(pending_files)} pending files{Colors.ENDC}"
            )
            logger.info(f"[FTP-PROCESSOR]: Found {len(pending_files)} pending files")

            self.stats["total_files"] = len(pending_files)

            # Create processing tasks
            tasks = []
            for file_info in pending_files:
                file_path = os.path.join(
                    CONTAINER_FTP_MOUNT_PATH,
                    file_info.get("hospital_name", ""),
                    file_info["file_name"],
                )

                print(
                    f"🔍 [FTP-PROCESSOR]: Preparing task for {file_info['file_name']} at {file_path}"
                )

                # Check if file exists
                if not os.path.exists(file_path):
                    logger.warning(f"[FTP-PROCESSOR]: File not found: {file_path}")
                    self.update_stats("skipped")
                    continue

                task = ProcessingTask(
                    file_id=file_info["id"],
                    file_path=file_path,
                    hospital_name=file_info.get("hospital_name", ""),
                    file_name=file_info["file_name"],
                    source_provider_uuid=file_info.get("source_provider_uuid", ""),
                )
                tasks.append(task)

            if not tasks:
                print(
                    f"{Colors.WARNING}⚠️ [FTP-PROCESSOR]: No valid files found to process{Colors.ENDC}"
                )
                logger.warning("[FTP-PROCESSOR]: No valid files found to process")

                self.stats["end_time"] = datetime.now()
                return self.get_stats()

            # Process files sequentially
            print(
                f"{Colors.OKCYAN}🚀 [FTP-PROCESSOR]: Processing {len(tasks)} files sequentially{Colors.ENDC}"
            )

            results = []

            # Process each task sequentially
            for task in tasks:
                try:
                    result = self.process_single_file(task)
                    results.append(result)

                    # Update database status using database queue methods (ID-based)
                    if result["status"] == "success":
                        success = self.db_queue.mark_as_completed(task.file_id)
                        if not success:
                            logger.warning(
                                f"Failed to mark file {task.file_name} as completed"
                            )
                        else:
                            # Delete file after successful processing if configured
                            if DELETE_AFTER_PROCESS:
                                try:
                                    if os.path.exists(task.file_path):
                                        os.remove(task.file_path)
                                        self.cli.success(
                                            f"Deleted processed file: {task.file_name}"
                                        )
                                        logger.info(
                                            f"[FTP-PROCESSOR]: Deleted processed file: {task.file_path}"
                                        )
                                    else:
                                        logger.warning(
                                            f"[FTP-PROCESSOR]: File not found for deletion: {task.file_path}"
                                        )
                                except Exception as e:
                                    self.cli.warning(
                                        f"Failed to delete file {task.file_name}: {e}"
                                    )
                                    logger.error(
                                        f"[FTP-PROCESSOR]: Failed to delete file {task.file_path}: {e}"
                                    )
                    else:
                        error_message = result.get("error", "Unknown error")
                        success = self.db_queue.mark_as_failed(
                            task.file_id, error_message
                        )
                        if not success:
                            logger.warning(
                                f"Failed to mark file {task.file_name} as failed"
                            )

                    
                    # Clean UP
                    self.data_processor.clear_caches()
                except Exception as e:
                    logger.error(
                        f"[FTP-PROCESSOR]: Unexpected error processing {task.file_name}: {e}"
                    )
                    self.update_stats("failed")
                    results.append(
                        {
                            "status": "failed",
                            "file_id": task.file_id,
                            "file_name": task.file_name,
                            "hospital_name": task.hospital_name,
                            "error": str(e),
                        }
                    )

            # Final statistics
            self.stats["end_time"] = datetime.now()
            self.stats["total_processed"] = len(results)

            return self.get_stats()

        except Exception as e:
            logger.error(
                f"[FTP-PROCESSOR]: Error during processing: {e}", exc_info=True
            )
            self.stats["end_time"] = datetime.now()
            raise

    def process_single_file(self, task: ProcessingTask) -> Dict[str, Any]:
        """
        Process a single file.

        Args:
            task (ProcessingTask): Processing task information

        Returns:
            Dict[str, Any]: Processing result
        """
        start_time = datetime.now()

        try:
            # Mark as processing
            if not self.db_queue.mark_as_processing(task.file_id):
                logger.warning(f"Failed to mark file {task.file_name} as processing")

            self.cli.info(f"Processing {task.file_name}...")

            # Check if already processed (additional safety check)
            # Skip this check if change detection is enabled, as we want to allow reprocessing for change detection
            if (
                not self.change_detection_enabled
                and self.db_queue.is_file_already_processed(
                    task.hospital_name, task.file_name
                )
            ):
                print(
                    f"⏭️ [FTP-PROCESSOR]: File {task.file_name} already processed, skipping"
                )
                self.update_stats("skipped")
                return {
                    "status": "skipped",
                    "file_id": task.file_id,
                    "file_name": task.file_name,
                    "hospital_name": task.hospital_name,
                    "message": "Already processed",
                }
            elif self.change_detection_enabled:
                print(
                    f"🔄 [FTP-PROCESSOR]: Change detection enabled - processing {task.file_name} for potential updates"
                )

            # Parse file using file parser
            try:
                parsed_data = parse_files(task.file_path)

                # Check if parsed data is empty
                if parsed_data is None:
                    raise Exception("No data parsed from file")

                # Convert DataFrame to list of dictionaries if it's a DataFrame
                if isinstance(parsed_data, pd.DataFrame):
                    if parsed_data.empty:
                        raise Exception("No data parsed from file - DataFrame is empty")
                    parsed_data_list = parsed_data.to_dict("records")
                    logger.info(
                        f"[FTP-PROCESSOR]: Converted DataFrame with {len(parsed_data_list)} rows to list of dicts"
                    )
                elif isinstance(parsed_data, list):
                    # Already a list
                    if not parsed_data:
                        raise Exception("No data parsed from file - list is empty")
                    parsed_data_list = parsed_data
                    logger.info(
                        f"[FTP-PROCESSOR]: Using existing list with {len(parsed_data_list)} rows"
                    )
                else:
                    # Handle other formats
                    if not parsed_data:
                        raise Exception("No data parsed from file")

                    # Debug: log the type and content of parsed_data
                    logger.warning(
                        f"[FTP-PROCESSOR]: Unexpected parsed_data type: {type(parsed_data)}"
                    )
                    logger.warning(
                        f"[FTP-PROCESSOR]: First 100 chars of parsed_data: {str(parsed_data)[:100]}"
                    )

                    # Check if it's a string (error condition)
                    if isinstance(parsed_data, str):
                        raise Exception(
                            f"Parsed data is a string, expected DataFrame or list. Content: {parsed_data[:200]}..."
                        )

                    # Try to convert to list if it's iterable
                    try:
                        parsed_data_list = list(parsed_data)

                        # Validate that the list contains dictionaries, not strings
                        if parsed_data_list and not isinstance(
                            parsed_data_list[0], dict
                        ):
                            if isinstance(parsed_data_list[0], str):
                                raise Exception(
                                    f"Parsed data list contains strings instead of dictionaries. First item: {parsed_data_list[0]}"
                                )
                            else:
                                logger.warning(
                                    f"[FTP-PROCESSOR]: List contains {type(parsed_data_list[0])}, attempting conversion"
                                )

                        logger.info(
                            f"[FTP-PROCESSOR]: Converted {type(parsed_data)} to list with {len(parsed_data_list)} rows"
                        )
                    except (TypeError, ValueError) as e:
                        raise Exception(
                            f"Cannot convert parsed data of type {type(parsed_data)} to list: {e}"
                        )

                # Change detection
                if self.change_detection_enabled:
                    self.cli.info(f"Running change detection for {task.file_name}...")

                    # Validate parsed_data_list before creating DataFrame
                    if not parsed_data_list:
                        self.cli.warning("Empty dataset - skipping change detection")
                    elif not isinstance(parsed_data_list[0], dict):
                        self.cli.error(
                            f"Invalid data format for change detection: expected dict, got {type(parsed_data_list[0])}"
                        )
                        self.cli.warning(
                            "Skipping change detection due to data format issues"
                        )
                    else:
                        try:
                            df = pd.DataFrame(parsed_data_list)

                            # Extract provider info from the first row for provider-specific detection
                            if not df.empty:
                                first_row = df.iloc[0]
                                provider_info = {
                                    "name": str(first_row.get("Provider Name", "")),
                                    "city": str(first_row.get("City", "")),
                                    "state": str(first_row.get("State", "")),
                                    "zip_code": str(first_row.get("Zip Code", "")),
                                }

                                # Perform provider-specific change detection and deletion
                                change_result = self.detector.detect_and_delete_missing_records_for_provider(
                                    df, provider_info
                                )

                                if change_result["success"]:
                                    self.cli.success(
                                        f"Change detection completed: {change_result['summary']}"
                                    )
                                    if (
                                        change_result.get("deleted_counts", {}).get(
                                            "total", 0
                                        )
                                        > 0
                                    ):
                                        self.cli.info(
                                            f"Deleted {change_result['deleted_counts']['total']} obsolete records"
                                        )
                                else:
                                    self.cli.warning(
                                        f"Change detection failed: {change_result.get('error', 'Unknown error')}"
                                    )

                            else:
                                self.cli.warning(
                                    "Empty DataFrame - skipping change detection"
                                )

                        except Exception as e:
                            self.cli.error(f"Change detection error: {e}")
                            self.cli.warning(
                                "Continuing with data processing despite change detection failure"
                            )

                # Process data one by one
                result = self.process_one_by_one(task, parsed_data_list)

                if result["success"]:
                    self.update_stats("success")
                    print(
                        f"✅ [FTP-PROCESSOR]: Successfully processed {task.file_name}"
                    )

                    self.stats["total_rows"] += result.get("total_rows", 0)

                    return {
                        "status": "success",
                        "file_id": task.file_id,
                        "file_name": task.file_name,
                        "hospital_name": task.hospital_name,
                        "rows_processed": result.get("rows_processed", 0),
                        "rows_successful": result.get("rows_successful", 0),
                        "rows_failed": result.get("rows_failed", 0),
                        "total_rows": result.get("total_rows", 0),
                        "processor_stats": result.get("processor_stats", {}),
                        "processing_time": (
                            datetime.now() - start_time
                        ).total_seconds(),
                    }
                else:
                    raise Exception(result.get("error", "Processing failed"))

            except Exception as e:
                raise Exception(f"File parsing failed: {str(e)}")

        except Exception as e:
            self.update_stats("failed")
            error_message = str(e)
            print(
                f"❌ [FTP-PROCESSOR]: Failed to process {task.file_name}: {error_message}"
            )
            logger.error(
                f"[FTP-PROCESSOR]: Failed to process {task.file_name}: {error_message}"
            )

            return {
                "status": "failed",
                "file_id": task.file_id,
                "file_name": task.file_name,
                "hospital_name": task.hospital_name,
                "error": error_message,
                "processing_time": (datetime.now() - start_time).total_seconds(),
            }

    def process_one_by_one(
        self, task: ProcessingTask, parsed_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Process parsed data one by one using DataProcessor.

        Args:
            task (ProcessingTask): Processing task information
            parsed_data (List[Dict[str, Any]]): Parsed file data as list of dictionaries

        Returns:
            Dict[str, Any]: Processing result
        """
        try:
            print(
                f"🔄 [FTP-PROCESSOR]: Processing {len(parsed_data)} rows for {task.file_name}"
            )

            # Debug: Check the type of parsed_data and first few elements
            logger.info(f"[FTP-PROCESSOR]: Data type: {type(parsed_data)}")
            if len(parsed_data) > 0:
                logger.info(f"[FTP-PROCESSOR]: First row type: {type(parsed_data[0])}")
                logger.info(
                    f"[FTP-PROCESSOR]: First row content: {str(parsed_data[0])[:200]}"
                )
                if hasattr(parsed_data[0], "keys"):
                    logger.info(
                        f"[FTP-PROCESSOR]: First row keys: {list(parsed_data[0].keys())[:5]}..."
                    )
                elif isinstance(parsed_data[0], str):
                    logger.error(
                        f"[FTP-PROCESSOR]: First row is a string: {parsed_data[0][:100]}..."
                    )
                    logger.error(
                        f"[FTP-PROCESSOR]: All items: {[str(item)[:50] for item in parsed_data[:3]]}"
                    )
                    raise Exception(
                        "Parsed data contains strings instead of dictionaries"
                    )

            rows_processed = 0
            rows_successful = 0
            rows_failed = 0

            # Use tqdm for progress bar
            with tqdm(
                total=len(parsed_data),
                desc=f"Processing {task.file_name}",
                unit="rows",
                ncols=100,
            ) as pbar:
                for row_index, row_data in enumerate(parsed_data):
                    try:
                        # Convert row to dictionary if it's not already
                        if isinstance(row_data, dict):
                            row_dict = row_data
                        elif hasattr(row_data, "to_dict"):
                            # Handle pandas Series
                            row_dict = row_data.to_dict()
                        elif hasattr(row_data, "__iter__") and not isinstance(
                            row_data, (str, bytes)
                        ):
                            # Handle other iterable types but exclude strings and bytes
                            try:
                                row_dict = dict(row_data)
                            except (ValueError, TypeError):
                                logger.warning(
                                    f"[FTP-PROCESSOR]: Could not convert row {row_index} to dict, skipping"
                                )
                                rows_failed += 1
                                pbar.update(1)
                                continue
                        else:
                            # Handle other types - create a simple dict
                            logger.warning(
                                f"[FTP-PROCESSOR]: Unexpected row type {type(row_data)} at index {row_index}, skipping"
                            )
                            rows_failed += 1
                            pbar.update(1)
                            continue

                        # Process individual row using DataProcessor
                        success, error_msg = self.data_processor.process_row(row_dict)

                        if success:
                            rows_successful += 1
                        else:
                            rows_failed += 1
                            if error_msg:
                                logger.warning(
                                    f"[FTP-PROCESSOR]: Row {row_index} processing failed: {error_msg}"
                                )

                        rows_processed += 1
                        pbar.update(1)

                        # Log progress every 100 rows (less frequent than tqdm updates)
                        if row_index % 100 == 0 and row_index > 0:
                            print(
                                f"📊 [FTP-PROCESSOR]: Processed {row_index}/{len(parsed_data)} rows "
                                f"({rows_successful} successful, {rows_failed} failed)"
                            )

                    except Exception as e:
                        rows_failed += 1
                        rows_processed += 1
                        logger.warning(
                            f"[FTP-PROCESSOR]: Error processing row {row_index}: {e}"
                        )
                        pbar.update(1)
                        continue

            # Get final statistics from data processor
            processor_stats = self.data_processor.get_stats()

            print(f"✅ [FTP-PROCESSOR]: Completed processing {task.file_name}")
            print(
                f"📊 [FTP-PROCESSOR]: Final stats - {rows_successful} successful, {rows_failed} failed"
            )
            print(f"📊 [FTP-PROCESSOR]: Entities created - {processor_stats}")

            # Perform database insertion
            print(
                f"💾 [FTP-PROCESSOR]: Starting database insertion for {task.file_name}"
            )
            insertion_results = self.data_processor.do_database_insertion()

            # Log insertion results
            if insertion_results.get("errors"):
                print(
                    f"⚠️ [FTP-PROCESSOR]: Database insertion completed with {len(insertion_results['errors'])} errors"
                )
                for error in insertion_results["errors"]:
                    logger.error(f"[FTP-PROCESSOR]: Database insertion error: {error}")
            else:
                total_db_inserts = (
                    insertion_results.get("providers_inserted", 0)
                    + insertion_results.get("services_inserted", 0)
                    + insertion_results.get("insurances_inserted", 0)
                    + insertion_results.get("provider_services_inserted", 0)
                    + insertion_results.get("service_insurance_inserted", 0)
                    + insertion_results.get("service_pricing_inserted", 0)
                )
                print(
                    f"✅ [FTP-PROCESSOR]: Successfully inserted {total_db_inserts} database records"
                )

            # Upload to storage if file paht provivded
            storage_info = None
            if UPLOAD_TO_SUPABASE and task.file_path:
                try:
                    storage_info = self.storage_manager.upload_file(
                        file_path=task.file_path,
                        provider_name=task.hospital_name,
                        filename=task.file_name,
                    )
                    if storage_info:
                        self.cli.success(f"Uploaded processed file to storage")
                except Exception as e:
                    self.cli.error(f"Failed to upload file to storage: {e}")

                self.db_queue.update_file_status(
                    task.file_id,
                    file_name=task.file_name,
                    provider_name=task.hospital_name,
                    status="completed",
                    storage_info=storage_info,
                )

            return {
                "success": True,
                "rows_processed": rows_processed,
                "rows_successful": rows_successful,
                "rows_failed": rows_failed,
                "total_rows": len(parsed_data),
                "processor_stats": processor_stats,
                "insertion_results": insertion_results,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "rows_processed": rows_processed if "rows_processed" in locals() else 0,
                "rows_successful": (
                    rows_successful if "rows_successful" in locals() else 0
                ),
                "rows_failed": rows_failed if "rows_failed" in locals() else 0,
            }

    def update_stats(self, stat_type: str, count: int = 1):
        """
        Update processing statistics.

        Args:
            stat_type (str): Type of statistic to update
            count (int): Amount to increment
        """
        if stat_type in self.stats:
            self.stats[stat_type] += count

    def get_stats(self) -> Dict[str, Any]:
        """
        Get current processing statistics.

        Returns:
            Dict[str, Any]: Current statistics
        """
        stats_copy = self.stats.copy()

        # Calculate processing time if available
        if stats_copy["start_time"] and stats_copy["end_time"]:
            processing_time = (
                stats_copy["end_time"] - stats_copy["start_time"]
            ).total_seconds()
            stats_copy["processing_time_seconds"] = processing_time

        return stats_copy


# Global processor instance
ftp_processor = FTPProcessor()
