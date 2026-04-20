const bot = require("../bot");
const User = require("../models/User");
const { ADMIN_ID } = require("../config");
const { clear } = require("../core/state");
const { mainMenu } = require("../core/menus");

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    clear(chatId);

    // 💾 MongoDB save
    await User.updateOne(
        { chatId: String(chatId) },
        {
            chatId: String(chatId),
            firstName: msg.from.first_name,
            username: msg.from.username
        },
        { upsert: true }
    );

    if (String(chatId) === String(ADMIN_ID)) {
        bot.sendMessage(chatId, "🔧 Admin Panel", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "👥 Users", callback_data: "users" }],
                    [{ text: "📢 Broadcast", callback_data: "broadcast" }],
                    ...mainMenu.inline_keyboard
                ]
            }
        });
    } else {
        bot.sendMessage(chatId, "👋 Xush kelibsiz!", {
            reply_markup: mainMenu
        });
    }
});