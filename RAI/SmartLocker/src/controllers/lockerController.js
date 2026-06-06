const Locker = require("../models/Locker");
const Reservation = require("../models/Reservation");
const AccessLog = require("../models/AccessLog");

const LIMITS = {
  name: 80,
  location: 160,
  description: 500,
  unitNumber: 20,
  floorMin: -3,
  floorMax: 60
};

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseFloor(value) {
  if (value === undefined || value === null || value === "") return null;
  const floor = Number(value);
  if (!Number.isInteger(floor) || floor < LIMITS.floorMin || floor > LIMITS.floorMax) {
    return undefined;
  }
  return floor;
}

function validateLockerInput({ name, location, description, unitNumber, floor }) {
  if (!name || !location) return "Naziv in lokacija sta obvezna";
  if (name.length > LIMITS.name) return `Naziv je lahko dolg največ ${LIMITS.name} znakov`;
  if (location.length > LIMITS.location) return `Lokacija je lahko dolga največ ${LIMITS.location} znakov`;
  if (description.length > LIMITS.description) return `Navodila so lahko dolga največ ${LIMITS.description} znakov`;
  if (unitNumber && unitNumber.length > LIMITS.unitNumber) return `Oznaka enote je lahko dolga največ ${LIMITS.unitNumber} znakov`;
  if (floor === undefined) return `Nadstropje mora biti med ${LIMITS.floorMin} in ${LIMITS.floorMax}`;
  return null;
}

async function getLockers(req, res) {
  try {
    const lockers = await Locker.find().populate("owner", "name email role");
    return res.json(lockers);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju paketnikov", error: error.message });
  }
}

async function getLockerById(req, res) {
  try {
    const locker = await Locker.findById(req.params.id).populate("owner", "name email role");
    if (!locker) return res.status(404).json({ message: "Paketnik ne obstaja" });
    return res.json(locker);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju paketnika", error: error.message });
  }
}

async function createLocker(req, res) {
  try {
    if (req.user.role !== "host") {
      return res.status(403).json({ message: "Samo host lahko doda paketnik" });
    }

    const name = cleanString(req.body.name);
    const location = cleanString(req.body.location);
    const description = cleanString(req.body.description);
    const unitNumber = cleanString(req.body.unitNumber) || null;
    const floor = parseFloor(req.body.floor);

    const validationError = validateLockerInput({
      name,
      location,
      description,
      unitNumber,
      floor
    });
    if (validationError) return res.status(400).json({ message: validationError });

    const locker = await Locker.create({
      name,
      location,
      description,
      unitNumber,
      floor,
      totalCompartments: 1,
      owner: req.user.id
    });

    return res.status(201).json({ message: "Paketnik ustvarjen", locker });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri ustvarjanju paketnika", error: error.message });
  }
}

async function updateLocker(req, res) {
  try {
    const locker = await Locker.findById(req.params.id);
    if (!locker) return res.status(404).json({ message: "Paketnik ne obstaja" });
    if (locker.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Lahko urejaš samo svoje paketnike" });
    }

    const { name, location, description, status, unitNumber, floor } = req.body;
    const next = {
      name: name !== undefined ? cleanString(name) : locker.name,
      location: location !== undefined ? cleanString(location) : locker.location,
      description: description !== undefined ? cleanString(description) : locker.description || "",
      unitNumber: unitNumber !== undefined ? cleanString(unitNumber) || null : locker.unitNumber,
      floor: floor !== undefined ? parseFloor(floor) : locker.floor
    };

    const validationError = validateLockerInput(next);
    if (validationError) return res.status(400).json({ message: validationError });

    if (name !== undefined) locker.name = next.name;
    if (location !== undefined) locker.location = next.location;
    if (description !== undefined) locker.description = next.description;
    if (status !== undefined) locker.status = status;
    if (unitNumber !== undefined) locker.unitNumber = next.unitNumber;
    if (floor !== undefined) locker.floor = next.floor;
    locker.totalCompartments = 1;

    await locker.save();
    return res.json({ message: "Paketnik posodobljen", locker });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri posodabljanju paketnika", error: error.message });
  }
}

async function deleteLocker(req, res) {
  try {
    const locker = await Locker.findById(req.params.id);
    if (!locker) return res.status(404).json({ message: "Paketnik ne obstaja" });
    if (locker.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Lahko izbrišeš samo svoje paketnike" });
    }

    // Cancel all active reservations for this locker before deleting
    await Reservation.updateMany(
      { locker: locker._id, status: "active" },
      { status: "cancelled" }
    );

    // Delete all reservations that have no more purpose (cancelled/finished)
    await Reservation.deleteMany({
      locker: locker._id,
      status: { $in: ["cancelled", "finished"] }
    });

    // Delete access logs for this locker
    await AccessLog.deleteMany({ locker: locker._id });

    await Locker.findByIdAndDelete(req.params.id);

    return res.json({ message: "Paketnik in vse vezane rezervacije so bili izbrisani" });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri brisanju paketnika", error: error.message });
  }
}

async function unlockLocker(req, res) {
  try {
    const lockerId = req.params.id;
    const { accessCode } = req.body;

    const locker = await Locker.findById(lockerId);
    if (!locker) return res.status(404).json({ message: "Paketnik ne obstaja" });

    if (locker.status === "inactive") {
      await AccessLog.create({
        locker: locker._id,
        user: req.user ? req.user.id : null,
        action: "unlock",
        result: "denied",
        message: "Paketnik je neaktiven"
      });
      return res.status(403).json({ message: "Paketnik je neaktiven" });
    }

    const now = new Date();
    let reservationQuery = {
      locker: locker._id,
      status: "active",
      startAt: { $lte: now },
      endAt: { $gte: now }
    };

    if (accessCode) {
      reservationQuery.accessCode = accessCode;
    } else if (req.user && req.user.role === "guest") {
      reservationQuery.guest = req.user.id;
    } else if (req.user && req.user.role === "host" && locker.owner.toString() === req.user.id) {
      locker.status = "unlocked";
      locker.totalCompartments = 1;
      await locker.save();
      await AccessLog.create({
        locker: locker._id,
        user: req.user.id,
        action: "unlock",
        result: "success",
        message: "Host je odklenil paketnik"
      });
      return res.json({
        message: "Paketnik odklenjen kot host",
        locker
      });
    } else {
      await AccessLog.create({
        locker: locker._id,
        user: req.user ? req.user.id : null,
        action: "unlock",
        result: "denied",
        message: "Manjka dostopna koda ali veljaven uporabnik"
      });
      return res.status(403).json({ message: "Manjka dostopna koda ali veljaven uporabnik" });
    }

    const reservation = await Reservation.findOne(reservationQuery);
    if (!reservation) {
      await AccessLog.create({
        locker: locker._id,
        user: req.user ? req.user.id : null,
        action: "unlock",
        result: "denied",
        message: "Ni aktivne rezervacije ali je koda napačna"
      });
      return res.status(403).json({ message: "Dostop zavrnjen. Rezervacija ni aktivna ali je koda napačna." });
    }

    locker.status = "unlocked";
    locker.totalCompartments = 1;
    await locker.save();

    await AccessLog.create({
      locker: locker._id,
      user: req.user ? req.user.id : reservation.guest,
      reservation: reservation._id,
      action: "unlock",
      result: "success",
      message: "Paketnik uspešno odklenjen"
    });

    return res.json({
      message: "Paketnik odklenjen",
      locker,
      reservation
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri odklepanju", error: error.message });
  }
}

async function lockLocker(req, res) {
  try {
    const locker = await Locker.findById(req.params.id);
    if (!locker) return res.status(404).json({ message: "Paketnik ne obstaja" });
    if (!req.user || locker.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Zaklene lahko samo lastnik paketnika" });
    }

    locker.status = "locked";
    locker.totalCompartments = 1;
    await locker.save();

    await AccessLog.create({
      locker: locker._id,
      user: req.user.id,
      action: "lock",
      result: "success",
      message: "Host je zaklenil paketnik"
    });

    return res.json({ message: "Paketnik zaklenjen", locker });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri zaklepanju", error: error.message });
  }
}

module.exports = {
  getLockers,
  getLockerById,
  createLocker,
  updateLocker,
  deleteLocker,
  unlockLocker,
  lockLocker
};
