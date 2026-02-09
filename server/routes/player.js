const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { setNickname, setSkin } = require('../controllers/playerController');

// POST /api/player/nickname - Set player nickname (protected route)
router.post('/nickname', verifyToken, setNickname);

// POST /api/player/skin - Set player skin (protected route)
router.post('/skin', verifyToken, setSkin);

module.exports = router;
