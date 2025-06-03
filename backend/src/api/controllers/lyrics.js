import axios from 'axios';

export const getLyrics = async (req, res) => {
  try {
    const { title, artist } = req.query;
    
    // First try: LRCLIB (free API)
    const lrclibRes = await axios.get(`https://lrclib.net/api/search?q=${title} ${artist}`);
    if (lrclibRes.data.length > 0) {
      return res.json(parseLrclibLyrics(lrclibRes.data[0].syncedLyrics));
    }
    
    // Fallback: Lyrics.ovh
    const ovhRes = await axios.get(`https://api.lyrics.ovh/v1/${artist}/${title}`);
    if (ovhRes.data.lyrics) {
      return res.json(parsePlainLyrics(ovhRes.data.lyrics));
    }
    
    throw new Error('Lyrics not found');
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

function parseLrclibLyrics(syncedLyrics) {
  return syncedLyrics.split('\n').map(line => {
    const match = line.match(/^\[(\d+):(\d+\.\d+)\](.*)/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      return {
        text: match[3].trim(),
        time: minutes * 60 + seconds
      };
    }
    return { text: line.trim(), time: 0 };
  });
}

function parsePlainLyrics(lyrics) {
  return lyrics.split('\n\n').map((verse, i) => ({
    text: verse.trim(),
    time: i * 30 // Distribute verses over time
  }));
}

