const { Router } = require("express");
const mongoose = require("mongoose");
const TrackerEntry = require("../models/TrackerEntry.model.js");
const isAuthenticated = require("../middleware/isAuthenticated.js");

const router = Router();

router.use(isAuthenticated);

function serializeEntry(entry) {
  return {
    id: entry._id.toString(),
    fishId: entry.fishId,
    caught: entry.caught,
    favorite: entry.favorite,
    notes: entry.notes,
  };
}

router.get("/", async (req, res) => {
  try {
    const entries = await TrackerEntry.find({
      user: req.auth.userId,
    });

    return res.json(entries.map(serializeEntry));
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Could not load tracker",
    });
  }
});

router.post("/", async (req, res) => {
  try {
    const fishId = Number(req.body.fishId);

    if (!Number.isInteger(fishId)) {
      return res.status(400).json({
        message: "Valid fishId required",
      });
    }

    const existing = await TrackerEntry.findOne({
      user: req.auth.userId,
      fishId,
    });

    if (existing) {
      return res.status(409).json({
        message: "Fish already tracked",
      });
    }

    const entry = await TrackerEntry.create({
      user: req.auth.userId,
      fishId,
      caught: Boolean(req.body.caught),
      favorite: Boolean(req.body.favorite),
      notes: req.body.notes || "",
    });

    return res.status(201).json(serializeEntry(entry));
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Could not add fish",
    });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tracker entry id." });
    }

    const body = req.body || {};
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, "caught")) {
      if (typeof body.caught !== "boolean") {
        return res.status(400).json({ message: "caught must be a boolean." });
      }
      updates.caught = body.caught;
    }

    if (Object.prototype.hasOwnProperty.call(body, "favorite")) {
      if (typeof body.favorite !== "boolean") {
        return res.status(400).json({ message: "favorite must be a boolean." });
      }
      updates.favorite = body.favorite;
    }

    if (Object.prototype.hasOwnProperty.call(body, "notes")) {
      if (typeof body.notes !== "string") {
        return res.status(400).json({ message: "notes must be a string." });
      }
      if (body.notes.length > 1000) {
        return res.status(400).json({
          message: "notes cannot exceed 1000 characters.",
        });
      }
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message:
          "At least one editable field is required: caught, favorite, notes.",
      });
    }

    const entry = await TrackerEntry.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.auth.userId,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!entry) {
      return res.status(404).json({
        message: "Tracker entry not found",
      });
    }

    return res.json(serializeEntry(entry));
  } catch (error) {
    return res.status(500).json({
      message: "Could not update tracker",
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid tracker entry id." });
    }

    const entry = await TrackerEntry.findOneAndDelete({
      _id: req.params.id,
      user: req.auth.userId,
    });

    if (!entry) {
      return res.status(404).json({
        message: "Tracker entry not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({
      message: "Could not delete tracker entry",
    });
  }
});

module.exports = router;
