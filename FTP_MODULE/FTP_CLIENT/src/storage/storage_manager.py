"""
Storage Manager Module

Handles file upload to Supabase Storage bucket.
"""

import os
import time
from datetime import datetime
from typing import Optional, Dict, Any
from src.config.supabase_config import supabase, supabase_role
from src.config.config import STORAGE_BUCKET_NAME, DB_RETRY_ATTEMPTS
from src.utils.colors import Colors
from src.utils.cli_output import get_cli


class StorageManager:
    """
    Manages file operations with Supabase Storage.
    """

    def __init__(
        self, bucket_name: str = None, max_retries: int = None, retry_delay: int = 2
    ):
        """
        Initialize the storage manager.

        Args:
            bucket_name (str): Name of the storage bucket (defaults to config.STORAGE_BUCKET_NAME)
            max_retries (int): Maximum number of upload retries (defaults to config.DB_RETRY_ATTEMPTS)
            retry_delay (int): Delay between retries in seconds
        """
        # Initialize CLI with filename context
        self.cli = get_cli("storage_manager.py")

        self.bucket_name = bucket_name or STORAGE_BUCKET_NAME
        self.max_retries = max_retries or DB_RETRY_ATTEMPTS
        self.retry_delay = retry_delay
        self.create_bucket_if_needed()

    def create_bucket_if_needed(self) -> bool:
        """
        Create bucket if it doesn't exist with enhanced error handling.

        Returns:
            bool: True if bucket exists or was created, False on failure
        """
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                # Check if bucket exists
                buckets = supabase_role.storage.list_buckets()
                bucket_names = [bucket.name for bucket in buckets]

                if self.bucket_name not in bucket_names:
                    # Create bucket if it doesn't exist
                    result = supabase_role.storage.create_bucket(
                        self.bucket_name,
                        options={
                            "public": True,
                            "allowedMimeTypes": [
                                "text/csv",
                                "application/octet-stream",
                            ],
                            "fileSizeLimit": 52428800,  # 50MB
                        },
                    )

                    if result and not (hasattr(result, "error") and result.error):
                        print(
                            f"{Colors.OKGREEN}✅ [STORAGE]: Created bucket '{self.bucket_name}'{Colors.ENDC}"
                        )
                        self.cli.success(
                            f"[STORAGE]: Created storage bucket '{self.bucket_name}'"
                        )
                        return True
                    else:
                        error = (
                            getattr(result, "error", "Unknown error")
                            if result
                            else "No result"
                        )
                        raise Exception(f"Failed to create bucket: {error}")
                else:
                    self.cli.info(
                        f"[STORAGE]: Bucket '{self.bucket_name}' already exists"
                    )
                    return True

            except Exception as e:

                if attempt < max_attempts - 1:
                    time.sleep(2**attempt)  # Exponential backoff
                else:

                    return False

        return False

    def generate_storage_path(self, provider_name: str, filename: str) -> str:
        """
        Generate a unique storage path for the file.

        Args:
            provider_name (str): Name of the healthcare provider
            filename (str): Original filename

        Returns:
            str: Unique storage path
        """
        # Create a path structure: provider/year/month/date/filename
        now = datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        date = now.strftime("%d")

        # Clean provider name for path
        clean_provider = provider_name.replace(" ", "_").replace("/", "_").lower()

        # Add timestamp to filename to ensure uniqueness
        name_parts = filename.rsplit(".", 1)
        if len(name_parts) == 2:
            name, ext = name_parts
            timestamp = now.strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{name}_{timestamp}.{ext}"
        else:
            timestamp = now.strftime("%Y%m%d_%H%M%S")
            unique_filename = f"{filename}_{timestamp}"

        storage_path = f"{clean_provider}/{year}/{month}/{date}/{unique_filename}"
        return storage_path

    def upload_file(
        self, file_path: str, provider_name: str, filename: str = None
    ) -> Optional[Dict[str, Any]]:
        """
        Upload a file to the storage bucket with robust error handling and retry logic.

        Args:
            file_path (str): Local path to the file
            provider_name (str): Name of the healthcare provider
            filename (str): Optional custom filename (defaults to basename of file_path)

        Returns:
            Optional[Dict[str, Any]]: Upload result with path and metadata, None if failed
        """
        # Input validation
        if not file_path or not provider_name:
            self.cli.error(
                f"[STORAGE]: Invalid parameters - file_path: {file_path}, provider_name: {provider_name}"
            )
            return None

        if not os.path.exists(file_path):
            self.cli.error(f"[STORAGE]: File not found: {file_path}")
            print(
                f"{Colors.FAIL}❌ [STORAGE]: File not found: {file_path}{Colors.ENDC}"
            )
            return None

        # Check file size and readability
        try:
            file_size = os.path.getsize(file_path)
            if file_size == 0:
                self.cli.error(f"[STORAGE]: File is empty: {file_path}")
                print(
                    f"{Colors.FAIL}❌ [STORAGE]: File is empty: {file_path}{Colors.ENDC}"
                )
                return None

            # Check file is readable
            with open(file_path, "rb") as test_file:
                test_file.read(1)  # Try to read first byte

        except Exception as e:
            self.cli.error(f"[STORAGE]: Cannot read file {file_path}: {str(e)}")
            print(
                f"{Colors.FAIL}❌ [STORAGE]: Cannot read file {file_path}: {str(e)}{Colors.ENDC}"
            )
            return None

        # Use provided filename or extract from path
        if filename is None:
            filename = os.path.basename(file_path)

        # Validate filename
        if not filename or filename.strip() == "":
            self.cli.error(f"[STORAGE]: Invalid filename for file: {file_path}")
            return None

        # Generate unique storage path
        storage_path = self.generate_storage_path(provider_name, filename)

        self.cli.info(
            f"[STORAGE]: Uploading {filename} ({file_size} bytes) to bucket..."
        )
        self.cli.info(
            f"[STORAGE]: Starting upload of {filename} to {storage_path} (size: {file_size} bytes)"
        )

        # Attempt upload with retry logic
        last_error = None
        for attempt in range(self.max_retries):
            try:
                # Read file content
                with open(file_path, "rb") as file:
                    file_content = file.read()

                if len(file_content) != file_size:
                    raise Exception(
                        f"File size mismatch: expected {file_size}, read {len(file_content)}"
                    )

                self.cli.info(f"[STORAGE]: Upload attempt {attempt + 1} for {filename}")

                # Upload to Supabase Storage
                result = supabase_role.storage.from_(self.bucket_name).upload(
                    path=storage_path,
                    file=file_content,
                    file_options={
                        "content-type": "text/csv",
                        "cache-control": "3600",
                        "upsert": "true",  # Allow overwriting if file exists
                    },
                )

                # Enhanced result validation
                self.cli.info(
                    f"[STORAGE]: Upload result type: {type(result)}, value: {result}"
                )

                # Check if upload was successful - handle various response types
                upload_successful = False
                error_details = None

                if result is None:
                    error_details = "Upload result is None - possible network issue"
                elif hasattr(result, "error") and result.error:
                    error_details = f"Supabase error object: {result.error}"
                elif isinstance(result, dict):
                    if "error" in result and result["error"]:
                        error_details = f"Error in result dict: {result['error']}"
                    elif (
                        "message" in result
                        and "error" in str(result["message"]).lower()
                    ):
                        error_details = f"Error message: {result['message']}"
                    else:
                        upload_successful = True
                else:
                    # Assume success for other result types
                    upload_successful = True

                if not upload_successful:
                    raise Exception(f"Upload failed: {error_details}")

                # Verify upload by attempting to get public URL
                try:
                    public_url = self.get_public_url(storage_path)
                    if not public_url:
                        self.cli.warning(
                            f"[STORAGE]: Upload succeeded but public URL unavailable for {storage_path}"
                        )
                except Exception as url_error:
                    self.cli.warning(
                        f"[STORAGE]: Upload succeeded but URL generation failed: {str(url_error)}"
                    )
                    public_url = None
                if not upload_successful:
                    raise Exception(f"Upload failed: {error_details}")

                # Verify upload by attempting to get public URL
                try:
                    public_url = self.get_public_url(storage_path)
                    if not public_url:
                        self.cli.warning(
                            f"[STORAGE]: Upload succeeded but public URL unavailable for {storage_path}"
                        )
                except Exception as url_error:
                    self.cli.warning(
                        f"[STORAGE]: Upload succeeded but URL generation failed: {str(url_error)}"
                    )
                    public_url = None

                upload_info = {
                    "storage_path": storage_path,
                    "bucket_name": self.bucket_name,
                    "original_filename": filename,
                    "provider_name": provider_name,
                    "file_size": file_size,
                    "upload_time": datetime.now().isoformat(),
                    "upload_attempts": attempt + 1,
                    "public_url": public_url,
                    "result_type": str(type(result)),
                }

                print(
                    f"{Colors.OKGREEN}✅ [STORAGE]: Successfully uploaded {filename} on attempt {attempt + 1}{Colors.ENDC}"
                )
                self.cli.success(
                    f"[STORAGE]: Successfully uploaded {filename} to {storage_path} on attempt {attempt + 1}\nurl={public_url}"
                )

                return upload_info

            except Exception as e:
                last_error = e
                self.cli.warning(
                    f"[STORAGE]: Upload attempt {attempt + 1} failed for {filename}: {str(e)}"
                )

                if attempt < self.max_retries - 1:
                    sleep_time = self.retry_delay * (2**attempt)  # Exponential backoff
                    self.cli.info(
                        f"[STORAGE]: Retrying upload in {sleep_time} seconds..."
                    )
                    self.cli.warning(
                        f"[STORAGE]: Upload attempt {attempt + 1} failed, retrying in {sleep_time}s..."
                    )
                    time.sleep(sleep_time)
                else:
                    self.cli.error(
                        f"[STORAGE]: All {self.max_retries} upload attempts failed for {filename}"
                    )

        # All attempts failed
        error_msg = f"Upload failed after {self.max_retries} attempts. Last error: {str(last_error)}"
        self.cli.error(f"[STORAGE]: {error_msg}")
        print(f"{Colors.FAIL}❌ [STORAGE]: {error_msg}{Colors.ENDC}")
        return None

    def get_public_url(self, storage_path: str) -> Optional[str]:
        """
        Get public URL for a file in storage.

        Args:
            storage_path (str): Path to file in storage

        Returns:
            Optional[str]: Public URL or None if failed
        """
        try:
            result = supabase_role.storage.from_(self.bucket_name).get_public_url(
                storage_path
            )
            # The get_public_url method returns the URL string directly
            return result if isinstance(result, str) else None
        except Exception as e:
            self.cli.error(
                f"[STORAGE]: Error getting public URL for {storage_path}: {str(e)}"
            )
            return None
