const mongoose = require("mongoose");

let connectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is missing from the environment variables.");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(uri).finally(() => {
      connectionPromise = null;
    });
  }

  await connectionPromise;
  return mongoose.connection;
}

module.exports = connectDB;
