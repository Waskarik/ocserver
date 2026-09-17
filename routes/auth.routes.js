const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { rateLimit } = require("express-rate-limit");

const User = require("../models/User.model");
const isAuthenticated = require("../middleware/isAuthenticated");

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many authentication attempts. Please try again later."
  }
});

router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function validateCredentials(username, email, password) {
  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return "Username, email and password must be strings.";
  }

  if (!username.trim() || !email.trim() || !password) {
    return "Username, email and password are required.";
  }

  const passwordBytes = Buffer.byteLength(password, "utf8");

  if (passwordBytes < 8 || passwordBytes > 72) {
    return "Password must be between 8 and 72 UTF-8 bytes.";
  }

  return null;
}

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      tokenVersion: user.tokenVersion
    },
    process.env.TOKEN_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "7d",
      issuer: "badfish-api",
      audience: "badfish-client"
    }
  );
}

router.post("/signup", authLimiter, async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const validationError = validateCredentials(username, email, password);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with that email or username already exists."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash
    });

    const authToken = createToken(user);

    return res.status(201).json({
      authToken,
      token: authToken,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({
        message: "Email and password must be strings."
      });
    }

    if (!email.trim() || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const authToken = createToken(user);

    return res.status(200).json({
      authToken,
      token: authToken,
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify", isAuthenticated, (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user)
  });
});

router.post("/logout", isAuthenticated, async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { tokenVersion: 1 }
    });

    return res.status(200).json({
      message: "Logged out. Existing tokens have been revoked."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
