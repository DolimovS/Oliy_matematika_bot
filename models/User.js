const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    chatId: { type: String, unique: true },
    firstName: String,
    username: String,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);