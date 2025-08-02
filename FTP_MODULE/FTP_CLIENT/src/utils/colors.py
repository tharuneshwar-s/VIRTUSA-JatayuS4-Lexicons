"""
Terminal Text Formatting Utilities

Provides ANSI color codes and formatting utilities for consistent console output.
"""


class Colors:
    """
    ANSI color codes for terminal text formatting.
    """
    HEADER = '\033[95m'    # Purple
    OKBLUE = '\033[94m'    # Blue
    OKCYAN = '\033[96m'    # Cyan
    OKGREEN = '\033[92m'   # Green
    WARNING = '\033[93m'   # Yellow
    FAIL = '\033[91m'      # Red
    ENDC = '\033[0m'       # Reset
    BOLD = '\033[1m'       # Bold
    UNDERLINE = '\033[4m'  # Underline


def color_text(text, color):
    """
    Wraps text with ANSI color codes.

    Args:
        text (str): Text to colorize
        color (str): Color code from Colors class

    Returns:
        str: Colorized text
    """
    return f"{color}{text}{Colors.ENDC}"
