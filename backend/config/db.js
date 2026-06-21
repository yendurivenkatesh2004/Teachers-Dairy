const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // process.env.MONGO_URI pulls the connection string from your .env file
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Database Connection Error: ${error.message}`);
        // Exit the Node process with a failure code (1) if the connection fails
        process.exit(1); 
    }
};

module.exports = connectDB;