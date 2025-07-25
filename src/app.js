import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './api/routes.js';
import { config } from './config.js';
import { mongoDBService } from './api/services/mongodb.js';
import { streamCleaner } from './api/services/streamCleaner.js';
import { mongoMonitor } from './api/services/mongoMonitor.js';
import { bot } from './api/services/telegram.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.use(express.static(path.join(__dirname, '../static')));
streamCleaner.cleanup();
setInterval(() => {
  console.log('📊 MongoDB Status:', mongoMonitor.status);
}, 60000);

app.use(cors());
app.use(express.json());

app.use('/api', router);

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

// Graceful shutdown handling
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
