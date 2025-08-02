"""
CLI output utility for user-friendly messages.
Provides humanized, step-by-step feedback while keeping detailed logs for debugging.
"""

from src.utils.colors import Colors, color_text

# Import logger conditionally to avoid circular imports
try:
    from src.monitoring.logger import logger
except ImportError:
    try:
        from src.monitoring.logger import logger
    except ImportError:
        import logging

        logger = logging.getLogger(__name__)


class CLIOutput:
    """Manages CLI output with human-friendly messages and proper logging."""

    def __init__(self, filename: str = None):
        self.step_count = 0
        self.current_section = None
        self.filename = filename or "cli_output.py"

    def section(self, title: str, icon: str = "🔧"):
        """Start a new section of work."""
        self.current_section = title
        self.step_count = 0
        print(f"\n{Colors.HEADER}{icon} {title}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * (len(title) + 3)}{Colors.ENDC}")
        logger.info(f"[{self.filename}]: Starting section: {title}")

    def step(self, message: str, level: str = "info"):
        """Show a processing step to the user."""
        self.step_count += 1

        if level == "success":
            print(color_text(f"\n  ✅ Step {self.step_count}: {message}\n", Colors.OKGREEN))
        elif level == "warning":
            print(color_text(f"\n  ⚠️  Step {self.step_count}: {message}\n", Colors.WARNING))
        elif level == "error":
            print(color_text(f"\n  ❌ Step {self.step_count}: {message}", Colors.FAIL))
        else:
            print(color_text(f"\n  🔄 Step {self.step_count}: {message}\n", Colors.OKCYAN))

        logger.info(f"[{self.filename}]: Step {self.step_count}: {message}")

    def progress(self, message: str, details: str = None):
        """Show progress information."""
        print(color_text(f"     → {message}", Colors.OKBLUE))
        if details:
            logger.debug(f"[{self.filename}]: Progress: {message} - {details}")
        else:
            logger.debug(f"[{self.filename}]: Progress: {message}")

    def summary(self, stats: dict):
        """Show a summary of operations."""
        print(f"\n{Colors.HEADER}📊 Summary{Colors.ENDC}")
        for key, value in stats.items():
            if isinstance(value, (int, float)) and value > 0:
                if "error" in key.lower() or "fail" in key.lower():
                    print(color_text(f"  {key}: {value}", Colors.FAIL))
                elif "success" in key.lower() or "complete" in key.lower():
                    print(color_text(f"  {key}: {value}", Colors.OKGREEN))
                else:
                    print(color_text(f"  {key}: {value}", Colors.OKCYAN))
            else:
                print(color_text(f"  {key}: {value}", Colors.OKCYAN))

        logger.info(f"[{self.filename}]: Summary: {stats}")

    def banner(self, title: str, subtitle: str = None):
        """Show application banner."""
        banner_width = 80
        print(f"\n{Colors.HEADER}{'=' * banner_width}{Colors.ENDC}")
        print(f"{Colors.BOLD}{title.center(banner_width)}{Colors.ENDC}")
        if subtitle:
            print(f"{Colors.OKCYAN}{subtitle.center(banner_width)}{Colors.ENDC}")
        print(f"{Colors.HEADER}{'=' * banner_width}{Colors.ENDC}")
        logger.info(
            f"[{self.filename}]: Banner: {title}"
            + (f" - {subtitle}" if subtitle else "")
        )

    def info(self, message: str):
        """Show informational message."""
        print(color_text(f"ℹ️  {message}", Colors.OKCYAN))
        logger.info(f"[{self.filename}]: Info: {message}")

    def success(self, message: str):
        """Show success message."""
        print(color_text(f"✅ {message}", Colors.OKGREEN))
        logger.info(f"[{self.filename}]: Success: {message}")

    def warning(self, message: str):
        """Show warning message."""
        print(color_text(f"⚠️  {message}", Colors.WARNING))
        logger.warning(f"[{self.filename}]: Warning: {message}")

    def error(self, message: str):
        """Show error message."""
        print(color_text(f"❌ {message}", Colors.FAIL))
        logger.error(f"[{self.filename}]: Error: {message}")

    def shutdown(self, message: str = "Service shutting down"):
        """Show shutdown message."""
        print(f"\n{Colors.WARNING}🛑 {message}...{Colors.ENDC}")
        logger.info(f"[{self.filename}]: Shutdown: {message}")


def get_cli(filename: str) -> CLIOutput:
    """Get a CLI instance with the specified filename for logging context."""
    return CLIOutput(filename)
