const state = {};

function get(chatId) {
    return state[chatId] || {};
}

function set(chatId, data) {
    state[chatId] = {
        ...(state[chatId] || {}),
        retry: state[chatId]?.retry || 0,
        ...data
    };
}

function clear(chatId) {
    delete state[chatId];
}

module.exports = { state, get, set, clear };