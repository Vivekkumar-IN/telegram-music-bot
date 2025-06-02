import { cache } from './cache';

class PlayerService {
    constructor() {
        this.players = new Map(); // chatId -> player state
    }

    getPlayer(chatId) {
        if (!this.players.has(chatId)) {
            this.players.set(chatId, {
                currentTrack: null,
                queue: [],
                isPlaying: false,
                position: 0,
                volume: 50
            });
        }
        return this.players.get(chatId);
    }

    play(chatId, track) {
        const player = this.getPlayer(chatId);
        player.currentTrack = track;
        player.isPlaying = true;
        player.position = 0;
        return player;
    }

    pause(chatId) {
        const player = this.getPlayer(chatId);
        if (player.isPlaying) {
            player.isPlaying = false;
        }
        return player;
    }

    resume(chatId) {
        const player = this.getPlayer(chatId);
        if (!player.isPlaying) {
            player.isPlaying = true;
        }
        return player;
    }

    stop(chatId) {
        const player = this.getPlayer(chatId);
        player.isPlaying = false;
        player.position = 0;
        return player;
    }

    end(chatId) {
        const player = this.getPlayer(chatId);
        player.currentTrack = null;
        player.isPlaying = false;
        player.position = 0;
        this.players.delete(chatId);
        return null;
    }

    getState(chatId) {
        return this.getPlayer(chatId);
    }
}

export const playerService = new PlayerService();
