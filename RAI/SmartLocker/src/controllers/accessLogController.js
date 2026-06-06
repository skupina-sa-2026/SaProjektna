const AccessLog = require("../models/AccessLog");
const Locker = require("../models/Locker");

async function getLogs(req, res) {
  try {
    let filter = {};

    if (req.user.role === "host") {
      const myLockers = await Locker.find({ owner: req.user.id }).select("_id");
      filter.locker = { $in: myLockers.map(locker => locker._id) };
    }

    if (req.user.role === "guest") {
      filter.user = req.user.id;
    }

    const logs = await AccessLog.find(filter)
      .populate("locker", "name location")
      .populate("user", "name email role")
      .populate("reservation")
      .sort({ createdAt: -1 });

    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju logov", error: error.message });
  }
}

module.exports = {
  getLogs
};
