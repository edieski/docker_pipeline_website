FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (optional but useful for many libs)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py ./
COPY templates ./templates
COPY static ./static

EXPOSE 8000

CMD ["python", "app.py"]


