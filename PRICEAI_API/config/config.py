"""
Configuration Module for PriceAI API

This module loads environment variables and provides configuration settings for the application.
It uses python-dotenv to load environment variables from a .env file.

Environment Variables:
    SUPABASE_URL: URL for the Supabase instance
    SUPABASE_KEY: API key for Supabase
    PRICEAI_WEBAPP_URL: URL for the PriceAI web application (for CORS)
    API_PREFIX: Prefix for API routes (default: "/api")
    API_VERSION: API version (default: "v1")
    LOG_LEVEL: Logging level (default: "INFO")
    ENVIRONMENT: Deployment environment (default: "development")

Usage:
    from config.config import SUPABASE_URL, SUPABASE_KEY, etc.
"""

import os
import logging
from typing import Dict, Any
import dotenv

# Load environment variables from .env file
dotenv.load_dotenv()

# Core API settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
if not SUPABASE_URL:
    raise ValueError("SUPABASE_URL environment variable is not set")

SUPABASE_KEY = os.getenv("SUPABASE_KEY")
if not SUPABASE_KEY:
    raise ValueError("SUPABASE_KEY environment variable is not set")


PRICEAI_WEBAPP_URL = os.getenv("PRICEAI_WEBAPP_URL", "http://localhost:3001")
PRICEAI_API_HOST = os.getenv("PRICEAI_API_HOST", "0.0.0.0")
PRICEAI_API_PORT = int(os.getenv("PRICEAI_API_PORT", 8001))
API_PREFIX = os.getenv("API_PREFIX", "/api")
API_VERSION = os.getenv("API_VERSION", "v1")

PRICEAI_API_URL = os.getenv("PRICEAI_API_URL", f"http://{PRICEAI_API_HOST}:{PRICEAI_API_PORT}/{API_PREFIX}/{API_VERSION}")

# Environment settings
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

# Additional settings based on environment
SETTINGS: Dict[str, Any] = {
    "development": {
        "debug": True,
        "reload": True,
    },
    "production": {
        "debug": False,
        "reload": False,
    },
    "testing": {
        "debug": True,
        "reload": False,
    },
}

# Get current environment settings
CURRENT_SETTINGS = SETTINGS.get(ENVIRONMENT, SETTINGS["development"])
