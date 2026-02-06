# Building the frontend 
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .

# 4. Run the build
RUN npm run build

# Production image
FROM python:3.11-slim

# Install system dependencies (removed nginx - Azure handles this)
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Backend Setup
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY backend/ ./backend/

# Frontend Assets - serve from Flask static folder
COPY --from=frontend-builder /app/frontend/dist ./static

# Expose the port Azure expects
EXPOSE 80

# Run with eventlet for WebSocket support
# Azure will set WEBSITES_PORT, defaulting to 80
CMD python3 backend/app.py
