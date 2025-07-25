import dotenv from 'dotenv';

dotenv.config();

export default const config = {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "1234567890:AABCDEFGJIJKLMNPQISSN",
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',
    tempDir: process.env.TEMP_DIR || './temp',
    maxBitrate: process.env.MAX_BITRATE || 320,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    webAppBaseUrl: process.env.WEBAPP_BASE_URL || 'https://your-webapp-domain.com',
    backendApiUrl: process.env.BACKEND_API_URL || "http://localhost:3000/api",
};
