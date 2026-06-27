# ── Stage 1: Build Frontend ──────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend source
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend . .
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim

# curl is only needed for the healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# HF_TOKEN is passed at build time to avoid HuggingFace rate limiting
ARG HF_TOKEN
ENV HF_TOKEN=${HF_TOKEN}

# Install Python dependencies first (cached layer)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --timeout 300 --retries 5 -r requirements.txt

# Pre-download fastembed models so they're baked into the image.
# Without this, the container downloads them on every cold start (~60-90s delay).
# Models used in qdrant_store.py: dense + sparse for hybrid search.
RUN python -c "\
from fastembed import TextEmbedding, SparseTextEmbedding; \
print('Downloading dense model...'); \
TextEmbedding('BAAI/bge-small-en-v1.5'); \
print('Downloading sparse model...'); \
SparseTextEmbedding('Qdrant/bm25'); \
print('Models ready.')"

# Clear token from env after download (not needed at runtime)
ENV HF_TOKEN=

# Copy backend source
COPY backend . .

# Copy built frontend from Stage 1
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 8000

# NOTE: env vars (GROQ_API_KEY, QDRANT_URL, etc.) are injected by Railway
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

