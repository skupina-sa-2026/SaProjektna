const express = require("express");
const router = express.Router();

const { auth, optionalAuth } = require("../middleware/authMiddleware");

const {
  getLockers,
  getLockerById,
  createLocker,
  updateLocker,
  deleteLocker,
  unlockLocker,
  lockLocker
} = require("../controllers/lockerController");

router.get("/", auth, getLockers);
router.get("/:id", auth, getLockerById);
router.post("/", auth, createLocker);
router.put("/:id", auth, updateLocker);
router.delete("/:id", auth, deleteLocker);
router.post("/:id/unlock", optionalAuth, unlockLocker);
router.post("/:id/lock", auth, lockLocker);

module.exports = router;
