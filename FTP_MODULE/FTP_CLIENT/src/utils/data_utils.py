"""
Data Utilities

Common data processing utilities for the application.
"""

import hashlib
import uuid
import decimal
from typing import Any, Optional, List, Dict, Set


def hash_row(row: Dict[str, Any], keys: List[str]) -> str:
    """
    Generate a SHA-256 hash for a row based on specified keys.

    Args:
        row (Dict[str, Any]): Row data dictionary
        keys (List[str]): Key fields to include in hash

    Returns:
        str: Hexadecimal SHA-256 hash
    """
    return hashlib.sha256("::".join(str(row.get(k)) for k in keys).encode()).hexdigest()


def safe_float(value: Any) -> Optional[float]:
    """
    Safely convert a value to float, handling None, empty strings, and NaN values.

    Args:
        value: Value to convert

    Returns:
        Optional[float]: Converted float or None if invalid/NaN
    """
    import math
    import pandas as pd

    if value in ("", None):
        return None

    # Handle pandas NaN values
    if pd.isna(value):
        return None

    # Handle string representations of NaN
    if isinstance(value, str) and value.lower().strip() in ("nan", "null", "none"):
        return None

    try:
        result = float(value)
        # Check if result is NaN and return None instead
        if math.isnan(result):
            return None
        return result
    except (ValueError, TypeError):
        return None


def safe_decimal(value: Any) -> Optional[decimal.Decimal]:
    """
    Safely convert a value to Decimal with proper formatting.

    Args:
        value (Any): Value to convert

    Returns:
        Optional[decimal.Decimal]: Decimal value with 2 decimal places or None
    """
    if value in ("", None):
        return None
    try:
        if isinstance(value, str):
            value = value.replace("$", "").replace(",", "").strip()
        d = decimal.Decimal(value)
        return d.quantize(decimal.Decimal("0.01"), rounding=decimal.ROUND_HALF_UP)
    except (ValueError, TypeError, decimal.InvalidOperation):
        return None


def is_valid_uuid(value: Any) -> bool:
    """
    Check if a value is a valid UUID.

    Args:
        value (Any): Value to check

    Returns:
        bool: True if valid UUID, False otherwise
    """
    if not value:
        return False
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError):
        return False


def generate_uuid() -> str:
    """
    Generate a new random UUID string.

    Returns:
        str: UUID string
    """
    return str(uuid.uuid4())


def chunked(iterable: List[Any], chunk_size: int):
    """
    Split an iterable into chunks of specified size.

    Args:
        iterable (List[Any]): List to chunk
        chunk_size (int): Size of each chunk

    Yields:
        List[Any]: Chunk of the original list
    """
    for i in range(0, len(iterable), chunk_size):
        yield iterable[i : i + chunk_size]


def dedupe_dict_list(
    dicts: List[Dict[str, Any]], keys: List[str]
) -> List[Dict[str, Any]]:
    """
    Remove duplicates from a list of dictionaries based on key fields.

    Args:
        dicts (List[Dict[str, Any]]): List of dictionaries
        keys (List[str]): Keys for identifying duplicates

    Returns:
        List[Dict[str, Any]]: Deduplicated list
    """
    seen = set()
    deduped = []
    for d in dicts:
        key_tuple = tuple(d.get(k) for k in keys)
        if key_tuple not in seen:
            deduped.append(d)
            seen.add(key_tuple)
    return deduped


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> bool:
    """
    Validate that all required fields are present and non-empty.

    Args:
        data (Dict[str, Any]): Data to validate
        required_fields (List[str]): List of required field names

    Returns:
        bool: True if all required fields are present and non-empty
    """
    return all(data.get(field) for field in required_fields)


def clean_string(value: Any) -> Optional[str]:
    """
    Clean and normalize string values.

    Args:
        value (Any): Value to clean

    Returns:
        Optional[str]: Cleaned string or None if empty
    """
    if value is None:
        return None

    cleaned = str(value).strip()
    return cleaned if cleaned else None


def normalize_phone(phone: Any) -> Optional[str]:
    """
    Normalize phone number format.

    Args:
        phone (Any): Phone number to normalize

    Returns:
        Optional[str]: Normalized phone number or None
    """
    if not phone:
        return None

    # Remove all non-digit characters
    digits = "".join(filter(str.isdigit, str(phone)))

    # Return None if no digits found
    if not digits:
        return None

    # Format based on length
    if len(digits) == 10:
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
    elif len(digits) == 11 and digits[0] == "1":
        return f"+1 ({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
    else:
        return digits  # Return as-is if unusual format
