#Building the frontend 
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

#Image production
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libpq-dev \
    gcc \
    nginx \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Setting up Backend
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY backend/ ./backend/

# 2. Setting up Frontend
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
#exposing ports
EXPOSE 5000 80

RUN echo "#!/bin/sh\nnginx\npython backend/app.py" > /app/start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]