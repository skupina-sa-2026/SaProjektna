const Reservation = require("../models/Reservation");
const Locker = require("../models/Locker");
const User = require("../models/User");
const mongoose = require("mongoose");

const MAX_RESERVATION_DAYS = 90;
const MAX_START_DAYS_AHEAD = 365;

function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function parseReservationDates(startAt, endAt) {
  const start = new Date(startAt);
  const end = new Date(endAt);
  const now = new Date();
  const maxStart = new Date(now.getTime() + MAX_START_DAYS_AHEAD * 24 * 60 * 60 * 1000);
  const maxEnd = new Date(start.getTime() + MAX_RESERVATION_DAYS * 24 * 60 * 60 * 1000);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { error: "Datum rezervacije ni veljaven" };
  }

  if (end <= start) {
    return { error: "Konec mora biti po začetku" };
  }

  if (start > maxStart) {
    return { error: `Začetek je lahko največ ${MAX_START_DAYS_AHEAD} dni vnaprej` };
  }

  if (end > maxEnd) {
    return { error: `Rezervacija je lahko dolga največ ${MAX_RESERVATION_DAYS} dni` };
  }

  return { start, end };
}

async function getReservations(req, res) {
  try {
    let filter = {};

    if (req.user.role === "host") {
      filter.host = req.user.id;
    }

    if (req.user.role === "guest") {
      filter.guest = req.user.id;
    }

    const reservations = await Reservation.find(filter)
      .populate("locker", "name location status unitNumber floor description")
      .populate("host", "name email")
      .populate("guest", "name email");

    return res.json(reservations);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju rezervacij", error: error.message });
  }
}

async function getReservationById(req, res) {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate("locker", "name location status unitNumber floor description")
      .populate("host", "name email")
      .populate("guest", "name email");

    if (!reservation) {
      return res.status(404).json({ message: "Rezervacija ne obstaja" });
    }

    return res.json(reservation);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju rezervacije", error: error.message });
  }
}

async function createReservation(req, res) {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Samo host lahko ustvari rezervacijo" });
    }

    const { lockerId, guestId, startAt, endAt } = req.body;

    if (!lockerId || !guestId || !startAt || !endAt) {
      return res.status(400).json({ message: "lockerId, guestId, startAt in endAt so obvezni" });
    }

    if (!mongoose.isValidObjectId(lockerId) || !mongoose.isValidObjectId(guestId)) {
      return res.status(400).json({ message: "Izbran paketnik ali gost ni veljaven" });
    }

    const dateResult = parseReservationDates(startAt, endAt);
    if (dateResult.error) return res.status(400).json({ message: dateResult.error });

    const locker = await Locker.findById(lockerId);

    if (!locker) {
      return res.status(404).json({ message: "Paketnik ne obstaja" });
    }

    if (locker.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Rezervacijo lahko narediš samo za svoj paketnik" });
    }

    const guest = await User.findOne({ _id: guestId, role: "guest" });
    if (!guest) {
      return res.status(404).json({ message: "Izbrani gost ne obstaja" });
    }

    const reservation = await Reservation.create({
      locker: lockerId,
      host: req.user.id,
      guest: guestId,
      startAt: dateResult.start,
      endAt: dateResult.end,
      accessCode: generateAccessCode()
    });

    return res.status(201).json({
      message: "Rezervacija ustvarjena",
      reservation
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri ustvarjanju rezervacije", error: error.message });
  }
}

async function updateReservation(req, res) {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Rezervacija ne obstaja" });
    }

    if (reservation.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Ureja lahko samo host rezervacije" });
    }

    const { startAt, endAt, status } = req.body;

    if (startAt !== undefined || endAt !== undefined) {
      const dateResult = parseReservationDates(
        startAt !== undefined ? startAt : reservation.startAt,
        endAt !== undefined ? endAt : reservation.endAt
      );
      if (dateResult.error) return res.status(400).json({ message: dateResult.error });
      reservation.startAt = dateResult.start;
      reservation.endAt = dateResult.end;
    }
    if (status !== undefined) reservation.status = status;

    await reservation.save();

    return res.json({
      message: "Rezervacija posodobljena",
      reservation
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri posodabljanju rezervacije", error: error.message });
  }
}

async function deleteReservation(req, res) {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Rezervacija ne obstaja" });
    }

    if (reservation.host.toString() !== req.user.id) {
      return res.status(403).json({ message: "Izbriše lahko samo host rezervacije" });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    return res.json({ message: "Rezervacija izbrisana" });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri brisanju rezervacije", error: error.message });
  }
}

module.exports = {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation
};
