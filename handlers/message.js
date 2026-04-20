const bot = require("../bot");
const User = require("../models/User");
const { get, set, clear } = require("../core/state");
const { ADMIN_ID } = require("../config");
const { gauss } = require("../math/gauss");
const { cramer } = require("../math/cramer");

const MAX_RETRY = 3;

bot.on("message", async (msg) => {
    if (!msg.text || msg.text.startsWith("/")) return;

    const chatId = msg.chat.id;
    const st = get(chatId);

    // broadcast
    if (String(chatId) === String(ADMIN_ID) && st.mode === "broadcast") {
        const users = await User.find({});
        clear(chatId);

        for (let u of users) {
            try {
                await bot.sendMessage(u.chatId, msg.text);
            } catch {}
        }
        return;
    }

    // help
    if (st.mode === "help") {
        clear(chatId);
        return bot.sendMessage(chatId, "✔ Yuborildi");
    }

    if (!st.size) return;

    const expected = st.size + 1;
    const row = msg.text.split(",").map(v => Number(v.trim()));

    const invalid =
        row.length !== expected ||
        row.some(v => isNaN(v));

    if (invalid) {
        st.retry = (st.retry || 0) + 1;

        if (st.retry >= MAX_RETRY) {
            clear(chatId);
            return bot.sendMessage(chatId,
                "❌ Juda ko‘p xato\n/start bosing"
            );
        }

        return bot.sendMessage(chatId,
            `❌ Xato format!\n📌 ${expected} ta son kiriting\n⚠ ${st.retry}/${MAX_RETRY}`
        );
    }

    st.retry = 0;
    st.matrix.push(row);
    st.row++;

    if (st.row < st.size) {
        return bot.sendMessage(chatId,
            `📝 ${st.row + 1}-qator`
        );
    }

    if (st.method === "gauss") gauss(chatId, st.matrix);
    else cramer(chatId, st.matrix);
});