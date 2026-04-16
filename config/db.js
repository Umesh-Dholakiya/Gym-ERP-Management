const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // These options are no longer needed in Mongoose 6+ but we add selection timeout for faster failure detection
      serverSelectionTimeoutMS: 5000, 
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Improved event handling
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB runtime error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB initial connection error:', error.message);
    // Instead of exiting immediately, we'll let the app stay alive but log the error
    // Many hosting services like Render will restart the process if it exits,
    // but sometimes a soft failure is better for debugging.
    // However, if DB is critical, we might still want to exit if it's the first attempt.
    console.warn('⚠️ Application is running without a DB connection. Please check your MONGO_URI.');
  }
};

module.exports = connectDB;