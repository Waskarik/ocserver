function validateEnvironment() {
  const missing = [];

  if (!process.env.MONGODB_URI) missing.push("MONGODB_URI");
  if (!process.env.TOKEN_SECRET) missing.push("TOKEN_SECRET");

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.TOKEN_SECRET.length < 32) {
    throw new Error("TOKEN_SECRET must contain at least 32 characters.");
  }
}

module.exports = validateEnvironment;
