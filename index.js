require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

// ─────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────
const TOKEN    = process.env.TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

if (!TOKEN)    throw new Error("❌ TOKEN muhit o'zgaruvchisi topilmadi!");
if (!ADMIN_ID) console.warn("⚠️  ADMIN_ID muhit o'zgaruvchisi topilmadi!");

const bot = new TelegramBot(TOKEN, { polling: true });

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const userState = {};
const users     = new Set();

function getState(chatId)      { return userState[chatId] || null; }
function setState(chatId, val) { userState[chatId] = { ...(userState[chatId] || {}), ...val }; }
function clearState(chatId)    { delete userState[chatId]; }

// ─────────────────────────────────────────────
// COMMANDS
// ─────────────────────────────────────────────
bot.setMyCommands([
    { command: "start", description: "Botni ishga tushirish" },
    { command: "help",  description: "Yordam" }
]).catch(err => console.error("setMyCommands xatosi:", err));

// ─────────────────────────────────────────────
// /start
// ─────────────────────────────────────────────
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    clearState(chatId);
    users.add(chatId);

    if (String(chatId) === String(ADMIN_ID)) {
        bot.sendMessage(chatId, `🔧 Assalomu alaykum, Admin!\nQuyidagi amallardan birini tanlang:`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "👥 Foydalanuvchilar soni", callback_data: "user_count" },
                        { text: "📢 Xabar yuborish",        callback_data: "broadcast"   }
                    ],
                    [{ text: "4 × 4", callback_data: "size_4" }],
                    [{ text: "3 × 3", callback_data: "size_3" }]
                ]
            }
        }).catch(e => console.error(e));
    } else {
        sendMainMenu(chatId,
            `Assalomu alaykum! ${msg.from.first_name} Oliy matematika botiga xush kelibsiz.\nQuyidagi amallardan birini tanlang:`
        );
    }
});

// ─────────────────────────────────────────────
// /help
// ─────────────────────────────────────────────
bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    setState(chatId, { mode: "help" });
    await bot.sendMessage(chatId,
        "Yordam bo'limiga xush kelibsiz!\n\nSavolingiz yoki muammoingizni yozing:"
    ).catch(e => console.error(e));
});

// ─────────────────────────────────────────────
// CALLBACK QUERY — bitta handler
// ─────────────────────────────────────────────
bot.on("callback_query", async (q) => {
    const chatId = q.message.chat.id;
    await bot.answerCallbackQuery(q.id).catch(() => {});
    const isAdmin = String(chatId) === String(ADMIN_ID);

    // ── Admin maxsus tugmalar ──
    if (isAdmin) {
        if (q.data === "user_count") {
            await bot.sendMessage(chatId, `👥 Foydalanuvchilar soni: ${users.size}`).catch(e => console.error(e));
            return;
        }
        if (q.data === "broadcast") {
            setState(chatId, { mode: "broadcast" });
            await bot.sendMessage(chatId, "📩 Yuboriladigan xabar matnini kiriting:").catch(e => console.error(e));
            return;
        }
    }

    // ── Umumiy tugmalar ──
    switch (q.data) {
        case "back":
            clearState(chatId);
            if (isAdmin) {
                bot.sendMessage(chatId, `🔧 Admin paneliga qaytdingiz:`, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "👥 Foydalanuvchilar soni", callback_data: "user_count" },
                                { text: "📢 Xabar yuborish",        callback_data: "broadcast"   }
                            ],
                            [{ text: "4 × 4", callback_data: "size_4" }],
                            [{ text: "3 × 3", callback_data: "size_3" }]
                        ]
                    }
                }).catch(e => console.error(e));
            } else {
                sendMainMenu(chatId,
                    "Assalomu alaykum! Oliy matematika botiga xush kelibsiz.\nQuyidagi amallardan birini tanlang:"
                );
            }
            break;

        case "size_3":
            clearState(chatId);
            setState(chatId, { size: 3 });
            sendMethodMenu(chatId);
            break;

        case "size_4":
            clearState(chatId);
            setState(chatId, { size: 4 });
            sendMethodMenu(chatId);
            break;

        case "gauss": {
            const st = getState(chatId);
            if (!st || !st.size) { sendMainMenu(chatId, "❌ Iltimos, avval o'lcham tanlang:"); return; }
            setState(chatId, { method: "gauss", row: 0, matrix: [] });
            askRow(chatId);
            break;
        }

        case "cramer": {
            const st = getState(chatId);
            if (!st || !st.size) { sendMainMenu(chatId, "❌ Iltimos, avval o'lcham tanlang:"); return; }
            setState(chatId, { method: "cramer", row: 0, matrix: [] });
            askRow(chatId);
            break;
        }
    }
});

// ─────────────────────────────────────────────
// MESSAGE HANDLER — bitta unified handler
// ─────────────────────────────────────────────
bot.on("message", async (msg) => {
    if (!msg.text)                return;
    if (msg.text.startsWith("/")) return;

    const chatId  = msg.chat.id;
    const isAdmin = String(chatId) === String(ADMIN_ID);
    users.add(chatId);
    const st = getState(chatId);

    // ── Admin broadcast ──
    if (isAdmin && st && st.mode === "broadcast") {
        clearState(chatId);
        const text = msg.text;
        let success = 0, fail = 0;

        await Promise.allSettled([...users].map(async id => {
            try {
                await bot.sendMessage(id, `${text}`);
                success++;
            } catch { fail++; }
        }));

        await bot.sendMessage(chatId,
            `✅ Xabar yuborildi!\n👥 Jami: ${users.size}\n✔️ Yetkazildi: ${success}\n❌ Xato: ${fail}`
        ).catch(e => console.error(e));
        return;
    }

    // ── /help yordam rejimi ──
    if (st && st.mode === "help") {
        clearState(chatId);
        if (ADMIN_ID) {
            await bot.sendMessage(ADMIN_ID,
                `📩 Yangi yordam so'rovi:\n👤 Ism: ${msg.from.first_name}\n🔗 Username: ${msg.from.username ? "@" + msg.from.username : "yo'q"}\n🆔 Chat ID: ${chatId}\n💬 Xabar:\n${msg.text}`
            ).catch(e => console.error("Admin xabari yuborishda xato:", e));
        }
        await bot.sendMessage(chatId, "✅ Xabaringiz adminga yuborildi!").catch(e => console.error(e));
        return;
    }

    // ── Matritsa kiritish rejimi ──
    if (!st || st.row === undefined || !st.size || !st.method) {
        await bot.sendMessage(chatId,
            "🤖 Botdan foydalanish uchun /start buyrug'ini bosing yoki quyidagi tugmani tanlang:",
            { reply_markup: { inline_keyboard: [[{ text: "🚀 Boshlash", callback_data: "back" }]] } }
        ).catch(e => console.error(e));
        return;
    }

    const expectedCols = st.size + 1;
    const parts = msg.text.split(",").map(v => Number(v.trim()));

    if (parts.length !== expectedCols || parts.some(isNaN)) {
        await bot.sendMessage(chatId,
            `❌ Xato! ${expectedCols} ta sonni vergul bilan kiriting.\nMasalan: ${Array.from({ length: expectedCols }, (_, i) => i + 1).join(", ")}`
        ).catch(e => console.error(e));
        return;
    }

    st.matrix.push(parts);
    st.row++;

    if (st.row < st.size) {
        askRow(chatId);
    } else {
        if (st.method === "gauss")
            gaussSolveN(chatId);
        else
            solveCramerN(chatId, st.size === 3 ? det3WithSteps : det4WithSteps);
    }
});

// ─────────────────────────────────────────────
// UI HELPERS
// ─────────────────────────────────────────────
function sendMainMenu(chatId, text) {
    return bot.sendMessage(chatId, text, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "4 × 4", callback_data: "size_4" }],
                [{ text: "3 × 3", callback_data: "size_3" }]
            ]
        }
    }).catch(e => console.error("sendMainMenu xatosi:", e));
}

function sendMethodMenu(chatId) {
    return bot.sendMessage(chatId, "🔢 Usulni tanlang:", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "Gauss usuli",  callback_data: "gauss"  }],
                [{ text: "Kramel usuli", callback_data: "cramer" }],
                [{ text: "🔙 Orqaga",   callback_data: "back"   }]
            ]
        }
    }).catch(e => console.error(e));
}

function askRow(chatId) {
    const st = getState(chatId);
    if (!st) return;
    const cols = Array.from({ length: st.size }, (_, i) => `a${i + 1}`).concat("b").join(", ");
    bot.sendMessage(chatId, `📝 ${st.row + 1}-qatorni kiriting (${cols}):`).catch(e => console.error(e));
}

function finish(chatId, txt) {
    bot.sendMessage(chatId, txt, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: [[{ text: "🔙 Orqaga", callback_data: "back" }]] }
    }).catch(() => {
        bot.sendMessage(chatId, txt.replace(/[*_`[\]]/g, ""), {
            reply_markup: { inline_keyboard: [[{ text: "🔙 Orqaga", callback_data: "back" }]] }
        }).catch(e => console.error("finish xatosi:", e));
    });
    clearState(chatId);
}

// ─────────────────────────────────────────────
// NUMBER FORMAT
// ─────────────────────────────────────────────
function formatNumber(num) {
    if (!isFinite(num)) return "∞";
    if (Math.abs(num - Math.round(num)) < 1e-9) return Math.round(num).toString();
    return parseFloat(num.toFixed(4)).toString();
}

// ─────────────────────────────────────────────
// MATRIX PRINT
// ─────────────────────────────────────────────
function printMatrix(A, text) {
    text += "\n";
    A.forEach(r => {
        const n = r.length - 1;
        r.forEach((v, i) => {
            if (i === n) text += "| ";
            text += formatNumber(v).padStart(8) + " ";
        });
        text += "\n";
    });
    text += "\n";
    return text;
}

// ─────────────────────────────────────────────
// GAUSS — umumiy (3×3 va 4×4)
// ─────────────────────────────────────────────
function gaussSolveN(chatId) {
    const st = getState(chatId);
    if (!st) return;
    const A = JSON.parse(JSON.stringify(st.matrix));
    const n = st.size;
    let log = "📐 *Gauss usuli yechimi*\n\n";

    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) {
            if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        }
        if (maxRow !== i) {
            [A[i], A[maxRow]] = [A[maxRow], A[i]];
            log += `↕ ${i+1} va ${maxRow+1}-qatorlar almashtirildi\n`;
            log = printMatrix(A, log);
        }

        if (Math.abs(A[i][i]) < 1e-12) {
            return finish(chatId, "❌ Yechim yo'q yoki cheksiz ko'p yechim mavjud (nol pivot).");
        }

        const div = A[i][i];
        log += `➡ ${i+1}-qator ${formatNumber(div)} ga bo'lindi\n`;
        for (let j = 0; j <= n; j++) A[i][j] /= div;
        log = printMatrix(A, log);

        for (let k = i + 1; k < n; k++) {
            const mul = A[k][i];
            if (Math.abs(mul) < 1e-12) continue;
            log += `➡ ${k+1}-qator − (${formatNumber(mul)}) × ${i+1}-qator\n`;
            for (let j = 0; j <= n; j++) A[k][j] -= mul * A[i][j];
            log = printMatrix(A, log);
        }
    }

    log += "🔄 *Orqaga o'rin bosish:*\n";
    for (let i = n - 1; i >= 0; i--) {
        for (let k = i - 1; k >= 0; k--) {
            const mul = A[k][i];
            if (Math.abs(mul) < 1e-12) continue;
            for (let j = 0; j <= n; j++) A[k][j] -= mul * A[i][j];
        }
    }

    log += "\n✅ *Natija:*\n";
    for (let i = 0; i < n; i++) log += `x${i+1} = ${formatNumber(A[i][n])}\n`;
    finish(chatId, log);
}

// ─────────────────────────────────────────────
// DETERMINANT 3×3
// ─────────────────────────────────────────────
function det3(m) {
    return m[0][0] * (m[1][1]*m[2][2] - m[1][2]*m[2][1])
         - m[0][1] * (m[1][0]*m[2][2] - m[1][2]*m[2][0])
         + m[0][2] * (m[1][0]*m[2][1] - m[1][1]*m[2][0]);
}

function det3WithSteps(m) {
    const d = det3(m);
    let text = "Laplas (1-qator bo'yicha):\n";
    for (let i = 0; i < 3; i++) {
        const sub = [];
        for (let r = 1; r < 3; r++) sub.push(m[r].filter((_, c) => c !== i));
        const minor = sub[0][0]*sub[1][1] - sub[0][1]*sub[1][0];
        const sign  = i % 2 === 0 ? 1 : -1;
        const term  = sign * m[0][i] * minor;
        text += `a1${i+1} * M1${i+1} = ${formatNumber(m[0][i])} * (${formatNumber(minor)}) = ${formatNumber(term)}\n`;
    }
    text += `Determinant = ${formatNumber(d)}\n\n`;
    return { det: d, text };
}

// ─────────────────────────────────────────────
// DETERMINANT 4×4
// ─────────────────────────────────────────────
function det4WithSteps(m) {
    let d    = 0;
    let text = "Laplas (1-qator bo'yicha):\nMatritsa:\n";
    m.forEach(r => { text += r.map(formatNumber).join("  ") + "\n"; });
    text += "\n";

    for (let i = 0; i < 4; i++) {
        const sub = [];
        for (let r = 1; r < 4; r++) sub.push(m[r].filter((_, c) => c !== i));
        const minor = det3(sub);
        const sign  = i % 2 === 0 ? 1 : -1;
        const term  = sign * m[0][i] * minor;
        text += `a1${i+1} * M1${i+1} = ${formatNumber(m[0][i])} * (${formatNumber(minor)}) = ${formatNumber(term)}\n`;
        d += term;
    }
    text += `Determinant = ${formatNumber(d)}\n\n`;
    return { det: d, text };
}

// ─────────────────────────────────────────────
// CRAMER — umumiy (3×3 va 4×4)
// ─────────────────────────────────────────────
function solveCramerN(chatId, detFn) {
    const st = getState(chatId);
    if (!st) return;
    const M = st.matrix;
    const n = st.size;
    const A = M.map(r => r.slice(0, n));
    const B = M.map(r => r[n]);

    let text = "📐 *Cramer usuli (qadamlar bilan)*\n\n";
    text += "1️⃣ Asosiy determinant D:\n\n";

    const mainDet = detFn(A);
    text += mainDet.text;

    if (Math.abs(mainDet.det) < 1e-10)
        return finish(chatId, text + "❌ D = 0 → Yechim yo'q yoki cheksiz ko'p yechim mavjud.");

    for (let i = 0; i < n; i++) {
        text += `\n${i+2}️⃣ D${i+1} (ustun ${i+1} B bilan almashtiriladi):\n\n`;
        const Ai = A.map((row, r) => row.map((val, c) => c === i ? B[r] : val));

        text += "Matritsa:\n";
        Ai.forEach(r => { text += r.map(formatNumber).join("  ") + "\n"; });
        text += "\n";

        const detRes = detFn(Ai);
        text += detRes.text;

        const xi = detRes.det / mainDet.det;
        text += `x${i+1} = D${i+1} / D = ${formatNumber(detRes.det)} / ${formatNumber(mainDet.det)} = ${formatNumber(xi)}\n\n`;
    }

    finish(chatId, text);
}

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLING
// ─────────────────────────────────────────────
bot.on("polling_error", (err) => console.error("Polling xatosi:", err.code, err.message));
bot.on("error",         (err) => console.error("Bot xatosi:", err.message));
process.on("unhandledRejection", (reason) => console.error("Unhandled Rejection:", reason));
process.on("uncaughtException",  (err)    => console.error("Uncaught Exception:", err.message));

console.log("✅ Bot ishga tushdi!");