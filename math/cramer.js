const bot = require("../bot");

function cramer(chatId) {
    bot.sendMessage(chatId, "📐 Cramer ishlanmoqda...");
}

module.exports = { cramer };