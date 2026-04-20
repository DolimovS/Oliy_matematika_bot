require("dotenv").config();

module.exports = {
    TOKEN:process.env.TOKEN,
    ADMIN_ID:process.env.ADMIN_ID,
    MONGO_URL:process.env.MONGO_URI
};