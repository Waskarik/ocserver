require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const validateEnvironment = require("./config/env");

const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    validateEnvironment();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`BadFish server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start BadFish server:");
    console.error(error.message);
    process.exit(1);
  }
}

startServer();
