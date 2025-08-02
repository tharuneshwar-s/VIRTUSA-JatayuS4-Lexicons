#!/usr/bin/env python3
"""
Healthcare FTP Processing Service - Main Entry Point

A production-ready FTP file processing service for healthcare data ingestion.

Usage:
    python main.py                  # Run scheduled service
    python main.py --once           # Run single cycle
    python main.py --health         # Health check
    python main.py --test           # Test configuration
"""

import asyncio
import sys
import argparse
from dotenv import load_dotenv

from src.orchestrator import HealthcareFTPOrchestrator
from src.utils.colors import Colors
from src.utils.cli_output import get_cli

# Load environment variables
load_dotenv()


cli = get_cli("main.py")


def setup_argument_parser():
    """Setup command line argument parser."""
    parser = argparse.ArgumentParser(
        description="Healthcare FTP Processing Service",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                    # Run scheduled service
  python main.py --once             # Run single processing cycle
  python main.py --health           # Perform health check
  python main.py --test             # Test configuration and connectivity
        """,
    )

    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--once", action="store_true", help="Run single processing cycle and exit"
    )
    group.add_argument(
        "--health", action="store_true", help="Perform health check and exit"
    )
    group.add_argument(
        "--test", action="store_true", help="Test configuration and connectivity"
    )

    parser.add_argument(
        "--log-level",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        default="INFO",
        help="Set logging level (default: INFO)",
    )

    return parser


async def run_scheduled_service():
    """Run the service with scheduled execution."""
    service = HealthcareFTPOrchestrator()

    try:
        await service.run_scheduled()
    except KeyboardInterrupt:
        cli.warning("Service interrupted by user")
        await service.shutdown()
    except Exception as e:
        cli.error(f"Fatal error: {str(e)}")
        cli.error(f"Fatal error in scheduled service: {str(e)}")
        await service.shutdown()
        return 1

    return 0


async def run_single_cycle():
    """Run a single processing cycle."""

    service = HealthcareFTPOrchestrator()

    try:
        cli.section("Running Single Cycle", "🔄")
        await service.run_once()
        cli.success("Single cycle completed successfully")
    except Exception as e:
        cli.error(f"Single cycle failed: {str(e)}")
        cli.error(f"Single cycle failed: {str(e)}")
        return 1
    finally:
        await service.shutdown()

    return 0


async def run_health_check():
    """Perform health check."""
    service = HealthcareFTPOrchestrator()

    try:
        cli.section("Health Check", "🏥")
        health_status = await service.health_check()

        if health_status.get("healthy", False):
            cli.success("Service is healthy")
            return 0
        else:
            cli.error("Service is unhealthy")
            return 1

    except Exception as e:
        cli.error(f"Health check failed: {str(e)}")
        cli.error(f"Health check failed: {str(e)}")
        return 1
    finally:
        await service.shutdown()


async def run_configuration_test():
    """Test configuration and connectivity."""
    service = HealthcareFTPOrchestrator()

    try:
        cli.section("Configuration Test", "🧪")
        # TODO: Implement test_configuration method
        cli.info("Configuration test not implemented yet")

        # For now, just run health check
        health_status = await service.health_check()

        if health_status.get("healthy", False):
            cli.success("Basic health check passed")
            return 0
        else:
            cli.error("Basic health check failed")
            return 1

    except Exception as e:
        cli.error(f"Configuration test failed: {str(e)}")
        cli.error(f"Configuration test failed: {str(e)}")
        return 1
    finally:
        await service.shutdown()


async def main():
    """Main entry point."""
    parser = setup_argument_parser()
    args = parser.parse_args()

    # Setup logging

    # Route to appropriate function
    if args.once:
        return await run_single_cycle()
    elif args.health:
        return await run_health_check()
    elif args.test:
        return await run_configuration_test()
    else:
        return await run_scheduled_service()


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        cli.warning("Application interrupted by user")
        sys.exit(0)
    except Exception as e:
        cli.error(f"Application crashed: {str(e)}")
        cli.error(f"Application crashed: {str(e)}")
        sys.exit(1)
