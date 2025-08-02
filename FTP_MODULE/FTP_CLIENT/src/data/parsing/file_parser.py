"""
CSV Parser Module

Handles parsing of healthcare pricing data files (CSV, Excel, TXT) with features for:
- Multi-format support (CSV, Excel, TXT)
- Dynamic delimiter detection
- Header validation and standardization using field mappings
- UTF-8 encoding handling including BOM characters
- Data cleaning and normalization
- Error logging and reporting
"""

import pandas as pd
import numpy as np
from src.monitoring.logger import logger
import os
from src.utils.cli_output import get_cli
from src.utils.const import FIELD_MAPPINGS, HEADERS


def standardize_headers(df: pd.DataFrame) -> pd.DataFrame:
    """
    Standardize column headers using field mappings to final HEADERS names.

    Args:
        df (pd.DataFrame): Input dataframe

    Returns:
        pd.DataFrame: Dataframe with standardized headers matching HEADERS values
    """
    cli = get_cli("file_parser.py")
    original_columns = list(df.columns)
    column_mapping = {}

    # Create reverse mapping from field mappings to final header names
    for standard_field, possible_names in FIELD_MAPPINGS.items():
        # Get the final header name from HEADERS constant
        final_header_name = HEADERS.get(standard_field, standard_field)

        for col in df.columns:
            # Case-insensitive matching
            if col.strip().lower() in [name.strip().lower() for name in possible_names]:
                column_mapping[col] = final_header_name
                break

    # Rename columns using the mapping
    df_renamed = df.rename(columns=column_mapping)

    # Log the mapping
    if column_mapping:
        logger.info(f"[PARSING] Header mappings applied: {column_mapping}")
        # cli.step(f"Standardized {len(column_mapping)} headers to final names")

    # Check for missing required fields
    mapped_to_final_names = set(column_mapping.values())
    expected_final_names = set(HEADERS.values())
    missing_fields = expected_final_names - mapped_to_final_names

    if missing_fields:
        logger.warning(f"[PARSING] Missing fields: {missing_fields}")
        cli.warning(f"Missing required fields: {', '.join(missing_fields)}")
        raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")

    return df_renamed


def parse_files(file_path: str) -> pd.DataFrame:
    """
    Parses CSV, Excel files into a pandas DataFrame with standardized headers.

    Args:
        file_path (str): Path to the file (CSV, Excel)

    Returns:
        pd.DataFrame: Parsed data as pandas DataFrame with standardized headers

    Raises:
        FileNotFoundError: If file doesn't exist
        Exception: For parsing errors
    """
    cli = get_cli("file_parser.py")
    logger.debug(f"[PARSING] Attempting to parse file: {file_path}")

    try:
        # Get file extension to determine parsing method
        file_ext = os.path.splitext(file_path)[1].lower()

        if file_ext in [".xlsx", ".xls"]:
            # Parse Excel file
            logger.debug("[PARSING] Detected Excel file")
            df = pd.read_excel(
                file_path, engine="openpyxl" if file_ext == ".xlsx" else "xlrd"
            )

        elif file_ext in [".csv"]:

            # Parse CSV/TXT file with detected delimiter
            df = pd.read_csv(
                file_path,
                encoding="utf-8-sig",
                low_memory=False,
                dtype=str,  # Keep everything as string initially
            )
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")

        # Log original headers
        logger.debug(f"[PARSING] Original headers: {list(df.columns)}")

        # Standardize headers using field mappings
        df = standardize_headers(df)

        # Clean the data
        # Remove completely empty rows
        df = df.dropna(how="all")

        # Strip whitespace from string columns
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].astype(str).str.strip()
                # Replace 'nan' strings with actual NaN
                df[col] = df[col].replace(["nan", "NaN", "None", "", np.nan], None)

        logger.info(f"[PARSING] Successfully parsed {df.shape} rows from {file_path}")
        cli.success(f"Parsed {df.shape[0]} rows from {os.path.basename(file_path)}")

        return df

    except FileNotFoundError:
        logger.error(f"[PARSING] File not found at path: {file_path}")
        cli.error(f"File not found: {os.path.basename(file_path)}")
        raise
    except Exception as e:
        logger.error(f"[PARSING] Error parsing file {file_path}: {e}", exc_info=True)
        cli.error(f"Error parsing {os.path.basename(file_path)}: {e}")
        raise
