import axios from 'axios';

export class LyricsService {
  static async fetchLyrics(trackId) {
    try {
      const response = await axios.get(`https://api.genius.com/songs/${trackId}`, {
        headers: { Authorization: `Bearer ${process.env.GENIUS_API_KEY}` }
      });
      return response.data.response.song.lyrics;
    } catch (error) {
      console.error('Lyrics fetch error:', error);
      return null;
    }
  }
}