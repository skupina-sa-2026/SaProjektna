const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema(
  {
    locker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Locker",
      required: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      default: null
    },
    action: {
      type: String,
      enum: ["unlock", "lock", "login"],
      required: true
    },
    result: {
      type: String,
      enum: ["success", "denied"],
      required: true
    },
    message: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("AccessLog", accessLogSchema);
