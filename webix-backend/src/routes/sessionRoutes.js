const express = require('express');
const router = express.Router();
const dockerService = require('../services/dockerService');

// POST /api/sessions - Create a new desktop session
router.post('/', async (req, res) => {
  try {
    const session = await dockerService.createContainer();
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
