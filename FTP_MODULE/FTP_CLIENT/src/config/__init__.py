"""
Configuration Module

Contains shared configuration utilities and functions used across all config files.
"""

import os
from typing import Any, Dict, Optional, Union
from dotenv import load_dotenv

# Load environment variables once at module level
load_dotenv()


class ConfigDefaults:
    """Centralized default configuration values."""

    # Application defaults
    DELETE_AFTER_PROCESS = False
    MAX_WORKERS = 2

    # Database defaults
    DB_RETRY_ATTEMPTS = 3
    DB_BATCH_SIZE = 50
    DB_CONNECTION_TIMEOUT = 30

    # FTP defaults
    CONTAINER_FTP_MOUNT_PATH = "FTP_SERVER"

    # Supabase defaults
    SUPABASE_SCHEMA = "public"


def safe_int(value: Optional[str], default: int) -> int:
    """
    Safely convert string to int with fallback to default.

    Args:
        value: String value to convert
        default: Default value if conversion fails

    Returns:
        Converted integer or default value
    """
    if value is None:
        return default
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_bool(value: Optional[str], default: bool) -> bool:
    """
    Safely convert string to boolean with fallback to default.

    Args:
        value: String value to convert
        default: Default value if conversion fails

    Returns:
        Converted boolean or default value
    """
    if value is None:
        return default
    try:
        return str(value).lower() in ("true", "1", "yes", "on")
    except (AttributeError, TypeError):
        return default


def safe_str(value: Optional[str], default: str) -> str:
    """
    Safely get string value with fallback to default.

    Args:
        value: String value
        default: Default value if None or empty

    Returns:
        String value or default
    """
    if not value:
        return default
    return str(value)


def get_env_var(
    key: str, default: Any = None, converter: Optional[callable] = None
) -> Any:
    """
    Get environment variable with optional type conversion.

    Args:
        key: Environment variable key
        default: Default value if not found
        converter: Function to convert the value

    Returns:
        Environment variable value or default
    """
    value = os.environ.get(key)
    if value is None:
        return default

    if converter:
        try:
            return converter(value)
        except (ValueError, TypeError):
            return default

    return value


def calculate_db_batch_size(max_workers: int, base_batch_size: int) -> int:
    """
    Calculate optimal database batch size based on worker count.

    Args:
        max_workers: Number of concurrent workers
        base_batch_size: Base batch size from configuration

    Returns:
        Optimal batch size for the given worker configuration
    """
    if max_workers == 1:
        return base_batch_size
    # For concurrent workers, use smaller batch size to reduce contention
    return min(25, base_batch_size)


def validate_required_env_vars(*keys: str) -> Dict[str, str]:
    """
    Validate that required environment variables are present.

    Args:
        keys: Environment variable keys that are required

    Returns:
        Dictionary of key-value pairs

    Raises:
        ValueError: If any required variable is missing
    """
    missing_vars = []
    env_vars = {}

    for key in keys:
        value = os.environ.get(key)
        if not value:
            missing_vars.append(key)
        else:
            env_vars[key] = value

    if missing_vars:
        raise ValueError(
            f"Required environment variables not found: {', '.join(missing_vars)}"
        )

    return env_vars


def get_config_summary(config_dict: Dict[str, Any]) -> str:
    """
    Generate a formatted summary of configuration values.

    Args:
        config_dict: Dictionary of configuration values

    Returns:
        Formatted string summary
    """
    lines = ["Configuration Summary:", "=" * 30]
    for key, value in sorted(config_dict.items()):
        # Mask sensitive values
        if any(
            sensitive in key.lower()
            for sensitive in ["key", "secret", "password", "token"]
        ):
            masked_value = "*" * min(8, len(str(value))) if value else "None"
            lines.append(f"{key}: {masked_value}")
        else:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)


# Export commonly used functions and classes
__all__ = [
    "ConfigDefaults",
    "safe_int",
    "safe_bool",
    "safe_str",
    "get_env_var",
    "calculate_db_batch_size",
    "validate_required_env_vars",
    "get_config_summary",
]
