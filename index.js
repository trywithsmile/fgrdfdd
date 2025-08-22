const TelegramBot = require('node-telegram-bot-api');

const TOKEN = process.env.BOT_TOKEN;
const CHANNEL_USERNAME = process.env.CHANNEL_USERNAME;

const bot = new TelegramBot(TOKEN, { polling: true });

console.log('Bot started successfully!');

const processedMediaGroups = new Set();

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = '🤖 Image Link Bot\n\nI automatically add channel links to image captions in your private channel.\n\nHow to use:\n1. Add me to your channel as admin\n2. Give me permission to send messages\n3. I will automatically add links to all images';
  
  bot.sendMessage(chatId, welcomeMessage);
});

bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = 'Need help?\n\nJust add me to your channel as administrator with permission to send messages. I will automatically handle the rest!\n\nMake sure I have the right permissions in your channel.';
  
  bot.sendMessage(chatId, helpMessage);
});

bot.on('photo', async (msg) => {
  try {
    if (msg.chat.type !== 'channel') return;
    
    if (msg.media_group_id && processedMediaGroups.has(msg.media_group_id)) return;
    
    try {
      const botMember = await bot.getChatMember(msg.chat.id, (await bot.getMe()).id);
      if (!['creator', 'administrator'].includes(botMember.status)) {
        console.log('Bot is not admin in channel:', msg.chat.title);
        return;
      }
    } catch (error) {
      console.log('Bot is not in channel:', msg.chat.title);
      return;
    }
    
    if (msg.media_group_id) {
      processedMediaGroups.add(msg.media_group_id);
      setTimeout(() => {
        processedMediaGroups.delete(msg.media_group_id);
      }, 10000);
    }
    
    const photo = msg.photo[msg.photo.length - 1];
    const fileId = photo.file_id;
    
    const channelLink = `https://t.me/${CHANNEL_USERNAME}/${msg.message_id}`;
    
    let newCaption = msg.caption || '';
    newCaption = newCaption ? newCaption + '\n\n🔗 ' + channelLink : '🔗 ' + channelLink;
    
    await bot.sendPhoto(msg.chat.id, fileId, {
      caption: newCaption,
      reply_to_message_id: msg.message_id
    });
    
    try {
      await bot.deleteMessage(msg.chat.id, msg.message_id);
    } catch (error) {
      console.log('Cannot delete message:', error.message);
    }
    
  } catch (error) {
    console.error('Error processing photo:', error);
  }
});

bot.on('error', (error) => {
  console.error('Bot error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled error:', error);
});
