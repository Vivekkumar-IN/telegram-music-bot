import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { config } from '../config.js';
import { cache } from './cache.js';

const execAsync = promisify(exec);
const fsUnlink = promisify(fs.unlink);

// Cleanup old temp files on startup
cleanupTempDir();

export const streamService = {
    /**
     * Create audio stream from YouTube URL
     * @param {string} id - YouTube video ID
     * @param {object} options - Stream options
     * @param {string} [options.format='mp3'] - Audio format
     * @param {number} [options.speed=1.0] - Playback speed (0.5-2.0)
     * @param {number} [options.bitrate=192] - Audio bitrate (kbps)
     * @returns {Promise<string>} URL to the audio stream
     */
    async createStream(id, options = {}) {
        const {
            format = 'mp3',
            speed = 1.0,
            bitrate = 192
        } = options;

        try {
            // Validate input
            if (!id || typeof id !== 'string') {
                throw new Error('Invalid video ID');
            }

            // Check cache first
            const cacheKey = `${id}_${format}_${speed}_${bitrate}`;
            const cachedUrl = cache.get(cacheKey);
            if (cachedUrl) {
                return cachedUrl;
            }

            // Prepare temp directory
            const tempDir = path.resolve(config.tempDir);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            // Generate unique filename
            const filename = `stream_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            const filePath = path.join(tempDir, filename);

            // Build yt-dlp command
            const speedOption = speed !== 1.0 ? `--audio-speed ${speed}` : '';
            const formatOption = format === 'mp3' ? 
                `-x --audio-format mp3 --audio-quality ${bitrate}k` : 
                '-f bestaudio';

            const command = [
                config.ytdlpPath,
                speedOption,
                formatOption,
                `-o "${filePath}.%(ext)s"`,
                '--no-continue',
                '--no-playlist',
                '--force-overwrites',
                `"https://www.youtube.com/watch?v=${id}"`
            ].filter(Boolean).join(' ');

            // Execute yt-dlp
            const { stdout, stderr } = await execAsync(command);
            
            if (stderr) {
                console.error('yt-dlp stderr:', stderr);
            }

            // Find the generated file
            const ext = format === 'mp3' ? 'mp3' : stdout.match(/\[ExtractAudio\] Destination: .+\.(.+?)\n/)?.[1] || 'webm';
            const outputFile = `${filePath}.${ext}`;

            if (!fs.existsSync(outputFile)) {
                throw new Error('Output file not found');
            }

            // Schedule file cleanup after 1 hour
            setTimeout(() => {
                fsUnlink(outputFile).catch(err => 
                    console.error('Failed to cleanup temp file:', err)
                );
            }, 3600000);

            // Cache and return the URL
            const streamUrl = `${config.baseUrl}/streams/${path.basename(outputFile)}`;
            cache.set(cacheKey, streamUrl, 3600); // Cache for 1 hour

            return streamUrl;

        } catch (error) {
            console.error('Stream creation error:', error);
            throw new Error(`Failed to create stream: ${error.message}`);
        }
    },

    /**
     * Get available formats for a video
     * @param {string} id - YouTube video ID
     * @returns {Promise<Array>} Available formats
     */
    async getFormats(id) {
        try {
            const command = `${config.ytdlpPath} --list-formats "https://www.youtube.com/watch?v=${id}"`;
            const { stdout } = await execAsync(command);
            
            return stdout.split('\n')
                .filter(line => line.includes('audio only'))
                .map(line => {
                    const match = line.match(/(\d+)\s+.*?\s+(\d+)k/);
                    return match ? { id: match[1], bitrate: parseInt(match[2]) } : null;
                })
                .filter(Boolean);
        } catch (error) {
            console.error('Format fetch error:', error);
            throw new Error('Failed to get available formats');
        }
    }
};

// Helper function to cleanup old temp files
async function cleanupTempDir() {
    try {
        const tempDir = path.resolve(config.tempDir);
        if (!fs.existsSync(tempDir)) return;

        const files = await fs.promises.readdir(tempDir);
        const now = Date.now();
        const hour = 3600000; // 1 hour in ms

        for (const file of files) {
            if (file.startsWith('stream_')) {
                const filePath = path.join(tempDir, file);
                const stats = await fs.promises.stat(filePath);
                if (now - stats.mtimeMs > hour) {
                    await fsUnlink(filePath).catch(err => 
                        console.error('Cleanup failed for:', filePath, err)
                    );
                }
            }
        }
    } catch (error) {
        console.error('Temp dir cleanup error:', error);
    }
}

