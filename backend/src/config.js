import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    tempDir: process.env.TEMP_DIR || './temp',
    ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017'
};
