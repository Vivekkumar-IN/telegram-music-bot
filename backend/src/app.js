import express from 'express';
import cors from 'cors';
import router from './api/routes';
import { config } from './config';
import { mongoDBService } from './services/mongodb';
import { streamCleaner } from './services/streamCleaner';
import { mongoMonitor } from './services/mongoMonitor';
import { bot } from './services/telegram';

const app = express();
streamCleaner.cleanup();
setInterval(() => {
    console.log('📊 MongoDB Status:', mongoMonitor.status);
}, 60000);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Unhandled error:', err.stack);
    res.status(500).send('Something broke!');
});

const PORT = config.port || 3000;

(async () => {
    try {
        await mongoDBService.connect();

        app.listen(PORT, () => {
            console.log(`✅ Server running on port ${PORT}`);
        });

        await bot.launch();
        console.log('🤖 Telegram bot started successfully');
    } catch (err) {
        console.error('❌ Startup error:', err);
        process.exit(1);
    }
})();

// Graceful shutdown
process.once('SIGINT', async () => {
    console.log('🔻 SIGINT received, stopping bot...');
    await bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', async () => {
    console.log('🔻 SIGTERM received, stopping bot...');
    await bot.stop('SIGTERM');
    process.exit(0);
});

export default app;