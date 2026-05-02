const express = require('express');
const cors = require('cors');
require('dotenv').config();

const sessionRoutes = require('./routes/sessionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

// 1. Webhook route MUST bypass express.json() to verify Stripe signatures
// We use a specific raw body parser for this route ONLY
const billingRoutes = require('./routes/billingRoutes');
app.use('/api/billing/webhook', express.raw({ type: 'application/json' }));

// 2. Global JSON Parser for everything else
app.use(express.json());

// 3. Mount all other routes
app.use('/api/billing', billingRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webix-backend' });
});

// Routes
app.use('/api/sessions', sessionRoutes);

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Webix Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app; // For testing
