/**
 * DJ FLOWERZ Telegram Bot
 * 
 * This is a standalone Node.js bot for managing Music Pool subscriptions.
 * Deploy separately on a server or use serverless functions.
 * 
 * Commands:
 * /start - Welcome message
 * /link <email> - Link Telegram to account
 * /status - Check subscription status
 * 
 * Setup:
 * 1. Create a bot via @BotFather on Telegram
 * 2. Get the bot token
 * 3. Set TELEGRAM_BOT_TOKEN in environment
 * 4. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * 5. Run: npm install telegraf @supabase/supabase-js
 * 6. Run: node telegram-bot.js
 */

const { Telegraf } = require('telegraf');
const { createClient } = require('@supabase/supabase-js');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MUSIC_POOL_GROUP_ID = process.env.TELEGRAM_MUSIC_POOL_GROUP_ID;

if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

bot.start((ctx) => {
  ctx.reply(
    `🎵 Welcome to DJ FLOWERZ Bot!\n\n` +
    `Commands:\n` +
    `/link <email> - Link your account\n` +
    `/status - Check subscription status\n\n` +
    `Subscribe to the Music Pool to get access to exclusive content!`
  );
});

bot.command('link', async (ctx) => {
  const email = ctx.message.text.split(' ')[1];
  
  if (!email || !email.includes('@')) {
    return ctx.reply('❌ Please provide a valid email.\nUsage: /link your@email.com');
  }

  const telegramUserId = ctx.from.id.toString();
  const telegramUsername = ctx.from.username || '';

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return ctx.reply('❌ No account found with that email. Please sign up first at djflowerz.com');
  }

  await supabase
    .from('users')
    .update({ 
      telegram_user_id: telegramUserId,
      telegram_username: telegramUsername 
    })
    .eq('email', email);

  ctx.reply(
    `✅ Account linked successfully!\n\n` +
    `Email: ${email}\n` +
    `Subscription: ${user.subscription_status === 'active' ? '✅ Active' : '❌ Inactive'}\n\n` +
    `Use /status to check your subscription anytime.`
  );

  if (user.subscription_status === 'active' && MUSIC_POOL_GROUP_ID) {
    try {
      await bot.telegram.unbanChatMember(MUSIC_POOL_GROUP_ID, telegramUserId);
      ctx.reply('🎉 You have been added to the Music Pool group!');
    } catch (e) {
      console.error('Failed to add to group:', e);
    }
  }
});

bot.command('status', async (ctx) => {
  const telegramUserId = ctx.from.id.toString();

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_user_id', telegramUserId)
    .single();

  if (!user) {
    return ctx.reply(
      '❌ Your Telegram is not linked to any account.\n' +
      'Use /link <email> to connect your account.'
    );
  }

  const isActive = user.subscription_status === 'active';
  const expiresAt = user.subscription_expires_at 
    ? new Date(user.subscription_expires_at).toLocaleDateString()
    : 'N/A';

  ctx.reply(
    `📊 Subscription Status\n\n` +
    `Email: ${user.email}\n` +
    `Status: ${isActive ? '✅ Active' : '❌ Inactive'}\n` +
    `${isActive ? `Expires: ${expiresAt}` : 'Subscribe at djflowerz.com/music-pool'}`
  );
});

async function checkExpiredSubscriptions() {
  const { data: expiredUsers } = await supabase
    .from('users')
    .select('*')
    .eq('subscription_status', 'active')
    .lt('subscription_expires_at', new Date().toISOString());

  for (const user of expiredUsers || []) {
    await supabase
      .from('users')
      .update({ subscription_status: 'expired' })
      .eq('id', user.id);

    if (user.telegram_user_id && MUSIC_POOL_GROUP_ID) {
      try {
        await bot.telegram.banChatMember(MUSIC_POOL_GROUP_ID, user.telegram_user_id);
        await bot.telegram.sendMessage(
          user.telegram_user_id,
          '⚠️ Your Music Pool subscription has expired.\n' +
          'Renew at djflowerz.com/music-pool to continue access.'
        );
      } catch (e) {
        console.error('Failed to remove from group:', e);
      }
    }
  }
}

setInterval(checkExpiredSubscriptions, 60 * 60 * 1000);

bot.launch();
console.log('🤖 DJ FLOWERZ Bot is running...');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
