const bot = require("../bot");
const User = require("../models/User");
const { ADMIN_ID } = require("../config");
const { set, clear } = require("../core/state");
const { mainMenu, methodMenu } = require("../core/menus");

bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    const isAdmin = String(chatId) === String(ADMIN_ID);

    await bot.answerCallbackQuery(q.id);

    if (isAdmin && q.data === "users") {
        const count = await User.countDocuments();
        return bot.sendMessage(chatId, `👥 Users: ${count}`);
    }

    if (isAdmin && q.data === "broadcast") {
        set(chatId, { mode: "broadcast" });
        return bot.sendMessage(chatId, "📢 Xabar yozing:");
    }

    switch (q.data) {
        case "size_3":
        case "size_4":
            set(chatId, {
                size: Number(q.data.split("_")[1]),
                matrix: [],
                row: 0
            });

            return bot.sendMessage(chatId,
                "📌 Usulni tanlang:",
                { reply_markup: methodMenu }
            );

        case "gauss":
        case "cramer":
            set(chatId, {
                method: q.data,
                matrix: [],
                row: 0,
                retry: 0
            });

            return bot.sendMessage(chatId,
                "📝 Format: a, b, c, d\n💡 Misol: 1, 2, 3, 4"
            );

        case "back":
            clear(chatId);
            return bot.sendMessage(chatId,
                "🔙 Menu",
                { reply_markup: mainMenu }
            );
    }
});