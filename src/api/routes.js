import express from 'express';
import search  from './controllers/search.js';
const router = express.Router();

// Search endpoint
router.get('/search', search);

// Stream endpoint
router.get('/stream', search);

// position updates
router.get('/player/position', async (req, res) => {
    const { chatId, position } = req.query;
    await playerService.updatePosition(chatId, parseFloat(position));
    res.json({ success: true });
});

router.get('/player/volume', async (req, res) => {
    const { chatId, volume } = req.query;
    await playerService.setVolume(chatId, parseInt(volume));
    res.json({ success: true });
});

router.get('/player/seek', async (req, res) => {
    const { chatId, position } = req.query;
    await playerService.updatePosition(chatId, parseFloat(position));
    res.json({ success: true });
});

router.get('/player/speed', async (req, res) => {
    const { chatId, speed } = req.query;
    await playerService.setPlaybackSpeed(chatId, parseFloat(speed));
    res.json({ success: true });
});

router.post('/playlists', async (req, res) => {
  try {
    const playlist = await mongoDBService.createPlaylist(req.body);
    res.json(playlist);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/playlists/:userId', async (req, res) => {
  const playlists = await mongoDBService.getUserPlaylists(req.params.userId);
  res.json(playlists);
});
export default router;
