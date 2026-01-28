#Building the frontend 
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Backend Setup
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY backend/ ./backend/

# 2. Frontend Assets
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html

# 3. Nginx Configuration
# Remove the default config and add yours
RUN rm /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/sites-enabled/default

# 4. Startup Script
# Use 'nginx -g "daemon off;"' to keep it running properly as a sidecar
RUN echo "#!/bin/sh\nnginx & \npython3 backend/app.py" > /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80 5000
CMD ["/app/start.sh"]