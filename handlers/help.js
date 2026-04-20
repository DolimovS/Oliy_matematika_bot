const bot = require("../bot");
const { set, clear } = require("../core/state");

bot.onText(/\/help/, (msg) => {
    set(msg.chat.id, { mode: "help" });

    bot.sendMessage(msg.chat.id, "🆘 Savolingizni yozing:");
});