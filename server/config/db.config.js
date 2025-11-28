const mongoose = require('mongoose');
const debug = require('debug')('app:db');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log("mongodb connected")
        debug(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        debug(`Error: ${error.message}`);
        console.log("error in db.config.js");
        // Exit process with failure
        process.exit(1); 
    }
};

module.exports = connectDB;