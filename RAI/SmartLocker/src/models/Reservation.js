const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema(
  {
    locker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Locker",
      required: true
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startAt: {
      type: Date,
      required: true
    },
    endAt: {
      type: Date,
      required: true
    },
    accessCode: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "finished"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Reservation", reservationSchema);
