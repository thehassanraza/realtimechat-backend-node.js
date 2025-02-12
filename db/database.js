const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');

const URI = process.env.MONGO_URL;

const connectDB = () => {
    try {
        mongoose.connect(URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.log('MongoDB connection error:', error);
    }
};

module.exports = connectDB;