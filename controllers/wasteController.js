const { Storage } = require('@google-cloud/storage');
const path = require('path');
const uuid = require('uuid');
const db = require('../config/db'); // Koneksi ke Cloud SQL

// Inisialisasi Google Cloud Storage
const storage = new Storage({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path ke kunci JSON
});

const bucketName = process.env.GCS_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

// Fungsi untuk upload file ke Google Cloud Storage
const uploadFileToGCS = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null); // Jika tidak ada file

    const uniqueFileName = `${Date.now()}-${uuid.v4()}-${file.originalname}`;
    const blob = bucket.file(uniqueFileName);
    const blobStream = blob.createWriteStream();

    blobStream.on('error', (err) => reject(err));

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFileName}`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

// Get All Wastes
const getAllWastes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wastes');
    res.status(200).json({ message: 'All wastes', data: rows });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get wastes', error: error.message });
  }
};

// Create New Waste
const createWaste = async (req, res) => {
  try {
    const { date, materialName, type, purpose, amount, keterangan } = req.body;
    const file = req.file;

    // Upload file ke GCS
    const photoUrl = await uploadFileToGCS(file);

    // Simpan data ke Cloud SQL
    const [result] = await db.query(
      'INSERT INTO wastes (date, materialName, type, purpose, amount, keterangan, photoUrl) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, materialName, type, purpose, amount, keterangan, photoUrl]
    );

    res.status(201).json({
      message: 'New waste created',
      data: { id: result.insertId, date, materialName, type, purpose, amount, keterangan, photoUrl },
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create waste', error: error.message });
  }
};

// Get Waste By ID
const getWasteById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wastes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Waste not found' });

    res.status(200).json({ message: 'Waste found', data: rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get waste', error: error.message });
  }
};

// Update Waste
const updateWaste = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, materialName, type, purpose, amount, keterangan } = req.body;
    const file = req.file;

    // Cek jika data waste ada
    const [rows] = await db.query('SELECT * FROM wastes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Waste not found' });

    // Upload file jika ada
    const photoUrl = await uploadFileToGCS(file);

    // Update data
    await db.query(
      `UPDATE wastes SET 
        date = COALESCE(?, date),
        materialName = COALESCE(?, materialName),
        type = COALESCE(?, type),
        purpose = COALESCE(?, purpose),
        amount = COALESCE(?, amount),
        keterangan = COALESCE(?, keterangan),
        photoUrl = COALESCE(?, photoUrl)
       WHERE id = ?`,
      [date, materialName, type, purpose, amount, keterangan, photoUrl, id]
    );

    res.status(200).json({ message: 'Waste updated' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update waste', error: error.message });
  }
};

// Delete Waste
const deleteWaste = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query('SELECT * FROM wastes WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Waste not found' });

    await db.query('DELETE FROM wastes WHERE id = ?', [id]);
    res.status(200).json({ message: 'Waste deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete waste', error: error.message });
  }
};

const getWasteCategories = async (req, res) => {
  try {
    const { filter } = req.query;

    // Validasi filter yang diperbolehkan
    const validFilters = ['type', 'purpose', 'keterangan', 'materialName'];
    if (!filter || !validFilters.includes(filter)) {
      return res.status(400).json({
        message: 'Invalid or missing filter. Valid filters: type, purpose, keterangan, materialName.',
      });
    }

    console.log('Filter received:', filter); // Debugging log

    // Query ke database
    const query = `SELECT DISTINCT ?? AS category FROM wastes`;
    console.log('Executing query:', query, 'with filter:', filter);

    const [rows] = await db.query(query, [filter]);

    if (rows.length === 0) {
      return res.status(404).json({ message: `No categories found for filter: ${filter}` });
    }

    res.status(200).json({
      message: `Waste categories by ${filter}`,
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching waste categories:', error);
    res.status(500).json({ message: 'Failed to get waste categories', error: error.message });
  }
};



module.exports = {
  getAllWastes,
  createWaste,
  getWasteById,
  updateWaste,
  deleteWaste,
  getWasteCategories,
};
