"""
Logging Module

Configures and initializes a system-wide logger for the FTP Client application.

"""

import os
import logging
import sys
from src.config.config import LOG_LEVEL

log_level = getattr(logging, LOG_LEVEL, logging.INFO)

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Create logger
logger = logging.getLogger("PriceAI_Ingestion")
logger.setLevel(log_level)

# Prevent adding multiple handlers if imported multiple times
if not logger.handlers:
    # Create file handler
    file_handler = logging.FileHandler("logs/ingestion_pipeline.log")
    file_handler.setLevel(log_level)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    file_handler.setFormatter(formatter)
    # console_handler.setFormatter(formatter)

    # Add the handlers to the logger
    logger.addHandler(file_handler)
    # logger.addHandler(console_handler)

logger.info(f"Logger initialized with level {LOG_LEVEL}")
