const { Storage } = require("@google-cloud/storage");
const path = require("path");
require("dotenv").config(); // Untuk menggunakan Environment Variables

/// Gunakan path absolute ke file JSON di folder config
const serviceAccountPath = process.env.GCS_KEY_PATH || path.join(__dirname, "../config/service-account-key.json");

const storage = new Storage({
  keyFilename: serviceAccountPath, // Path ke file kunci JSON
});

const bucketName = "eco-vision-443510_cloudbuild"; // Ganti dengan nama bucket
const bucket = storage.bucket(bucketName);

const uploadToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return reject("No file provided");

    const blob = bucket.file(Date.now() + "-" + file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
      public: true, // Agar URL file bisa diakses publik
    });

    blobStream.on("error", (err) => {
      reject(err);
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = uploadToGCS;
