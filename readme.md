# Telegram Music Bot 🎵

A feature-rich Telegram music bot with Web App interface that supports YouTube and YouTube Music links, powered by yt-dlp.

<!-- ![Demo Screenshot](demo-screenshot.png) -->

## Features ✨

- 🎧 Play music from YouTube and YouTube Music
- 🔍 Search for tracks directly from Telegram
- 🎛️ Web App player with play/pause/stop controls
- ⏭️ Skip tracks and control volume
- ⏳ Progress bar and time display
- 🔄 Caching for faster performance
- 🐳 Docker support for easy deployment

## Technologies Used 🛠️

- **Backend**: Node.js, Express, yt-dlp
- **Bot**: Telegraf.js (Telegram Bot API)
- **Frontend**: HTML5, CSS, JavaScript, Vite
- **Caching**: node-cache
- **Containerization**: Docker

## Installation 🚀

### Prerequisites

- Node.js (v16+)
- yt-dlp installed on your system
- Telegram Bot Token from [@BotFather](https://t.me/BotFather)
- Redis (for caching, optional)

### 1. Clone the repository

```bash
git clone https://github.com/Pranav-Saraswat/telegram-music-bot.git
cd telegram-music-bot
```

### 2. Install dependencies

```bash
# Backend
cd backend && npm install

# Bot
cd ../bot && npm install

# Web App
cd ../webapp && npm install
```

### 3. Configure environment variables

Create `.env` files in each directory with the required variables (see `.env.example` files).

### 4. Run the services

```bash
# In separate terminals:

# Backend
cd backend && npm start

# Bot
cd ../bot && npm start

# Web App (development)
cd ../webapp && npm run dev
```

### Docker Setup (Alternative)

```bash
docker-compose up --build
```

## Configuration ⚙️

### Backend

- `PORT`: Server port (default: 3000)
- `BASE_URL`: Base URL for the backend
- `TEMP_DIR`: Directory for temporary files
- `YTDLP_PATH`: Path to yt-dlp executable

### Bot

- `TELEGRAM_BOT_TOKEN`: Your bot token from BotFather
- `WEBAPP_BASE_URL`: URL where the web app is hosted
- `BACKEND_API_URL`: URL of the backend API

## Deployment ☁️

### Manual Deployment

1. Build the web app:
   ```bash
   cd webapp && npm run build
   ```

2. Set up a reverse proxy (Nginx/Apache) for the backend and web app.

### Docker Deployment

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build -d
   ```

2. Configure your reverse proxy to point to the Docker services.

## Usage 📱

1. Start a chat with your bot in Telegram
2. Use the `/play` command followed by a search query or YouTube URL
3. The bot will respond with a button to open the Web App player
4. Control playback from the Web App interface

## Contributing 🤝

Contributions are welcome! Please open an issue or submit a pull request.

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support ☕

If you find this project useful, consider starring the repository or buying me a coffee!

[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://buymeacoffee.com/pranav_saraswat)
```

