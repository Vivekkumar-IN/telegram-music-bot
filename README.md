# Telegram Music Bot 🎵

A feature-rich Telegram music bot with Web App interface that supports YouTube and YouTube Music links, powered by yt-dlp and MongoDB.

<!-- ![Demo Screenshot](demo-screenshot.png) -->

## Features ✨

### Core Functionality
- 🎧 Play audio from YouTube/YouTube Music links
- 🔍 Search for tracks directly from Telegram
- 📱 Interactive Web App player interface
- 🐳 Docker-ready deployment

### Playback Controls
- ▶️/⏸️ Play/Pause toggle
- ⏭️ Next track in queue
- ⏮️ Previous track
- 🔈 Volume control (0-100%)
- ⏩ Playback speed (0.5x-2.0x)
- 🎯 Seekbar scrubbing
- ⏹️ Stop/reset playback
- ❌ End session completely

### Technical Highlights
- 🍃 MongoDB persistence for player state
- ⚡ yt-dlp with speed/quality control
- 🔄 Real-time sync across devices
- 📊 Cached audio streams

## Technologies Used 🛠️

- **Backend**: Node.js, Express, yt-dlp
- **Bot**: Telegraf.js (Telegram Bot API)
- **Frontend**: HTML5, CSS, JavaScript, Vite
- **Caching**: node-cache
- **Containerization**: Docker

## Setup Guide 🛠️

### Prerequisites
1. **Telegram Bot Token** ([@BotFather](https://t.me/BotFather))
2. **MongoDB** (local or [Atlas](https://www.mongodb.com/atlas))
3. **yt-dlp** installed system-wide
4. **FFmpeg** for audio processing
5. **Node.js v16+**

### Clone the repository

```bash
git clone https://github.com/Pranav-Saraswat/telegram-music-bot.git
cd telegram-music-bot
```

### Configuration
1. Rename `.env.example` to `.env` and populate:

```env
# Backend
MONGO_URI=mongodb://localhost:27017
YTDLP_PATH=/usr/local/bin/yt-dlp
TEMP_DIR=./temp_audio

# Bot
TELEGRAM_BOT_TOKEN=your_bot_token
WEBAPP_BASE_URL=https://yourdomain.com
```

### New Installation Steps
```bash
# Install yt-dlp and FFmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
sudo apt install ffmpeg  # Ubuntu/Debian

# Install dependencies
cd backend && npm install
cd ../bot && npm install
cd ../webapp && npm install

# Start services
docker-compose up -d  # MongoDB
cd backend && npm start
cd ../bot && npm start
```

## Updated API Endpoints 🔌

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/player/play` | GET | Start playback |
| `/api/player/seek` | GET | Update playback position |
| `/api/player/speed` | GET | Adjust playback speed |
| `/api/player/volume` | GET | Change volume level |
| `/api/player/state` | GET | Get current player state |

## New Bot Commands 🎛️

| Command | Description | Example |
|---------|-------------|---------|
| `/speed [value]` | Set playback speed | `/speed 1.5` |
| `/seek [seconds]` | Jump to position | `/seek 120` |
| `/volume [1-100]` | Adjust volume | `/volume 80` |

## Deployment Notes 🚀

### MongoDB Considerations
- Ensure indexes are created:
  ```javascript
  db.players.createIndex({ chatId: 1 }, { unique: true })
  ```
- Set up TTL for automatic cleanup:
  ```javascript
  db.players.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 2592000 }) // 30 days
  ```

### Performance Tips
- Allocate at least 512MB RAM for MongoDB
- Set up a cron job for temp file cleanup:
  ```bash
  0 * * * * find /path/to/temp_audio -name "stream_*" -mmin +60 -delete
  ```

## Troubleshooting 🔧

| Issue | Solution |
|-------|----------|
| Speed control not working | Verify yt-dlp version ≥ 2023.07.06 |
| Seek jumps back | Check MongoDB connection latency |
| Volume resets | Ensure `volume` field exists in player document |

## Contributing 🤝

Contributions are welcome! Please open an issue or submit a pull request.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support ☕

If you find this project useful, consider starring the repository or buying me a coffee!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/pranav_saraswat)
