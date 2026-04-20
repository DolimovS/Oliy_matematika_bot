const bot = require("../bot");

function gauss(chatId, A) {
    const n = A.length;

    for (let i = 0; i < n; i++) {
        let div = A[i][i];
        for (let j = 0; j <= n; j++) A[i][j] /= div;

        for (let k = i + 1; k < n; k++) {
            let mul = A[k][i];
            for (let j = 0; j <= n; j++) {
                A[k][j] -= mul * A[i][j];
            }
        }
    }

    let res = "📌 Natija:\n";
    for (let i = 0; i < n; i++) {
        res += `x${i+1} = ${A[i][n]}\n`;
    }

    bot.sendMessage(chatId, res);
}

module.exports = { gauss };