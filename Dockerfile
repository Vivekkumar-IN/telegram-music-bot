FROM node:22-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    ffmpeg \
    curl \
  && rm -rf /var/lib/apt/lists/*

RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
  && chmod +x /usr/local/bin/yt-dlp

COPY package*.json ./
RUN npm install --production

COPY . .

RUN mkdir -p ./temp_audio ./temp

EXPOSE 3000

CMD ["node", "src/app.js"]
