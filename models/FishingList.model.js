const mongoose = require("mongoose");

const fishingListSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: [true, "List name is required."],
      trim: true,
      minlength: [1, "List name cannot be empty."],
      maxlength: [60, "List name cannot exceed 60 characters."]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, "Description cannot exceed 300 characters."],
      default: ""
    },
    fishIds: {
      type: [Number],
      default: [],
      validate: {
        validator(values) {
          return values.every((value) => Number.isInteger(value) && value > 0);
        },
        message: "Every fishId must be a positive integer."
      }
    }
  },
  {
    timestamps: true
  }
);

fishingListSchema.index(
  { user: 1, name: 1 },
  { unique: true }
);

module.exports = mongoose.model("FishingList", fishingListSchema);
