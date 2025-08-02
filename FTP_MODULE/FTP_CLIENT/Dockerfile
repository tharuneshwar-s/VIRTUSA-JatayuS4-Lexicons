# Healthcare FTP Processing Service
FROM python:3.12-slim

# Metadata
LABEL maintainer="Healthcare FTP Service Team"
LABEL description="Healthcare FTP processing service"

# Environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app/src
ENV LOG_LEVEL=INFO

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r healthcare && useradd -r -g healthcare healthcare

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip==23.3.1 && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./src /app/src
COPY main.py /app/main.py
COPY .env /app/.env


# Set proper permissions
RUN chown -R healthcare:healthcare /app && \
    chmod +x /app/main.py

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python main.py --health || exit 1

# Switch to non-root user
USER healthcare

# Expose health check port (if enabled)
EXPOSE 8080

# Default command
CMD ["python", "-u", "main.py"] 
