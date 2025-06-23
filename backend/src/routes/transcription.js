const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Placeholder para rutas de transcripción
router.post('/', authenticateToken, (req, res) => {
  res.status(501).json({ 
    message: 'Endpoint en desarrollo - Transcripción con Groq/AssemblyAI',
    endpoint: 'POST /api/transcription'
  });
});

router.post('/assemblyai', authenticateToken, (req, res) => {
  res.status(501).json({ 
    message: 'Endpoint en desarrollo - Transcripción con AssemblyAI',
    endpoint: 'POST /api/transcription/assemblyai'
  });
});

router.post('/convert', authenticateToken, (req, res) => {
  res.status(501).json({ 
    message: 'Endpoint en desarrollo - Conversión de video a audio',
    endpoint: 'POST /api/transcription/convert'
  });
});

module.exports = router; 