const express = require("express");
const mongoose = require("mongoose");

const FishingLog = require("../models/FishingLog.model");
const isAuthenticated = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(isAuthenticated);

router.post("/", async (req, res, next) => {
  try {
    const { fishId, caughtAt, notes, favorite } = req.body;

    if (!Number.isInteger(fishId) || fishId <= 0) {
      return res.status(400).json({
        message: "fishId must be a positive integer."
      });
    }

    if (notes !== undefined && typeof notes !== "string") {
      return res.status(400).json({ message: "notes must be a string." });
    }

    if (favorite !== undefined && typeof favorite !== "boolean") {
      return res.status(400).json({ message: "favorite must be a boolean." });
    }

    if (caughtAt !== undefined && Number.isNaN(Date.parse(caughtAt))) {
      return res.status(400).json({ message: "caughtAt must be a valid date." });
    }

    const log = await FishingLog.create({
      user: req.user._id,
      fishId,
      caughtAt,
      notes,
      favorite
    });

    return res.status(201).json(log);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = {
      user: req.user._id
    };

    if (req.query.favorite === "true") {
      filter.favorite = true;
    }

    if (req.query.favorite === "false") {
      filter.favorite = false;
    }

    if (req.query.fishId !== undefined) {
      const fishId = Number(req.query.fishId);

      if (!Number.isInteger(fishId) || fishId <= 0) {
        return res.status(400).json({
          message: "fishId query must be a positive integer."
        });
      }

      filter.fishId = fishId;
    }

    const logs = await FishingLog.find(filter).sort({ caughtAt: -1, createdAt: -1 });

    return res.status(200).json(logs);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid log id." });
    }

    const log = await FishingLog.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!log) {
      return res.status(404).json({
        message: "Fishing log entry not found."
      });
    }

    return res.status(200).json(log);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid log id." });
    }

    const updates = {};

    if (req.body.caughtAt !== undefined) {
      if (Number.isNaN(Date.parse(req.body.caughtAt))) {
        return res.status(400).json({ message: "caughtAt must be a valid date." });
      }
      updates.caughtAt = req.body.caughtAt;
    }

    if (req.body.notes !== undefined) {
      if (typeof req.body.notes !== "string") {
        return res.status(400).json({ message: "notes must be a string." });
      }
      updates.notes = req.body.notes;
    }

    if (req.body.favorite !== undefined) {
      if (typeof req.body.favorite !== "boolean") {
        return res.status(400).json({ message: "favorite must be a boolean." });
      }
      updates.favorite = req.body.favorite;
    }

    const log = await FishingLog.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!log) {
      return res.status(404).json({
        message: "Fishing log entry not found."
      });
    }

    return res.status(200).json(log);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid log id." });
    }

    const log = await FishingLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!log) {
      return res.status(404).json({
        message: "Fishing log entry not found."
      });
    }

    return res.status(200).json({
      message: "Fishing log entry deleted.",
      deletedId: log._id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
