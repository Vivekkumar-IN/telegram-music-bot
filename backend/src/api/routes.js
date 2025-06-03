import express from 'express';
import { search, stream } from './controllers';

const router = express.Router();

// Search endpoint
router.get('/search', search);

// Stream endpoint
router.get('/stream', stream);

// position updates
router.get('/player/position', async (req, res) => {
    const { chatId, position } = req.query;
    await playerService.updatePosition(chatId, parseFloat(position));
    res.json({ success: true });
});

export default router;
