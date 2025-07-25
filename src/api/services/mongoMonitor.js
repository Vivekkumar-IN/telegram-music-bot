import { MongoClient } from 'mongodb';
import { config } from '../config.js';

class MongoMonitor {
    constructor() {
        this.client = new MongoClient(config.mongoUri);
        this.lastPing = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.checkInterval = setInterval(() => this.checkHealth(), 30000); // 30 sec
    }

    async checkHealth() {
        try {
            await this.client.db().admin().ping();
            this.lastPing = Date.now();
            this.retryCount = 0;
        } catch (err) {
            console.error('MongoDB ping failed:', err);
            this.retryCount++;
            
            if (this.retryCount >= this.maxRetries) {
                console.error('MongoDB unreachable - terminating');
                process.exit(1); // Restart via PM2/Docker
            }
        }
    }

    get status() {
        return {
            lastPing: this.lastPing,
            latency: this.lastPing ? Date.now() - this.lastPing : null,
            retryCount: this.retryCount
        };
    }
}

export const mongoMonitor = new MongoMonitor();
