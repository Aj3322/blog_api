const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

try {
    const envPath = path.resolve(__dirname, '../config.env');
    dotenv.config({ path: envPath });
} catch (err) {
    console.log('Error loading .env file:', err);
}

const DB = process.env.DATABASE_LOCAL||'mongodb://0.0.0.0:27017/ajtours';

mongoose.connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
}).then(() => {
    console.log("Database Connected Successfully!");
}).catch(err => {
    console.error("Database connection failed:", err);
});
