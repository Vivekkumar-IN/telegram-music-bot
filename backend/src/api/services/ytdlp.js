import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { config } from '../config';

const execAsync = promisify(exec);

export const createYtdlpStream = async (id, format = 'mp3') => {
    try {
        const tempDir = config.tempDir || './temp';
        const filename = `stream_${Date.now()}`;
        const filePath = path.join(tempDir, filename);

        let command;
        if (format === 'mp3') {
            command = `yt-dlp -x --audio-format mp3 -o "${filePath}.%(ext)s" "https://www.youtube.com/watch?v=${id}"`;
        } else {
            command = `yt-dlp -f bestaudio -o "${filePath}.%(ext)s" "https://www.youtube.com/watch?v=${id}"`;
        }

        const { stdout, stderr } = await execAsync(command);
        
        if (stderr) {
            console.error('yt-dlp stderr:', stderr);
        }

        // In a real implementation, you'd want to serve this file or stream it
        // For simplicity, we're just returning a URL path
        return `${config.baseUrl}/streams/${filename}.${format}`;
    } catch (error) {
        console.error('yt-dlp error:', error);
        throw new Error('Failed to create stream with yt-dlp');
    }
};


