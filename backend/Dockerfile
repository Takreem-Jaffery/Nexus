FROM python:3.10-slim

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN apt-get update && apt-get install -y git ffmpeg && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PyTorch & torchaudio (CPU-only)
RUN pip install --upgrade pip
RUN pip install torch==2.1.0+cpu torchaudio==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu

# Other dependencies
RUN pip install --no-cache-dir -r requirements.txt


# Expose port
EXPOSE 5005

# Run FastAPI with Uvicorn
CMD ["uvicorn", "text_to_speech:app", "--host", "0.0.0.0", "--port", "5005"]
