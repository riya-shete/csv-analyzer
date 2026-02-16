# Multi-stage build: build React frontend, then serve everything with Django + Gunicorn

# Stage 1: Build React frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend
COPY csv-frontend/package*.json ./
RUN npm ci
COPY csv-frontend/ ./
RUN npm run build

# Stage 2: Python backend + built frontend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY csv-backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY csv-backend/ .

# Copy built frontend into Django's static files directory
COPY --from=frontend-build /app/frontend/dist /app/frontend_build

# Create necessary directories
RUN mkdir -p /app/media /app/staticfiles

# Collect static files
RUN DJANGO_SECRET_KEY=build-placeholder python manage.py collectstatic --noinput

# Create entrypoint script
RUN echo '#!/bin/bash\n\
set -e\n\
echo "Running database migrations..."\n\
python manage.py migrate --noinput\n\
echo "Starting Gunicorn server..."\n\
exec gunicorn config.wsgi:application \\\n\
    --bind 0.0.0.0:8000 \\\n\
    --workers 3 \\\n\
    --timeout 120 \\\n\
    --access-logfile - \\\n\
    --error-logfile -\n\
' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

EXPOSE 8000

CMD ["/app/entrypoint.sh"]
