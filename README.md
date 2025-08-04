# PriceAI - Healthcare Pricing Transparency Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com/)
[![Docker](https://img.shields.io/badge/Docker-Container-2496ed?style=flat-square&logo=docker&logoColor=white)](https://docker.com/)

**Virtusa Hackathon 2025 - Team Lexicons**

A comprehensive healthcare pricing transparency platform that enables patients to compare healthcare costs, find providers, book appointments, and manage their healthcare journey with integrated insurance pricing and automated data ingestion.

## Project Overview

PriceAI addresses the critical need for healthcare pricing transparency by providing:

- Real-time Price Comparison - Compare healthcare costs across multiple providers and insurance plans
- Provider Discovery - Find healthcare providers by location, specialty, and services
- Appointment Management - Book appointments with Google Calendar integration
- Insurance Integration - Get accurate pricing based on your insurance coverage
- Automated Data Ingestion - FTP-based healthcare data processing from multiple sources
- Reviews & Ratings - Community-driven provider feedback system
- AI Assistant - Gemini-powered healthcare guidance chatbot

## Project Structure

```
VIRTUSA-JatayuS4-Lexicons/
├── PRICEAI_WEBAPP/          # Frontend Web Application
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   ├── components/         # React Components
│   │   ├── services/           # API Services
│   │   ├── context/            # State Management
│   │   └── lib/                # Utilities & Config
│   ├── package.json
│   └── README.md
│
├── PRICEAI_API/             # Backend REST API
│   ├── routes/                 # API Endpoints
│   ├── database/               # Database Connections
│   ├── schema/                 # Data Models
│   ├── config/                 # Configuration
│   ├── main.py
│   └── README.md
│
├── FTP_MODULE/              # Data Ingestion System
│   ├── FTP_CLIENT/             # Data Processing Service
│   │   ├── src/                # Core Processing Logic
│   │   ├── logs/               # Processing Logs
│   │   ├── samples/            # Sample Data & Config
│   │   ├── main.py
│   │   └── README.md
│   ├── FTP_SERVER/             # Healthcare Data Storage
│   │   ├── hospital_1/
│   │   ├── hospital_2/
│   │   └── hospital_3/
│   └── sample_healthcare_datas/ # Sample Healthcare Data
│       ├── bengaluru/              # Bangalore Hospital Data
│       ├── chennai/                # Chennai Hospital Data
│       ├── hyderabad/              # Hyderabad Hospital Data
│       ├── kerala/                 # Kerala Hospital Data
│       ├── kolkata/                # Kolkata Hospital Data
│       ├── mumbai/                 # Mumbai Hospital Data
│       ├── puducherry/             # Puducherry Hospital Data
│       └── telangana/              # Telangana Hospital Data
```

## Quick Start

### Prerequisites
- Node.js 18+ (for webapp)
- Python 3.12+ (for API and FTP module)
- Supabase Account (database)
- Google Cloud Console Project (for Calendar API)
- FileZilla Server (for FTP setup)

### 1. Clone the Repository
```bash
git clone https://github.com/tharuneshwar-s/VIRTUSA-JatayuS4-Lexicons.git
cd VIRTUSA-JatayuS4-Lexicons
```

### 2. Setup the Database (Supabase)
1. Create a new Supabase project
2. Run the database schema migrations
3. Configure authentication settings
4. Note down your project URL and API keys

### 3. Start the Backend API
```bash
cd PRICEAI_API
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
uvicorn main:app --reload --port 8001
```

### 4. Start the Web Application
```bash
cd PRICEAI_WEBAPP
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 5. Setup FTP Data Ingestion (Optional)
```bash
cd FTP_MODULE/FTP_CLIENT
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python main.py
```

### 6. Access the Application
- Web App: http://localhost:3001
- API Docs: http://localhost:8001/docs
- API Redoc: http://localhost:8001/redoc

## 📋 Components Overview

### PRICEAI_WEBAPP - Frontend Application
- Framework: Next.js 15 with TypeScript
- UI: Tailwind CSS with custom components
- Authentication: Supabase Auth
- Features: Provider search, price comparison, appointment booking, reviews
- Integrations: Google Calendar, Gemini AI chatbot

### PRICEAI_API - Backend Services
- Framework: FastAPI with Python 3.12+
- Database: PostgreSQL via Supabase
- Features: RESTful API, healthcare data management, pricing logic
- Documentation: Auto-generated OpenAPI/Swagger docs

### FTP_MODULE - Data Ingestion Pipeline
- Client: Automated healthcare data processing service
- Server: File storage for healthcare pricing data
- Features: Change detection, batch processing, data validation
- Monitoring: Comprehensive logging and CLI progress tracking

## Key Features

### For Patients
- Smart Search - Find providers by location, specialty, and services
- Price Transparency - Compare costs across providers and insurance plans
- Easy Booking - Schedule appointments with calendar integration
- Reviews - Read and write provider reviews
- AI Assistant - Get healthcare guidance and answers

### For Healthcare Providers
- Data Management - Automated pricing data ingestion
- Patient Engagement - Appointment management system
- Analytics - Review and rating insights
- Real-time Updates - Automatic data synchronization

### For Administrators
- System Monitoring - Comprehensive logging and error tracking
- Data Processing - Bulk healthcare data ingestion
- Configuration - Flexible system configuration options
- Security - Role-based access control

## Technology Stack

### Frontend
- Next.js 15 - React framework with App Router
- TypeScript - Type-safe JavaScript
- Tailwind CSS - Utility-first CSS framework
- Supabase - Authentication and database client

### Backend
- FastAPI - Modern Python web framework
- PostgreSQL - Relational database via Supabase
- Pydantic - Data validation and settings management
- Uvicorn - ASGI server implementation

### Data Processing
- Pandas - Data manipulation and analysis
- Asyncio - Asynchronous programming
- Croniter - Cron expression parsing

### External Integrations
- Google Calendar API - Appointment scheduling
- Gemini AI - Healthcare chatbot assistance
- Supabase Storage - File storage and management
- Email Services - Appointment notifications

## Documentation

Each component has detailed documentation:

- [Web Application README](./PRICEAI_WEBAPP/README.md) - Frontend setup and features
- [API Documentation README](./PRICEAI_API/README.md) - Backend API reference
- [FTP Module README](./FTP_MODULE/FTP_CLIENT/README.md) - Data ingestion setup

## Complete Platform Demo

**Platform Overview**


https://github.com/user-attachments/assets/85f90ff2-91cc-473b-95fa-f653477d236b


This comprehensive demo showcases the entire PriceAI ecosystem including:
- End-to-end healthcare pricing workflow
- Data ingestion and processing pipeline
- Web application user journey
- API integration capabilities
- Real-time price comparison features
- Administrative dashboard functionality

## Component Demo Videos

- [Web Application Demo](./PRICEAI_WEBAPP/README.md#demo-video) - Frontend features showcase
- [FileZilla Setup Guide](./FTP_MODULE/FTP_CLIENT/README.md#ftp-server-setup-with-filezilla) - FTP server configuration
- [File Upload Demo](./FTP_MODULE/FTP_CLIENT/README.md#sample-file-upload-demo) - Data ingestion process

## Sample Data

The repository includes comprehensive sample healthcare data from major Indian cities:

- Bengaluru - Apollo, Aster CMI, Cloudnine, Columbia Asia, Fortis, Hosmat, Manipal
- Chennai - Multiple hospital pricing data
- Hyderabad - Regional healthcare providers
- Kerala - State-wide hospital network
- Kolkata - Metropolitan healthcare data
- Mumbai - Extensive provider network
- Puducherry - Union territory coverage
- Telangana - State healthcare pricing

All data available in both CSV and Excel formats for testing and development.

## Team Lexicons

**Virtusa Hackathon 2025**

This project represents our vision for transforming healthcare pricing transparency through technology, making healthcare more accessible and affordable for everyone.
