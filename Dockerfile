# Building the frontend 
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy ALL frontend source files
# This ensures we get the correct src folder, not any nested ones
COPY frontend/index.html ./
COPY frontend/vite.config.js ./
COPY frontend/eslint.config.js ./
COPY frontend/src ./src
COPY frontend/public ./public

# Run the build
RUN npm run build

# Verify the build output exists
RUN ls -la /app/frontend/dist

# Production image
FROM python:3.11-slim

# Install system dependencies
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

# Verify static files are copied
RUN ls -la /app/static

# Expose the port Azure expects
EXPOSE 80

# Run with eventlet for WebSocket support
CMD python3 backend/app.py