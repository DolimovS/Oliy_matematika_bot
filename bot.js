const TelegramBot = require("node-telegram-bot-api");
const { TOKEN } = require("./config");

const bot = new TelegramBot(TOKEN, { polling: true });

module.exports = bot;