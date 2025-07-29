FROM pytorch/pytorch:2.1.0-cpu

# Set work directory
WORKDIR /app

# Copy project files
COPY . .

# Install dependencies
RUN pip install --upgrade pip
RUN pip install --no-cache-dir fastapi uvicorn pydantic TTS


# Expose port
EXPOSE 5005

# Run FastAPI with Uvicorn
CMD ["uvicorn", "text_to_speech:app", "--host", "0.0.0.0", "--port", "5005"]
