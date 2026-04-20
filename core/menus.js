const mainMenu = {
    inline_keyboard: [
        [{ text: "3×3", callback_data: "size_3" }],
        [{ text: "4×4", callback_data: "size_4" }]
    ]
};

const methodMenu = {
    inline_keyboard: [
        [{ text: "Gauss", callback_data: "gauss" }],
        [{ text: "Cramer", callback_data: "cramer" }],
        [{ text: "🔙 Back", callback_data: "back" }]
    ]
};

module.exports = { mainMenu, methodMenu };