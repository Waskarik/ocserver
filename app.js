const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");
const trackerRoutes = require("./routes/tracker.routes");


const authRoutes = require("./routes/auth.routes");
const usersRoutes = require("./routes/users.routes");
const logsRoutes = require("./routes/logs.routes");
const listsRoutes = require("./routes/lists.routes");
const {
  notFoundHandler,
  errorHandler
} = require("./middleware/errorHandler");

const app = express();

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");
app.use(helmet());

const allowedOrigins = (process.env.ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Origin not allowed by CORS.");
      error.status = 403;
      return callback(error);
    }
  })
);

app.use(express.json({ limit: "256kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api", (req, res) => {
  return res.status(200).json({
    message: "BadFish API is swimming 🐟",
    status: "ok"
  });
});

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/logs", logsRoutes);
app.use("/api/lists", listsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
