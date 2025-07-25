import yts from 'yt-search';
import { cache } from '../../services/cache';

export const search = async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.status(400).json({ error: 'Query parameter is required' });
        }

        // Check cache first
        const cachedResults = cache.get(query);
        if (cachedResults) {
            return res.json(cachedResults);
        }

        // Search YouTube
        const { videos } = await yts(query);
        const results = videos
            .filter(v => v.seconds < 3600) // Filter out videos longer than 1 hour
            .map(video => ({
                id: video.videoId,
                title: video.title,
                duration: video.timestamp,
                thumbnail: video.thumbnail,
                artist: video.author.name
            }));

        // Cache results
        cache.set(query, results);

        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Failed to perform search' });
    }
};
