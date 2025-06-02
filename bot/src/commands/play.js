import { Telegraf } from 'telegraf';
import { generateWebAppUrl } from '../webapp';
import { playerService } from '../../backend/src/services/player';
import yts from 'yt-search';
import { streamService } from '../../backend/src/services/ytdlp';

export const setupPlayCommand = (bot) => {
    // Play command - starts or queues playback
    bot.command('play', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const query = ctx.message.text.split(' ').slice(1).join(' ');
            
            if (!query) {
                return ctx.reply('Please provide a search query or YouTube URL after /play');
            }

            // Check if it's a URL
            if (query.match(/youtu\.?be/)) {
                const videoId = extractVideoId(query);
                if (!videoId) {
                    return ctx.reply('Invalid YouTube URL');
                }

                // Get video info
                const info = await yts({ videoId });
                if (!info) {
                    return ctx.reply('Could not fetch video information');
                }

                const track = {
                    id: videoId,
                    title: info.title,
                    duration: info.seconds,
                    thumbnail: info.thumbnail,
                    artist: info.author.name,
                    url: info.url
                };

                // Add to player
                const player = playerService.play(chatId, track);
                
                // Generate stream URL
                const streamUrl = await streamService.createStream(videoId);
                
                return ctx.replyWithAudio(streamUrl, {
                    title: track.title,
                    performer: track.artist,
                    caption: `Now playing: ${track.title}`,
                    reply_markup: getPlayerControls(chatId)
                });
            } else {
                // It's a search query
                const webAppUrl = generateWebAppUrl(query);
                
                await ctx.reply('Open the player to listen:', {
                    reply_markup: {
                        inline_keyboard: [
                            [{
                                text: '🎵 Open Music Player',
                                web_app: { url: webAppUrl }
                            }]
                        ]
                    }
                });
            }
        } catch (error) {
            console.error('Play command error:', error);
            ctx.reply('Failed to process your request. Please try again.');
        }
    });

    // Pause command
    bot.command('pause', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const player = playerService.pause(chatId);
            
            if (!player.currentTrack) {
                return ctx.reply('No active playback to pause');
            }
            
            await ctx.reply(`⏸ Paused: ${player.currentTrack.title}`, {
                reply_markup: getPlayerControls(chatId)
            });
        } catch (error) {
            console.error('Pause error:', error);
            ctx.reply('Failed to pause playback');
        }
    });

    // Resume command
    bot.command('resume', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const player = playerService.resume(chatId);
            
            if (!player.currentTrack) {
                return ctx.reply('No track to resume');
            }
            
            await ctx.reply(`▶ Resumed: ${player.currentTrack.title}`, {
                reply_markup: getPlayerControls(chatId)
            });
        } catch (error) {
            console.error('Resume error:', error);
            ctx.reply('Failed to resume playback');
        }
    });

    // Stop command
    bot.command('stop', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const player = playerService.stop(chatId);
            
            if (!player.currentTrack) {
                return ctx.reply('No active playback to stop');
            }
            
            await ctx.reply(`⏹ Stopped: ${player.currentTrack.title}`);
        } catch (error) {
            console.error('Stop error:', error);
            ctx.reply('Failed to stop playback');
        }
    });

    // End command - clears the queue and stops playback
    bot.command('end', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            playerService.end(chatId);
            await ctx.reply('❌ Playback session ended');
        } catch (error) {
            console.error('End error:', error);
            ctx.reply('Failed to end session');
        }
    });

    // Status command
    bot.command('status', async (ctx) => {
        try {
            const chatId = ctx.chat.id;
            const player = playerService.getState(chatId);
            
            if (!player.currentTrack) {
                return ctx.reply('No active playback');
            }
            
            await ctx.reply(
                `🎵 ${player.isPlaying ? 'Now Playing' : 'Paused'}: ${player.currentTrack.title}\n` +
                `👤 Artist: ${player.currentTrack.artist}\n` +
                `⏱ Position: ${formatTime(player.position)}/${formatTime(player.currentTrack.duration)}\n` +
                `🎧 Volume: ${player.volume}%`,
                {
                    reply_markup: getPlayerControls(chatId)
                }
            );
        } catch (error) {
            console.error('Status error:', error);
            ctx.reply('Failed to get player status');
        }
    });

    // Helper function to extract video ID from URL
    function extractVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // Format time (seconds to MM:SS)
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    // Generate player control buttons
    function getPlayerControls(chatId) {
        const player = playerService.getState(chatId);
        const isPlaying = player.isPlaying;
        
        return {
            inline_keyboard: [
                [
                    { text: '⏮ Previous', callback_data: 'prev' },
                    { text: isPlaying ? '⏸ Pause' : '▶ Play', callback_data: isPlaying ? 'pause' : 'play' },
                    { text: '⏭ Next', callback_data: 'next' }
                ],
                [
                    { text: '⏹ Stop', callback_data: 'stop' },
                    { text: '🔀 Shuffle', callback_data: 'shuffle' },
                    { text: '🔉 Volume', callback_data: 'volume' }
                ],
                [
                    { text: '❌ End Session', callback_data: 'end' }
                ]
            ]
        };
    }

    // Handle button callbacks
    bot.action('play', async (ctx) => {
        const chatId = ctx.chat.id;
        playerService.resume(chatId);
        await ctx.editMessageReplyMarkup(getPlayerControls(chatId));
        await ctx.answerCbQuery('▶ Playback resumed');
    });

    bot.action('pause', async (ctx) => {
        const chatId = ctx.chat.id;
        playerService.pause(chatId);
        await ctx.editMessageReplyMarkup(getPlayerControls(chatId));
        await ctx.answerCbQuery('⏸ Playback paused');
    });

    bot.action('stop', async (ctx) => {
        const chatId = ctx.chat.id;
        playerService.stop(chatId);
        await ctx.deleteMessage();
        await ctx.answerCbQuery('⏹ Playback stopped');
    });

    bot.action('end', async (ctx) => {
        const chatId = ctx.chat.id;
        playerService.end(chatId);
        await ctx.deleteMessage();
        await ctx.answerCbQuery('❌ Session ended');
    });
};
