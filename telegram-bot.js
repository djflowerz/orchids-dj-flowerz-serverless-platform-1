const TelegramBot = require("node-telegram-bot-api");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize Firebase
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./service-account.json'); // Fallback if local

try {
  initializeApp({
    credential: cert(serviceAccount)
  });
} catch (e) {
  console.log("Firebase already initialized or error:", e.message);
}

const db = getFirestore();
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

console.log('🤖 DJ FLOWERZ Bot is running...');

bot.onText(/\/start/, async (msg) => {
  try {
    const telegramId = msg.from.id.toString();
    await db.collection("users").doc(telegramId).set({
      telegramId: msg.from.id,
      username: msg.from.username || null,
      updated_at: new Date()
    }, { merge: true });

    bot.sendMessage(msg.chat.id, "Telegram linked successfully. Please make sure your email is linked in the web app.");
  } catch (error) {
    console.error("Error in /start:", error);
    bot.sendMessage(msg.chat.id, "Error linking account.");
  }
});

bot.onText(/\/status/, async (msg) => {
  try {
    const telegramId = msg.from.id.toString();

    // Check if we have a user with this telegram id
    // Note: The web app needs to save telegram_user_id to the user doc, 
    // OR we need to lookup by the user document ID which matches telegramId if we set it that way above.
    // However, usually users exist in Auth with a UID. We need to map UID <-> TelegramID.
    // The provided snippet assumes calling .doc(msg.from.id.toString()) on 'subscriptions'.
    // This implies the subscription ID IS the telegram ID, or there is a mechanism to map.
    // For now, I follow the snippet's logic:

    const sub = await db.collection("subscriptions")
      .doc(telegramId)
      .get();

    if (!sub.exists || sub.data().status !== "active") {
      bot.sendMessage(msg.chat.id, "Subscription inactive.");
      return;
    }

    bot.sendMessage(msg.chat.id, "Subscription active. Enjoy the packs.");
  } catch (error) {
    console.error("Error in /status:", error);
    bot.sendMessage(msg.chat.id, "Error checking status.");
  }
});

// Error handling
bot.on('polling_error', (error) => {
  console.error(error);
});
