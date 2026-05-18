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

// 3. Internal routes — called by bash scripts running inside user containers.
// Must be mounted BEFORE any auth middleware because hooks use no JWT.
// Only reachable via Docker bridge network (172.17.0.1), not the public internet.
const internalRoutes = require('./routes/internalRoutes');
app.use('/api/internal', internalRoutes);

// 4. Mount all other routes
app.use('/api/billing', billingRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webix-backend' });
});

// Routes
app.use('/api/sessions', sessionRoutes);

const { startWorker } = require('./workers/sessionWorker');

// Start Server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Webix Backend running on http://localhost:${PORT}`);
    startWorker();
  });
}

module.exports = app; // For testing
