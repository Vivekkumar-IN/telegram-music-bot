import fs from 'fs/promises';
import path from 'path';
import config from '../../config.js';

class StreamCleaner {
    constructor() {
        this.cleanupInterval = setInterval(() => this.cleanup(), 3600000); // 1 hour
    }

    async cleanup() {
        try {
            const files = await fs.readdir(config.tempDir);
            const now = Date.now();
            const expirationTime = 3600000; // 1 hour in ms

            await Promise.all(files.map(async (file) => {
                if (file.startsWith('stream_')) {
                    const filePath = path.join(config.tempDir, file);
                    const stats = await fs.stat(filePath);
                    
                    if (now - stats.mtimeMs > expirationTime) {
                        await fs.unlink(filePath).catch(console.error);
                        console.log(`Cleaned up: ${file}`);
                    }
                }
            }));
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    }

    stop() {
        clearInterval(this.cleanupInterval);
    }
}

// Singleton instance
export const streamCleaner = new StreamCleaner();

// Graceful shutdown
process.on('SIGTERM', () => streamCleaner.stop());
process.on('SIGINT', () => streamCleaner.stop());
