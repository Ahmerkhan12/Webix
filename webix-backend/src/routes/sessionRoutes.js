const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');
const authenticate = require('../middleware/auth');

// Apply authentication to all session routes
router.use(authenticate);

// POST /api/sessions - Create a new desktop session
router.post('/', async (req, res) => {
  try {
    // req.user is attached by the authenticate middleware
    const session = await dockerService.createContainer(req.user.id);
    res.status(201).json({
      message: 'Session created successfully',
      session
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session', details: error.message });
  }
});

// GET /api/sessions/:id - Get session status
router.get('/:id', async (req, res) => {
  try {
    const status = await dockerService.getContainerStatus(req.params.id);
    res.json({ status });
  } catch (error) {
    res.status(404).json({ error: 'Session not found or error retrieving status' });
  }
});

// DELETE /api/sessions/:id - Terminate a session
router.delete('/:id', async (req, res) => {
  try {
    await dockerService.stopContainer(req.params.id);
    res.json({ message: 'Session terminated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to terminate session', details: error.message });
  }
});

module.exports = router;
