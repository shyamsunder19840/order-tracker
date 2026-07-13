# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# ---- Stage 2: Python runtime that serves the API + the built frontend ----
FROM python:3.12-slim
WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY backend/ backend/
COPY --from=frontend-build /app/frontend/dist backend/frontend_dist

WORKDIR /app/backend
EXPOSE 8000
CMD ["sh", "-c", "gunicorn order_tracker.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
