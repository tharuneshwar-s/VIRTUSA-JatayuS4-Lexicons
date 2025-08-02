"""
Database and AI Model Connections Module

This module initializes connections to external services:
1. Supabase - PostgreSQL database with RESTful API
2. Google's Gemini AI - Generative AI model for recommendations

The connections are initialized once when the module is imported and reused
throughout the application.

"""

import os
import logging
from typing import Optional
from functools import lru_cache

from supabase import create_client, Client
from config.config import SUPABASE_URL, SUPABASE_KEY

# Set up logger
logger = logging.getLogger(__name__)

# Initialize Supabase client
try:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("Supabase client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Supabase client: {str(e)}")
    raise


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """
    Returns the Supabase client instance.
    Uses lru_cache to ensure only one instance is created.

    Returns:
        Client: The Supabase client instance
    """
    return supabase
