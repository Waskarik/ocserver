const mongoose = require("mongoose");

const trackerEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    fishId: {
      type: Number,
      required: true,
    },

    caught: {
      type: Boolean,
      default: false,
    },

    favorite: {
      type: Boolean,
      default: false,
    },

    notes: {
      type: String,
      default: "",
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

trackerEntrySchema.index(
  { user: 1, fishId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "TrackerEntry",
  trackerEntrySchema
);