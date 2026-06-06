const mongoose = require("mongoose");

const lockerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      default: "",
      maxlength: 500
    },
    // New fields for physical identification
    unitNumber: {
      type: String,
      default: null,
      trim: true,
      maxlength: 20
    },
    floor: {
      type: Number,
      default: null,
      min: -3,
      max: 60
    },
    totalCompartments: {
      type: Number,
      default: 1,
      min: 1,
      max: 1
    },
    status: {
      type: String,
      enum: ["locked", "unlocked", "inactive"],
      default: "locked"
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Locker", lockerSchema);
