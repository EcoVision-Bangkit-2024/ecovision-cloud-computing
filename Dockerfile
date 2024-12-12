# Menggunakan base image Python
FROM python:3.10

# Menyalin semua file ke dalam container
COPY . /app
WORKDIR /app

# Menginstal dependency
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 8080 for Cloud Run
EXPOSE 8080

# Menjalankan aplikasi
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]