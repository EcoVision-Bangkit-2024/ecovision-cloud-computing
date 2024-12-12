const mysql = require('mysql2');
require('dotenv').config();
const fs = require('fs');

// Konfigurasi SSL untuk Cloud SQL jika diperlukan
const sslConfig = process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: true } } : {};

// Konfigurasi koneksi ke Cloud SQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,          // Public IP atau Private IP Cloud SQL
  user: process.env.DB_USER,          // Username database
  password: process.env.DB_PASSWORD,  // Password database
  database: process.env.DB_NAME,      // Nama database
  port: process.env.DB_PORT || 3306,  // Port default MySQL
  waitForConnections: true,           // Tunggu koneksi jika limit tercapai
  connectionLimit: 10,                // Jumlah maksimum koneksi dalam pool
  queueLimit: 0,                      // Antrian tak terbatas
  ssl: {
    ca: fs.readFileSync(process.env.SSL_CA_PATH)                       // Tambahkan konfigurasi SSL jika aktif
},
});

// Konversi pool menjadi koneksi berbasis Promise
const promisePool = pool.promise();

module.exports = promisePool;
