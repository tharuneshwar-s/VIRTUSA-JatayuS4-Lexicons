"""
PriceAI API - Main Application Module (Read-Only)

This is the main entry point for the PriceAI API application.
It configures the FastAPI application, middleware, and routes.

This is a READ-ONLY API that provides access to healthcare pricing data.
No write operations are supported.

The API provides endpoints for:
- Healthcare services
- Healthcare providers
- Insurance plans
- AI-powered recommendations
- Price comparisons

Usage:
    Run directly: python main.py
    Run with uvicorn: uvicorn main:app --reload
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv


# Import routers
from routes.services import router as services_router
from routes.providers import router as providers_router
from routes.insurance import router as insurance_router
from routes.service_pricing import router as service_pricing_router
from routes.provider_services import router as provider_services_router
from routes.reviews import router as reviews_router

# Import configuration
from config.config import (
    API_PREFIX,
    API_VERSION,
    ENVIRONMENT,
    CURRENT_SETTINGS,
    PRICEAI_API_HOST,
    PRICEAI_API_PORT,
)

from utils.logger import logger

# Load environment variables
load_dotenv()


# Create FastAPI application
app = FastAPI(
    title="PriceAI API (Read-Only)",
    description="Healthcare Price Comparison Platform - Helping patients find affordable healthcare services. This is a READ-ONLY API that provides access to healthcare pricing data.",
    version=API_VERSION,
    # docs_url="/docs" if ENVIRONMENT == "development" else "",
    openapi_url=f"{API_PREFIX}/{API_VERSION}/openapi.json",
    debug=CURRENT_SETTINGS["debug"],
)

# Add CORS middleware (allow all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefix
prefix = f"{API_PREFIX}/{API_VERSION}"
app.include_router(providers_router, prefix=prefix, tags=["Providers"])
app.include_router(services_router, prefix=prefix, tags=["Services"])
app.include_router(insurance_router, prefix=prefix, tags=["Insurance"])
app.include_router(service_pricing_router, prefix=prefix, tags=["Service Pricing"])
app.include_router(provider_services_router, prefix=prefix, tags=["Provider Services"])
app.include_router(reviews_router, prefix=prefix, tags=["Reviews"])


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """
    Root endpoint providing basic API information.
    """
    return {
        "message": "PriceAI API (Read-Only) - Healthcare Price Comparison Platform",
        "version": API_VERSION,
        "docs": f"/docs",
        "environment": ENVIRONMENT,
        "note": "This is a read-only API. Only GET operations are supported.",
        "mcp_enabled": True,
        "mcp_tools_available": True,
    }


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.

    Returns:
        JSON with status information
    """
    return {
        "status": "healthy",
        "service": "PriceAI API (Read-Only)",
        "version": API_VERSION,
        "environment": ENVIRONMENT,
        "mode": "read-only",
    }


# Main entry point
if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting PriceAI API in {ENVIRONMENT} environment")

    uvicorn.run(
        "main:app",
        host=PRICEAI_API_HOST,
        port=PRICEAI_API_PORT,
        reload=CURRENT_SETTINGS["reload"],
        log_level=logging.getLevelName(logging.getLogger().level).lower(),
    )
