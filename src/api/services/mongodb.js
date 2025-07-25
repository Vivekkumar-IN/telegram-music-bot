import { MongoClient } from 'mongodb';
import { config } from '../config';

class MongoDBService {
    constructor() {
        this.client = new MongoClient(config.mongoUri);
        this.db = null;
        this.playersCollection = null;
    }

    async connect() {
        await this.client.connect();
        this.db = this.client.db('telegramMusicBot');
        this.playersCollection = this.db.collection('players');
    }

    async getPlayer(chatId) {
        const player = await this.playersCollection.findOne({ chatId });
        return player || this.createPlayer(chatId);
    }

    async createPlayer(chatId) {
        const newPlayer = {
            chatId,
            currentTrack: null,
            queue: [],
            isPlaying: false,
            position: 0,
            volume: 50,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.playersCollection.insertOne(newPlayer);
        return newPlayer;
    }

    async updatePlayer(chatId, update) {
        await this.playersCollection.updateOne(
            { chatId },
            { $set: { ...update, updatedAt: new Date() } }
        );
    }

    async deletePlayer(chatId) {
        await this.playersCollection.deleteOne({ chatId });
    }

    async createPlaylist({ userId, name, tracks }) {
        return this.playlistsCollection.insertOne({
            userId,
            name,
            tracks,
            created: new Date()
        });
    }

    async getUserPlaylists(userId) {
        return this.playlistsCollection.find({ userId }).toArray();
    }
}

export const mongoDBService = new MongoDBService();
console.log('Connected to MongoDB');