# LectureWeave backend image.
FROM python:3.11-slim

# System deps needed by faster-whisper / soundfile.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching. Sentence Transformers needs
# PyTorch, but the default Linux resolver can choose CUDA wheels even though this
# image is CPU-only. Preinstalling the CPU wheel avoids multi-gigabyte NVIDIA
# downloads and makes the image usable on ordinary Docker Desktop hosts.
COPY requirements.txt ./
RUN pip install --no-cache-dir --retries 5 --timeout 120 \
    --index-url https://download.pytorch.org/whl/cpu \
    torch==2.5.1+cpu \
    && pip install --no-cache-dir --retries 5 --timeout 120 -r requirements.txt

# Copy the application.
COPY . .

# Runtime configuration comes from environment variables — see .env.example.
ENV PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
