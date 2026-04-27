const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webix-backend' });
});

// Routes
app.use('/api/sessions', sessionRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`Webix Backend running on http://localhost:${PORT}`);
});

module.exports = app; // For testing
