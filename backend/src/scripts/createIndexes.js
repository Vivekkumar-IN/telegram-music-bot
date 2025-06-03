import { mongoDBService } from '../services/mongodb';

async function createIndexes() {
    await mongoDBService.connect();
    await mongoDBService.playersCollection.createIndex({ chatId: 1 }, { unique: true });
    await mongoDBService.playersCollection.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 86400 }); // Optional TTL
    console.log('Indexes created');
    process.exit(0);
}

createIndexes().catch(console.error);
