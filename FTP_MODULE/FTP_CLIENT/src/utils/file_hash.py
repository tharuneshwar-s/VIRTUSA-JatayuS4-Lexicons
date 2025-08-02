"""
File Hash Utilities

Provides functions for calculating file hashes to detect changes in file content.
"""

import hashlib
import os
from typing import Optional
from src.monitoring.logger import logger


def calculate_file_hash(file_path: str, algorithm: str = "sha256") -> Optional[str]:
    """
    Calculate the hash of a file.

    Args:
        file_path (str): Path to the file
        algorithm (str): Hash algorithm to use ('sha256', 'md5', etc.)

    Returns:
        Optional[str]: Hex digest of the file hash, None if error occurred
    """
    try:
        if not os.path.exists(file_path):
            logger.error(f"[FILE_HASH]: File not found: {file_path}")
            return None

        hash_func = hashlib.new(algorithm)

        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files efficiently
            chunk_size = 8192
            while chunk := f.read(chunk_size):
                hash_func.update(chunk)

        file_hash = hash_func.hexdigest()
        logger.debug(
            f"[FILE_HASH]: Calculated {algorithm} hash for {file_path}: {file_hash}"
        )
        return file_hash

    except Exception as e:
        logger.error(f"[FILE_HASH]: Error calculating hash for {file_path}: {str(e)}")
        return None


def calculate_sha256(file_path: str) -> Optional[str]:
    """
    Calculate SHA-256 hash of a file.

    Args:
        file_path (str): Path to the file

    Returns:
        Optional[str]: SHA-256 hex digest, None if error occurred
    """
    return calculate_file_hash(file_path, "sha256")


def verify_file_hash(
    file_path: str, expected_hash: str, algorithm: str = "sha256"
) -> bool:
    """
    Verify if a file matches an expected hash.

    Args:
        file_path (str): Path to the file
        expected_hash (str): Expected hash value
        algorithm (str): Hash algorithm to use

    Returns:
        bool: True if hash matches, False otherwise
    """
    actual_hash = calculate_file_hash(file_path, algorithm)
    if actual_hash is None:
        return False

    matches = actual_hash.lower() == expected_hash.lower()
    logger.debug(f"[FILE_HASH]: Hash verification for {file_path}: {matches}")
    return matches
