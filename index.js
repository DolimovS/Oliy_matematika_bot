require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const bot = new TelegramBot(process.env.TOKEN, { polling: true });

const state = {};

/* ================= START ================= */
bot.onText(/\/start/, (msg) => {
    state[msg.chat.id] = {};
    bot.sendMessage(msg.chat.id, "👋 Assalomu alaykum!\n\nMatritsa o‘lchamini tanlang:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "4 × 4", callback_data: "size_4" }]
            ]
        }
    });
});

/* ============== CALLBACK ================= */
bot.on("callback_query", (q) => {
    const chatId = q.message.chat.id;

    if (q.data === "size_4") {
        state[chatId] = {
            size: 4,
            row: 0,
            matrix: []
        };

        bot.sendMessage(chatId, "🔢 Usulni tanlang:", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Gauss usuli", callback_data: "gauss" }],
                    [{ text: "🔙 Orqaga", callback_data: "back" }]
                ]
            }
        });
    }

    if (q.data === "gauss") {
        askRow(chatId);
    }

    if (q.data === "back") {
        state[chatId] = {};
        bot.sendMessage(chatId, "🔙 Bosh menyu", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "4 × 4", callback_data: "size_4" }]
                ]
            }
        });
    }
});

/* ================= INPUT ================= */
bot.on("message", (msg) => {
    const chatId = msg.chat.id;
    const st = state[chatId];

    if (!st || st.row === undefined) return;

    const parts = msg.text.split(",").map(v => Number(v.trim()));

    if (parts.length !== 5 || parts.some(isNaN)) {
        return bot.sendMessage(chatId,
            "❌ Xato!\n5 ta sonni vergul bilan kiriting:\nMasalan:\n1, 2, 3, 4, 5"
        );
    }

    st.matrix.push(parts);
    st.row++;

    if (st.row < 4) {
        askRow(chatId);
    } else {
        gaussSolve(chatId);
    }
});

/* =============== ASK ROW ================= */
function askRow(chatId) {
    const r = state[chatId].row + 1;
    bot.sendMessage(
        chatId,
        `📝 ${r}-qatorni kiriting (a1,a2,a3,a4,b):`
    );
}

/* =============== GAUSS ================= */
function gaussSolve(chatId) {
    let A = JSON.parse(JSON.stringify(state[chatId].matrix));
    let log = "📐 **Gauss usuli yechimi**\n\n";
    const n = 4;

    for (let i = 0; i < n; i++) {
        if (A[i][i] === 0) {
            return finish(chatId, "❌ Yechim yo‘q (nolga bo‘linish).");
        }

        let div = A[i][i];
        log += `➡ ${i + 1}-qator ${div} ga bo‘lindi\n`;

        for (let j = 0; j <= n; j++) {
            A[i][j] /= div;
        }

        log = printMatrix(A, log);

        for (let k = i + 1; k < n; k++) {
            let mul = A[k][i];
            log += `➡ ${k + 1}-qator − (${mul}) × ${i + 1}-qator\n`;

            for (let j = 0; j <= n; j++) {
                A[k][j] -= mul * A[i][j];
            }

            log = printMatrix(A, log);
        }
    }

    log += "✅ **Natija:**\n";
    for (let i = 0; i < n; i++) {
        log += `x${i + 1} = ${A[i][n].toFixed(1)}\n`;
    }

    finish(chatId, log);
}

/* ============ MATRIX PRINT ============ */
function printMatrix(A, text) {
    text += "\n";
    A.forEach(r => {
        r.forEach((v, i) => {
            if (i === r.length - 1) text += " | ";
            text += v.toFixed(1) + " ";
        });
        text += "\n";
    });
    text += "\n";
    return text;
}

/* ================ END ================= */
function finish(chatId, txt) {
    bot.sendMessage(chatId, txt, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🔙 Orqaga", callback_data: "back" }]
            ]
        }
    });
}
