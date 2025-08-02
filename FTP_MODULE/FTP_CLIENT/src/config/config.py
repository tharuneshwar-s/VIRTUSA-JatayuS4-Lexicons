"""
Main application configuration settings.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# =============================================================================
# PROCESSING CONFIGURATION
# =============================================================================
DB_BATCH_SIZE = int(os.environ.get("DB_BATCH_SIZE", "25"))
DELETE_AFTER_PROCESS = os.environ.get("DELETE_AFTER_PROCESS", "false").lower() == "true"
UPLOAD_TO_SUPABASE = os.environ.get("UPLOAD_TO_SUPABASE", "true").lower() == "true"

# =============================================================================
# DATABASE TUNING
# =============================================================================
DB_RETRY_ATTEMPTS = int(os.environ.get("DB_RETRY_ATTEMPTS", "3"))
DB_CONNECTION_TIMEOUT = int(os.environ.get("DB_CONNECTION_TIMEOUT", "30"))

# =============================================================================
# SCHEDULING CONFIGURATION
# =============================================================================
FETCH_CRON_EXPRESSION = os.environ.get("FETCH_CRON_EXPRESSION", "*/1 * * * *")

# =============================================================================
# STORAGE CONFIGURATION
# =============================================================================
STORAGE_BUCKET_NAME = os.environ.get("STORAGE_BUCKET_NAME", "hospital-prices-bucket")

# =============================================================================
# FILE SYSTEM CONFIGURATION
# =============================================================================
CONTAINER_FTP_MOUNT_PATH = os.environ.get("CONTAINER_FTP_MOUNT_PATH", "../FTP_SERVER")

# =============================================================================
# LOGGING CONFIGURATION
# =============================================================================
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()


# Validate critical configurations
if DB_BATCH_SIZE < 1:
    raise ValueError(f"DB_BATCH_SIZE must be positive, got {DB_BATCH_SIZE}")

if DB_RETRY_ATTEMPTS < 1:
    raise ValueError(f"DB_RETRY_ATTEMPTS must be positive, got {DB_RETRY_ATTEMPTS}")
