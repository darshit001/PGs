# ── Stage 1: Build React Frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Install deps (cached layer)
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Copy source and build
COPY frontend/ .
RUN npm run build
# Output: /frontend/dist/

# ── Stage 2: Python Backend (serves API + built React) ────────────────────────
FROM python:3.11-slim

# curl for internal healthchecks
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies (cached layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --timeout 300 --retries 5 -r requirements.txt

# Pre-download fastembed models so they're baked into the image
# (avoids 60-90s download delay on every cold start)
ARG HF_TOKEN
ENV HF_TOKEN=${HF_TOKEN}
RUN python -c "\
from fastembed import TextEmbedding, SparseTextEmbedding; \
print('Downloading dense model BAAI/bge-small-en-v1.5...'); \
TextEmbedding('BAAI/bge-small-en-v1.5'); \
print('Downloading sparse model Qdrant/bm25...'); \
SparseTextEmbedding('Qdrant/bm25'); \
print('Models ready.')"
ENV HF_TOKEN=

# Copy backend source code
COPY backend/ .

# Copy the built React app into backend/static/
# FastAPI serves these files at the root route "/"
COPY --from=frontend-builder /frontend/dist ./static

# HF Spaces requires port 7860
EXPOSE 7860

# Env vars (GROQ_API_KEY, QDRANT_URL, etc.) are set via HF Space Secrets settings
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
