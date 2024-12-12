const express = require('express');
const multer = require('multer');
const uploadToGCS = require('../gcsUploader');
const { 
  getAllWastes, createWaste, getWasteById, updateWaste, deleteWaste, getWasteCategories
} = require('../controllers/wasteController');

const router = express.Router();

// File upload setup (gunakan memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Routes
router.get('/', getAllWastes);  // GET all data

router.post('/', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const photoUrl = await uploadToGCS(req.file);
    req.body.photoUrl = photoUrl;
    createWaste(req, res);
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});

router.get('/categories', getWasteCategories);  // GET categories

router.get('/:id', async (req, res) => {
  try {
    await getWasteById(req, res);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving waste", error: error.message });
  }
});

router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    if (req.file) {
      const photoUrl = await uploadToGCS(req.file);
      req.body.photoUrl = photoUrl;
    }
    updateWaste(req, res);
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});

router.delete('/:id', deleteWaste); // DELETE data

module.exports = router;
