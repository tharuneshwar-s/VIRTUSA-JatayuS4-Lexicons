


# PriceAI API
![Python](https://img.shields.io/badge/Python-3.12+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![OpenAPI/Swagger](https://img.shields.io/badge/OpenAPI%2FSwagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=white)

A REST API for healthcare pricing information, providing access to healthcare services, providers, insurance plans, pricing data, and user reviews.

## Overview

PriceAI API is a FastAPI-based healthcare pricing platform that provides comprehensive access to:

- **Healthcare Services** - Browse medical services by location, category, and setting
- **Healthcare Providers** - Find providers and their service offerings with pricing
- **Insurance Plans** - Get insurance coverage and pricing information  
- **Price Comparisons** - Compare costs across providers and insurance plans
- **Reviews & Ratings** - Access user reviews and provider statistics
- **Provider Services** - Manage provider-service relationships
- **Service Pricing** - Detailed pricing information across different insurance plans


## Features

- **Read-Only API** - Safe, non-destructive access to healthcare data
- **RESTful Design** - Clean, intuitive API endpoints
- **Comprehensive Documentation** - Auto-generated OpenAPI/Swagger docs
- **Docker Support** - Containerized deployment ready
- **CORS Enabled** - Frontend integration ready
- **Advanced Filtering** - Search by location, rating, pricing, and more
- **Statistics & Analytics** - Provider ratings and review statistics

## Folder Structure

```
priceai-api/
├── config/
│   └── config.py
├── database/
│   └── connections.py
├── logs/
├── routes/
│   ├── insurance.py
│   ├── providers.py
│   ├── services.py
│   ├── reviews.py
│   ├── service_pricing.py
│   └── provider_services.py
├── schema/
│   ├── insurance.py
│   ├── providers.py
│   ├── services.py
│   ├── reviews.py
│   ├── service_pricing.py
│   └── provider_services.py
├── utils/
│   └── logger.py
├── main.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

### File Descriptions

#### Core Application
- `main.py`: FastAPI application entry point and configuration
- `requirements.txt`: Python dependencies and packages

#### Configuration
- `config/config.py`: Environment variables and application settings
- `.env.example`: Template for environment configuration

#### Database & External Services
- `database/connections.py`: Supabase client and external service connections

#### API Routes
- `routes/insurance.py`: Insurance pricing and coverage endpoints
- `routes/providers.py`: Healthcare provider service endpoints
- `routes/services.py`: Medical service location endpoints
- `routes/reviews.py`: User reviews and rating endpoints
- `routes/service_pricing.py`: Service pricing information endpoints
- `routes/provider_services.py`: Provider-service relationship endpoints

#### Data Models (Pydantic Schemas)
- `schema/insurance.py`: Insurance data validation models
- `schema/providers.py`: Provider data validation models  
- `schema/services.py`: Service data validation models
- `schema/reviews.py`: Review data validation models
- `schema/service_pricing.py`: Pricing data validation models
- `schema/provider_services.py`: Provider-service relationship models

#### Utilities
- `utils/logger.py`: Custom logging configuration and setup

#### Deployment
- `Dockerfile`: Container build configuration
- `docker-compose.yml`: Multi-container orchestration setup


## API Endpoints

### Services
- `GET /services/location` - Get services by provider location (city/state)

### Providers  
- `GET /providers` - Get all providers with filtering options
- `GET /providers/services/{provider_id}` - Get services for a specific provider
- `GET /providers/service/{service_id}` - Get providers offering a specific service with pricing

### Insurance
- `GET /insurance/provider-service-insurance/{provider_id}/{service_id}` - Get insurance plans with pricing for provider-service combinations
- `GET /insurance/multiple-providers-service/{provider_ids}/{service_id}` - Get insurance plans for multiple providers and a service

### Reviews
- `GET /reviews` - Get reviews with filtering options
- `GET /reviews/provider/{provider_id}` - Get reviews for a specific provider
- `GET /reviews/provider/{provider_id}/service/{service_id}` - Get reviews for provider-service combination
- `GET /reviews/stats/provider/{provider_id}` - Get review statistics for a provider

### Service Pricing
- `GET /service-pricing` - Get service pricing information with filtering

### Provider Services
- `GET /provider-services` - Get provider-service mappings


## Technology Stack

- **Framework**: FastAPI
- **Runtime**: Python 3.12+
- **Database**: Supabase (PostgreSQL)
- **Documentation**: OpenAPI/Swagger
- **Logging**: Rich logging with file output
- **Containerization**: Docker & Docker Compose

## Installation & Configuration

### Prerequisites

- Python 3.11+
- Docker & Docker Compose (for containerized deployment)
- Supabase Database

### Environment Configuration

Create a `.env` file (or copy from `.env.example`) and configure the following variables:

```bash
# Application Settings
ENVIRONMENT=development                    # Environment mode (development/production)
API_PREFIX=/api                           # API route prefix
API_VERSION=v1                            # API version
PRICEAI_API_HOST=0.0.0.0                 # Server host binding
PRICEAI_API_PORT=8001                     # Server port

# Frontend Configuration
PRICEAI_WEBAPP_URL=http://localhost:3001  # Frontend application URL for CORS

# Database Configuration
SUPABASE_URL=your_supabase_url            # Supabase project URL
SUPABASE_KEY=your_supabase_anon_key       # Supabase anonymous API key

# Logging Configuration
PRICEAI_LOG_LEVEL=INFO                    # Log level (DEBUG/INFO/WARNING/ERROR)
LOGS_DIR=logs                             # Log files directory
```

### Local Development

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd priceai-api
   ```

2. Create virtual environment and activate it
   ```bash
   python -m venv venv
   # On Linux/macOS
   source venv/bin/activate
   # On Windows
   venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```


4. Configure environment variables
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run the application
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8001
   # Or run directly
   python main.py
   ```

### Docker Deployment

1. Build and start with Docker Compose
   ```bash
   docker-compose up --build
   # Or run in detached mode
   docker-compose up -d
   # Stop services
   docker-compose down
   ```

2. Using Docker directly
   ```bash
   docker build -t priceai-api .
   docker run -p 8001:8001 --env-file .env priceai-api
   ```

## API Documentation

Once the application is running, access the interactive documentation at:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc  
- **OpenAPI JSON**: http://localhost:8001/openapi.json

## Usage Examples

### Get Services by Location
Search for healthcare services available in a specific location:

```bash
curl -X GET "http://localhost:8001/api/v1/services/location?city=New%20York&state=NY"
```

### Get All Providers
Retrieve healthcare providers with optional filtering:

```bash
# Get all providers
curl -X GET "http://localhost:8001/api/v1/providers"

# Filter by location and specialty
curl -X GET "http://localhost:8001/api/v1/providers?city=Chicago&state=IL&specialty=Cardiology"
```

### Get Providers for a Service
Find providers offering a specific service with pricing information:

```bash
curl -X GET "http://localhost:8001/api/v1/providers/service/service_456?city=Miami&state=FL&insurance_id=ins_123"
```

### Get Provider Services
Retrieve all services offered by a specific healthcare provider:

```bash
curl -X GET "http://localhost:8001/api/v1/providers/services/provider_123?include_pricing=true"
```

### Get Insurance Pricing
Get insurance coverage and pricing for a specific provider-service combination:

```bash
curl -X GET "http://localhost:8001/api/v1/insurance/provider-service-insurance/provider_123/service_456"
```

### Get Reviews
Retrieve user reviews with filtering options:

```bash
# Get all reviews for a provider
curl -X GET "http://localhost:8001/api/v1/reviews/provider/provider_123"

# Get reviews for a specific provider-service combination
curl -X GET "http://localhost:8001/api/v1/reviews/provider/provider_123/service/service_456?min_rating=4"

# Get review statistics
curl -X GET "http://localhost:8001/api/v1/reviews/stats/provider/provider_123"
```

### Get Service Pricing
Retrieve detailed pricing information:

```bash
curl -X GET "http://localhost:8001/api/v1/service-pricing?provider_id=provider_123&service_id=service_456"
```

### Get Provider-Service Mappings
Find which providers offer which services:

```bash
curl -X GET "http://localhost:8001/api/v1/provider-services?provider_id=provider_123"
```

## Logging

The application uses structured logging with multiple outputs:

- **Console**: Development and debugging
- **File**: `logs/priceai_api.log` for persistent storage  
- **Rich**: Enhanced console output with colors and formatting

Log levels can be configured via the `PRICEAI_LOG_LEVEL` environment variable.


## Deployment

### Production Deployment

1. Set production environment
   ```bash
   export ENVIRONMENT=production
   ```

2. Configure production settings
   - Update database connection strings
   - Set appropriate log levels
   - Configure CORS settings

3. Deploy with Docker Compose
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```


## Team

**Virtusa Hackathon 2025 - Lexicons**

This project was developed as part of the Virtusa Hackathon focusing on healthcare data processing and automation solutions.

