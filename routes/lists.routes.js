const express = require("express");
const mongoose = require("mongoose");

const FishingList = require("../models/FishingList.model");
const isAuthenticated = require("../middleware/isAuthenticated");

const router = express.Router();

router.use(isAuthenticated);

function normalizeFishIds(values) {
  if (!Array.isArray(values)) {
    return null;
  }

  const normalized = [...new Set(values.map(Number))];

  if (!normalized.every((value) => Number.isInteger(value) && value > 0)) {
    return null;
  }

  return normalized;
}

router.post("/", async (req, res, next) => {
  try {
    const { name, description = "", fishIds = [] } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        message: "List name is required."
      });
    }

    if (typeof description !== "string") {
      return res.status(400).json({ message: "description must be a string." });
    }

    const normalizedFishIds = normalizeFishIds(fishIds);

    if (normalizedFishIds === null) {
      return res.status(400).json({
        message: "fishIds must be an array of positive integers."
      });
    }

    const list = await FishingList.create({
      user: req.user._id,
      name: String(name).trim(),
      description,
      fishIds: normalizedFishIds
    });

    return res.status(201).json(list);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const lists = await FishingList.find({
      user: req.user._id
    }).sort({ updatedAt: -1 });

    return res.status(200).json(lists);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid list id." });
    }

    const list = await FishingList.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!list) {
      return res.status(404).json({
        message: "Fishing list not found."
      });
    }

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid list id." });
    }

    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== "string") {
        return res.status(400).json({ message: "List name must be a string." });
      }

      const name = req.body.name.trim();

      if (!name) {
        return res.status(400).json({ message: "List name cannot be empty." });
      }

      updates.name = name;
    }

    if (req.body.description !== undefined) {
      if (typeof req.body.description !== "string") {
        return res.status(400).json({ message: "description must be a string." });
      }
      updates.description = req.body.description;
    }

    if (req.body.fishIds !== undefined) {
      const normalizedFishIds = normalizeFishIds(req.body.fishIds);

      if (normalizedFishIds === null) {
        return res.status(400).json({
          message: "fishIds must be an array of positive integers."
        });
      }

      updates.fishIds = normalizedFishIds;
    }

    const list = await FishingList.findOneAndUpdate(
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

    if (!list) {
      return res.status(404).json({
        message: "Fishing list not found."
      });
    }

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/fish/:fishId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid list id." });
    }

    const fishId = Number(req.params.fishId);

    if (!Number.isInteger(fishId) || fishId <= 0) {
      return res.status(400).json({
        message: "fishId must be a positive integer."
      });
    }

    const list = await FishingList.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        $addToSet: { fishIds: fishId }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!list) {
      return res.status(404).json({
        message: "Fishing list not found."
      });
    }

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/fish/:fishId", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid list id." });
    }

    const fishId = Number(req.params.fishId);

    if (!Number.isInteger(fishId) || fishId <= 0) {
      return res.status(400).json({
        message: "fishId must be a positive integer."
      });
    }

    const list = await FishingList.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id
      },
      {
        $pull: { fishIds: fishId }
      },
      {
        new: true
      }
    );

    if (!list) {
      return res.status(404).json({
        message: "Fishing list not found."
      });
    }

    return res.status(200).json(list);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid list id." });
    }

    const list = await FishingList.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });

    if (!list) {
      return res.status(404).json({
        message: "Fishing list not found."
      });
    }

    return res.status(200).json({
      message: "Fishing list deleted.",
      deletedId: list._id
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
