const mongoose = require("mongoose");

const fishingLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fishId: {
      type: Number,
      required: [true, "fishId is required."],
      min: [1, "fishId must be a positive number."],
      validate: {
        validator(value) {
          return Number.isInteger(value);
        },
        message: "fishId must be an integer."
      }
    },
    caughtAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters."],
      default: ""
    },
    favorite: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

fishingLogSchema.index(
  { user: 1, fishId: 1 },
  { unique: true }
);

module.exports = mongoose.model("FishingLog", fishingLogSchema);
