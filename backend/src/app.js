import express from 'express';
import cors from 'cors';
import router from './api/routes';
import { config } from './config';
import { mongoDBService } from './services/mongodb';
import { streamCleaner } from './services/streamCleaner';
import { mongoMonitor } from './services/mongoMonitor';

const app = express();

streamCleaner.cleanup();

setInterval(() => {
    console.log('MongoDB Status:', mongoMonitor.status);
}, 60000);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', router);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

const PORT = config.port || 3000;
mongoDBService.connect().catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

export default app;
