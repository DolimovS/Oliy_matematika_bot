const mongoose = require("mongoose");
const { MONGO_URL } = require("./config");

async function connectDB() {
    console.log("DEBUG MONGO_URL:", MONGO_URL);

    if (!MONGO_URL || !MONGO_URL.startsWith("mongodb")) {
        throw new Error("❌ MONGO_URL noto‘g‘ri yoki yo‘q");
    }

    await mongoose.connect(MONGO_URL.trim());
    console.log("✅ MongoDB ulandi");
}

module.exports = connectDB;