# Healthcare Data Ingestion Service

![Python](https://img.shields.io/badge/Python-3.12+-3776ab?style=for-the-badge&logo=python&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Container-2496ed?style=for-the-badge&logo=docker&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Processing-150458?style=for-the-badge&logo=pandas&logoColor=white)
![Asyncio](https://img.shields.io/badge/Asyncio-Async%20Processing-ffd43b?style=for-the-badge&logo=python&logoColor=black)

## Introduction

This is the FTP File upload Service designed to automatically ingest, validate, and process healthcare pricing data from file systems. The service monitors directories for healthcare data files (CSV/Excel)

**Key Capabilities:**
- **Sequential Processing**: Reliable file-by-file processing with comprehensive error handling
- **Intelligent Change Detection**: Provider-specific change detection with automatic cleanup of obsolete records
- **Cloud Storage Integration**: Optional Supabase Storage upload for processed files
- **Real-time Monitoring**: Comprehensive logging and CLI progress tracking
- **Containerized**: Fully containerized with Docker support

## Folder Structure

```
FTP_CLIENT/
├── src/
│   ├── config/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── supabase_config.py
│   │
│   ├── data/
│   │   ├── parsing/
│   │   │   ├── __init__.py
│   │   │   └── file_parser.py
│   │   │
│   │   └── processor/
│   │       ├── __init__.py
│   │       ├── data_processor.py
│   │       └── ftp_processor.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection_manager.py
│   │   ├── db_queue.py
│   │   └── upsert_operations.py
│   │
│   ├── monitoring/
│   │   ├── __init__.py
│   │   └── logger.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── change_detector.py
│   │   └── ftp_scanner.py
│   │
│   ├── storage/
│   │   ├── __init__.py
│   │   └── storage_manager.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── cli_output.py
│   │   ├── colors.py
│   │   ├── const.py
│   │   └── data_utils.py
│   │
│   ├── orchestrator.py
│   └── samples/
│
├── logs/
├── main.py
├── requirements.txt
├── docker-compose.yaml
├── Dockerfile
├── .env
├── .env.example
└── README.md
```

## File Descriptions

### Core Application
- **`main.py`** - Application entry point with CLI argument handling and service initialization
- **`src/orchestrator.py`** - Main orchestration service coordinating file scanning, queuing, and processing

### Configuration Management
- **`src/config/config.py`** - Centralized application configuration and environment variable management
- **`src/config/supabase_config.py`** - Supabase client initialization and database authentication

### Data Processing
- **`src/data/parsing/file_parser.py`** - Parses CSV and Excel files with healthcare data validation
- **`src/data/processor/data_processor.py`** - Healthcare-specific data transformation and entity processing
- **`src/data/processor/ftp_processor.py`** - File processing orchestration with change detection integration

### Database Operations
- **`src/database/connection_manager.py`** - Database connection pooling and retry mechanisms
- **`src/database/db_queue.py`** - File queue management with status tracking and duplicate prevention
- **`src/database/upsert_operations.py`** - Efficient upsert operations with conflict resolution

### Services
- **`src/services/ftp_scanner.py`** - File system monitoring for new healthcare data files
- **`src/services/change_detector.py`** - Provider-specific change detection with relationship cleanup

### Storage Management
- **`src/storage/storage_manager.py`** - Supabase Storage integration for file archiving and backup

### Monitoring & Utilities
- **`src/monitoring/logger.py`** - Comprehensive logging with configurable levels and file rotation
- **`src/utils/cli_output.py`** - Rich CLI formatting and progress tracking
- **`src/utils/colors.py`** - Terminal color codes and formatting helpers
- **`src/utils/const.py`** - Field mapping constants and data standardization rules
- **`src/utils/data_utils.py`** - Data cleaning, validation, and utility functions

## Sample Data Format

The service processes healthcare pricing data with the following required columns:

### Required CSV/Excel Columns

| Column Name | Description | Possible Values | Example |
|-------------|-------------|-----------------|---------|
| **Provider Name** | Healthcare provider name | Any text string | "City Medical Center", "Regional Medical Hospital" |
| **Address** | Provider street address | Any text string | "123 Healthcare Drive", "456 Medical Plaza" |
| **City** | Provider city | Any text string | "New York", "Chennai" |
| **State** | Provider state/region | Any text string | "NY", "Tamil Nadu" |
| **Zip Code** | Provider postal code | Numeric string | "10001", "600001" |
| **Phone Number** | Provider contact number | Numeric string | "2125551234", "9876543210" |
| **Country** | Provider country | Any text string | "USA", "India" |
| **Latitude** | Geographic latitude | Decimal number | "40.7128", "13.0827" |
| **Longitude** | Geographic longitude | Decimal number | "-74.0060", "80.2707" |
| **Provider Specialities** | Medical specialties offered | Any text string | "Cardiology, General Medicine", "General Medicine" |
| **Provider Benefits** | Additional services/benefits | Any text string | "24/7 emergency services", "Advanced diagnostic center, Emergency services" |
| **Service Category** | Type of medical service | Any text string | "Cardiology", "General Medicine" |
| **Service Name** | Specific service name | Any text string | "Heart Checkup", "General Checkup", "Blood Test", "Urine Test" |
| **Service Code** | Service identifier code | Alphanumeric string | "CARD001", "GENGEN682", "GENBLO894", "GENURI497" |
| **Service Description** | Detailed service description | Any text string | "Comprehensive cardiac exam", "A comprehensive assessment of your overall health" |
| **Setting** | Care setting | "INPATIENT", "OUTPATIENT", "BOTH", "" (empty) | "OUTPATIENT", "INPATIENT", "BOTH" |
| **Standard Charge** | Standard service price | Decimal number, "" (empty) | "1200.00", "22222", "21475.57", "24039.57" |
| **Insurance Name** | Insurance company name | Any text string, "" (empty) | "BlueCross BlueShield", "Acko General Insurance", "" |
| **Plan Name** | Insurance plan type | Any text string, "" (empty) | "Standard Plan", "Health Premium Plan", "" |
| **Negotiated Price** | Negotiated service price | Decimal number, "" (empty) | "950.00", "9999.89", "11208.49", "" |
| **In Network** | Network status | "True", "False", "" (empty) | "True", "False", "" |
| **Insurance Benefits** | Coverage details | Any text string, "" (empty) | "Preventive care covered", "International emergency coverage, Cashless hospitalization", "" |

### Sample Files
- **[sample_healthcare_data.csv](./samples/sample_healthcare_data.csv)** - Sample CSV format
- **[sample_healthcare_data.xlsx](./samples/sample_healthcare_data.xlsx)** - Sample Excel format

## Insurance Processing Scenarios

The system handles three distinct insurance processing scenarios based on the **In Network** field value. This approach ensures proper data classification and pricing structure management.

### In-Network Processing
When `In Network = "True"`, all insurance fields are populated with negotiated pricing typically lower than standard charges.

```yaml
Provider Name:      City Medical Center
Service Name:       Heart Checkup
Standard Charge:    1500.00
Insurance Name:     BlueCross BlueShield
Plan Name:          Standard Plan
Negotiated Price:   1200.00
In Network:         True
Insurance Benefits: Preventive care covered
```

### Out-of-Network Processing
When `In Network = "False"`, all insurance fields are populated with negotiated pricing typically higher than standard charges.

```yaml
Provider Name:      Regional Medical Hospital
Service Name:       Blood Test
Standard Charge:    250.00
Insurance Name:     Acko General Insurance
Plan Name:          Health Premium Plan
Negotiated Price:   320.00
In Network:         False
Insurance Benefits: International emergency coverage
```

### Self-Pay Processing
When `In Network = ""` (empty), all insurance fields remain empty and only standard pricing applies.

```yaml
Provider Name:      Downtown Clinic
Service Name:       General Checkup
Standard Charge:    800.00
Insurance Name:     ""
Plan Name:          ""
Negotiated Price:   ""
In Network:         ""
Insurance Benefits: ""
```

## Installation & Setup

### Prerequisites
- Python 3.12+
- Docker & Docker Compose (for containerized deployment)
- Supabase account and database
- Access to healthcare data files (CSV/Excel format)
- FileZilla Server (for FTP server setup)

### FTP Server Setup with FileZilla

**Video Tutorial: FileZilla Admin Setup**
> [Watch the complete FileZilla setup guide](PLACEHOLDER_FILEZILLA_SETUP_VIDEO_URL)

**Download Required Software:**
- **FileZilla Server**: [Download here](https://filezilla-project.org/download.php?type=server)
- **FileZilla Client**: [Download here](https://filezilla-project.org/download.php?type=client)

**Quick Setup Steps:**
1. Install FileZilla Server on your system
2. Configure user accounts and permissions
3. Set up FTP directories for healthcare data
4. Configure network settings and ports
5. Test connection with FileZilla Client

### Sample File Upload Demo

**📹 Video Tutorial: File Upload Demonstration**
> [Watch the sample file upload process](PLACEHOLDER_FILE_UPLOAD_DEMO_VIDEO_URL)

This demo shows:
- How to connect to the FTP server
- Uploading healthcare data files (CSV/Excel)
- File organization and naming conventions
- Monitoring automatic processing

**📄 Sample FTP Configuration File**
> [ftp_source.csv](./samples/filezilla_admin_setup/ftp_source.csv) - Sample FTP server configuration with hospital accounts

The sample configuration includes:
- Hospital provider accounts (Hospital_1, Hospital_2, Hospital_3, Hospital_4)
- FTP connection parameters (host, port, credentials)
- Remote directory paths for each hospital
- Active status flags for monitoring

### Method 1: Docker Installation (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FTP_CLIENT
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables in `.env`**
   ```env
   # Database Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_SCHEMA=public
   
   # Processing Configuration
   DB_BATCH_SIZE=25
   DELETE_AFTER_PROCESS=true
   UPLOAD_TO_SUPABASE=true
   
   # Database Tuning
   DB_RETRY_ATTEMPTS=3
   DB_CONNECTION_TIMEOUT=30
   
   # Scheduling (cron expression)
   FETCH_CRON_EXPRESSION=*/1 * * * *
   
   # Storage Configuration
   STORAGE_BUCKET_NAME=hospital-prices-bucket
   CONTAINER_FTP_MOUNT_PATH="../FTP_SERVER"
   
   # Logging
   LOG_LEVEL=INFO
   ```

4. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

### Method 2: Local Installation

1. **Clone and setup virtual environment**
   ```bash
   git clone <repository-url>
   cd FTP_CLIENT
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Run the service**
   ```bash
   # Scheduled service (default)
   python main.py
   
   # Single processing cycle
   python main.py --once
   
   # Health check
   python main.py --health
   
   # Configuration test
   python main.py --test
   ```

## Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| **Database Configuration** | | | |
| `SUPABASE_URL` | Supabase project URL | - | ✅ |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | - | ✅ |
| `SUPABASE_ROLE_KEY` | Supabase service role key | - | ✅ |
| `SUPABASE_SCHEMA` | Database schema name | `public` | ❌ |
| **Processing Configuration** | | | |
| `DB_BATCH_SIZE` | Database batch processing size | `25` | ❌ |
| `DELETE_AFTER_PROCESS` | Delete files after successful processing | `false` | ❌ |
| `UPLOAD_TO_SUPABASE` | Upload processed files to Supabase Storage | `true` | ❌ |
| **Database Tuning** | | | |
| `DB_RETRY_ATTEMPTS` | Number of database retry attempts | `3` | ❌ |
| `DB_CONNECTION_TIMEOUT` | Database connection timeout (seconds) | `30` | ❌ |
| **Scheduling** | | | |
| `FETCH_CRON_EXPRESSION` | File processing schedule (cron format) | `*/1 * * * *` | ❌ |
| **Storage** | | | |
| `STORAGE_BUCKET_NAME` | Supabase storage bucket name | `hospital-prices-bucket` | ❌ |
| `CONTAINER_FTP_MOUNT_PATH` | Path to healthcare data files | `../FTP_SERVER` | ❌ |
| **Logging** | | | |
| `LOG_LEVEL` | Logging level (DEBUG/INFO/WARNING/ERROR) | `INFO` | ❌ |

### Command Line Options

```bash
python main.py [OPTIONS]

Options:
  --once              Run single processing cycle and exit
  --health            Perform health check and exit
  --test              Test configuration and connectivity
```

### Cron Expression Format

The `FETCH_CRON_EXPRESSION` variable uses standard cron format to schedule file processing. The service uses the [croniter](https://pypi.org/project/croniter/) library for parsing cron expressions.

#### Cron Expression Format:
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of Week (0-6, Sunday=0)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of Month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

#### Common Examples:

| Expression | Description | Frequency |
|------------|-------------|-----------|
| `*/5 * * * *` | Every 5 minutes | 288 times/day |
| `*/10 * * * *` | Every 10 minutes | 144 times/day |
| `*/30 * * * *` | Every 30 minutes | 48 times/day |
| `0 */1 * * *` | Every hour (at minute 0) | 24 times/day |
| `0 */2 * * *` | Every 2 hours | 12 times/day |
| `0 */6 * * *` | Every 6 hours | 4 times/day |
| `0 9,17 * * *` | At 9 AM and 5 PM daily | 2 times/day |
| `0 9 * * 1-5` | At 9 AM on weekdays only | 5 times/week |
| `0 2 * * 0` | At 2 AM every Sunday | 1 time/week |
| `0 0 1 * *` | At midnight on 1st of each month | 12 times/year |

#### Special Characters:
- `*` : Matches any value
- `*/n` : Every n units (e.g., `*/15` = every 15 minutes)
- `n-m` : Range from n to m (e.g., `9-17` = 9 AM to 5 PM)
- `n,m,o` : Specific values (e.g., `1,15,30` = 1st, 15th, and 30th)

#### Usage Example:
```env
# Process files every 15 minutes
FETCH_CRON_EXPRESSION=*/15 * * * *

# Process files every hour during business hours (9 AM - 5 PM)
FETCH_CRON_EXPRESSION=0 9-17 * * *

# Process files twice daily at 6 AM and 6 PM
FETCH_CRON_EXPRESSION=0 6,18 * * *
```

## Features



### Future Enhancements

- **Parallel Processing** - Multi-threaded file processing for improved performance on large datasets
- **Real-time Notifications** - Email/Slack notifications for processing status and errors
- **Performance Analytics** - Detailed processing metrics and performance dashboard
- **Data Reports** - Automated data assessment and validation reports



---



## Team

**Virtusa Hackathon 2025 - Lexicons**

This project was developed as part of the Virtusa Hackathon focusing on healthcare data processing and automation solutions.

