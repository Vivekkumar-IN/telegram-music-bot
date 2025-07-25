import { mongoDBService } from './mongodb.js';

class PlayerService {
    /**
     * Get or create player state for a chat
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Player state
     */
    async getPlayer(chatId) {
        try {
            const player = await mongoDBService.getPlayer(chatId);
            return player;
        } catch (error) {
            console.error('Error getting player:', error);
            throw new Error('Failed to get player state');
        }
    }

    /**
     * Start playing a track
     * @param {string} chatId - Telegram chat ID
     * @param {Object} track - Track to play
     * @returns {Promise<Object>} Updated player state
     */
    async play(chatId, track) {
        try {
            const update = {
                currentTrack: {
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    thumbnail: track.thumbnail,
                    url: track.url
                },
                queue: [{
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    duration: track.duration,
                    thumbnail: track.thumbnail
                }],
                isPlaying: true,
                position: 0,
                updatedAt: new Date()
            };

            await mongoDBService.updatePlayer(chatId, update);
            return update;
        } catch (error) {
            console.error('Error in play:', error);
            throw new Error('Failed to start playback');
        }
    }

    /**
     * Pause playback
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Updated player state
     */
    async pause(chatId) {
        try {
            const update = { 
                isPlaying: false,
                updatedAt: new Date() 
            };
            await mongoDBService.updatePlayer(chatId, update);
            return await mongoDBService.getPlayer(chatId);
        } catch (error) {
            console.error('Error in pause:', error);
            throw new Error('Failed to pause playback');
        }
    }

    /**
     * Resume playback
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Updated player state
     */
    async resume(chatId) {
        try {
            const update = { 
                isPlaying: true,
                updatedAt: new Date() 
            };
            await mongoDBService.updatePlayer(chatId, update);
            return await mongoDBService.getPlayer(chatId);
        } catch (error) {
            console.error('Error in resume:', error);
            throw new Error('Failed to resume playback');
        }
    }

    /**
     * Stop playback (reset position)
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Updated player state
     */
    async stop(chatId) {
        try {
            const update = {
                isPlaying: false,
                position: 0,
                updatedAt: new Date()
            };
            await mongoDBService.updatePlayer(chatId, update);
            return await mongoDBService.getPlayer(chatId);
        } catch (error) {
            console.error('Error in stop:', error);
            throw new Error('Failed to stop playback');
        }
    }

    /**
     * End session completely
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<null>}
     */
    async end(chatId) {
        try {
            await mongoDBService.deletePlayer(chatId);
            return null;
        } catch (error) {
            console.error('Error in end:', error);
            throw new Error('Failed to end session');
        }
    }

    /**
     * Update playback position
     * @param {string} chatId - Telegram chat ID
     * @param {number} position - Current position in seconds
     * @returns {Promise<void>}
     */
    async updatePosition(chatId, position) {
        try {
            await mongoDBService.updatePlayer(chatId, {
                position: parseFloat(position),
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error updating position:', error);
            throw new Error('Failed to update playback position');
        }
    }

    /**
     * Add track to queue
     * @param {string} chatId - Telegram chat ID
     * @param {Object} track - Track to add
     * @returns {Promise<Object>} Updated player state
     */
    async addToQueue(chatId, track) {
        try {
            const player = await mongoDBService.getPlayer(chatId);
            const newQueue = [...player.queue, {
                id: track.id,
                title: track.title,
                artist: track.artist,
                duration: track.duration,
                thumbnail: track.thumbnail
            }];

            await mongoDBService.updatePlayer(chatId, {
                queue: newQueue,
                updatedAt: new Date()
            });

            return await mongoDBService.getPlayer(chatId);
        } catch (error) {
            console.error('Error adding to queue:', error);
            throw new Error('Failed to add track to queue');
        }
    }

    /**
     * Skip to next track in queue
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Updated player state
     */
    async skipNext(chatId) {
        try {
            const player = await mongoDBService.getPlayer(chatId);
            
            if (player.queue.length <= 1) {
                throw new Error('No tracks in queue to skip to');
            }

            const newQueue = player.queue.slice(1);
            const nextTrack = newQueue[0];

            const update = {
                currentTrack: nextTrack,
                queue: newQueue,
                isPlaying: true,
                position: 0,
                updatedAt: new Date()
            };

            await mongoDBService.updatePlayer(chatId, update);
            return update;
        } catch (error) {
            console.error('Error skipping next:', error);
            throw new Error('Failed to skip to next track');
        }
    }

    /**
     * Get current player state
     * @param {string} chatId - Telegram chat ID
     * @returns {Promise<Object>} Player state
     */
    async getState(chatId) {
        try {
            return await mongoDBService.getPlayer(chatId);
        } catch (error) {
            console.error('Error getting state:', error);
            throw new Error('Failed to get player state');
        }
    }
    /**
     * Set volume for the player
     * @param {string} chatId - Telegram chat ID
     * @param {number} volume - Volume level (0-100)
     * @returns {Promise<void>}
     */
    async setVolume(chatId, volume) {
        try {
            const clampedVolume = Math.max(0, Math.min(100, volume));
            await mongoDBService.updatePlayer(chatId, { 
                volume: clampedVolume,
                updatedAt: new Date() 
            });
        } catch (error) {
            console.error('Error setting volume:', error);
            throw new Error('Failed to set volume');
        }
    }

    /**
     * Set playback speed for the player
     * @param {string} chatId - Telegram chat ID
     * @param {number} speed - Playback speed (0.5-2.0)
     * @returns {Promise<void>}
     */
    async setPlaybackSpeed(chatId, speed) {
        try {
            const clampedSpeed = Math.max(0.5, Math.min(2.0, speed));
            await mongoDBService.updatePlayer(chatId, {
                playbackSpeed: clampedSpeed,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error setting speed:', error);
            throw new Error('Failed to set playback speed');
        }
    }
}

export const playerService = new PlayerService();

