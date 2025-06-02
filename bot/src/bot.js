import { Telegraf } from 'telegraf';
import { setupPlayCommand } from './commands/play';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set up commands
setupPlayCommand(bot);

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('An error occurred. Please try again.');
});

// Start bot
bot.launch()
    .then(() => console.log('Bot started successfully'))
    .catch(err => console.error('Bot failed to start:', err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;