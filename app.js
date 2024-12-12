const db = require('./config/db'); // Import koneksi database

(async () => {
  try {
    // Jalankan query sederhana untuk mengetes koneksi
    const [rows] = await db.query('SELECT 1 + 1 AS solution');
    console.log('Database connected successfully! Solution:', rows[0].solution);
  } catch (err) {
    console.error('Failed to connect to database:', err.message);
  } finally {
    process.exit(); // Keluar setelah koneksi selesai
  }
})();
