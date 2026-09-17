const express = require("express");
const bcrypt = require("bcryptjs");

const User = require("../models/User.model");
const FishingLog = require("../models/FishingLog.model");
const FishingList = require("../models/FishingList.model");
const TrackerEntry = require("../models/TrackerEntry.model.js");
const isAuthenticated = require("../middleware/isAuthenticated");

const router = express.Router();

function publicUser(user) {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

router.use(isAuthenticated);
router.use((req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.get("/me", (req, res) => {
  return res.status(200).json({
    user: publicUser(req.user)
  });
});

router.patch("/me", async (req, res, next) => {
  try {
    const { username, email } = req.body;
    const updates = {};

    if (username !== undefined) {
      if (typeof username !== "string") {
        return res.status(400).json({ message: "Username must be a string." });
      }

      const normalizedUsername = username.trim();

      if (normalizedUsername.length < 2 || normalizedUsername.length > 30) {
        return res.status(400).json({
          message: "Username must have between 2 and 30 characters."
        });
      }

      updates.username = normalizedUsername;
    }

    if (email !== undefined) {
      if (typeof email !== "string") {
        return res.status(400).json({ message: "Email must be a string." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({
          message: "Email format is invalid."
        });
      }

      updates.email = normalizedEmail;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      user: publicUser(user)
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return res.status(400).json({
        message: "currentPassword and newPassword must be strings."
      });
    }

    const passwordBytes = Buffer.byteLength(newPassword, "utf8");

    if (!currentPassword || passwordBytes < 8 || passwordBytes > 72) {
      return res.status(400).json({
        message: "New password must be between 8 and 72 UTF-8 bytes."
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Current password is incorrect."
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.tokenVersion += 1;
    await user.save();

    return res.status(200).json({
      message: "Password updated. Please log in again."
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/me", async (req, res, next) => {
  try {
    const { password } = req.body;

    if (typeof password !== "string" || !password) {
      return res.status(400).json({
        message: "Password confirmation is required to delete the account."
      });
    }

    const user = await User.findById(req.user._id).select("+passwordHash");
    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Password confirmation is incorrect."
      });
    }

    const userId = req.user._id;

    await Promise.all([
      FishingLog.deleteMany({ user: userId }),
      FishingList.deleteMany({ user: userId }),
      TrackerEntry.deleteMany({ user: userId })
    ]);

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: "Account and associated BadFish data deleted."
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
