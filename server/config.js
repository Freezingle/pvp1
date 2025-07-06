require('dotenv').config();
const mongoose = require('mongoose');
const dbUri = process.env.DB_URI; // This gets the value from .env

const connect = mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });

// creating a schema for user
const LoginSchema = new mongoose.Schema({
    name: { type: String, required: true },
    password: { type: String, required: true },
    isLoggedIn: { type: Boolean, default: false },
    tokens: { type: Number, default: 0 },
    xpLevel: { type: Number, default: 1 },
    gamesPlayed: { type: Number, default: 0 },
    wins: { type: Number, default: 0 }
});

// creating a collection model for user
const collection = mongoose.model("users", LoginSchema);

connect.then(async () => {
    console.log("Connected to MongoDB");
    const result = await collection.updateMany({}, { $set: { isLoggedIn: false } });
    console.log("All users set to not logged in");
}).catch((err) => {
    console.log("Error connecting to MongoDB:", err);
});

module.exports = collection;