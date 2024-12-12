const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const wasteRoutes = require('./routes/wasteRoutes');

dotenv.config(); // Load environment variables from .env file

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware untuk parsing body request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/wastes', wasteRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.send('Welcome to the Waste Management API!');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
