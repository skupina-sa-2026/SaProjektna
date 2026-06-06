const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/authMiddleware");

const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require("../controllers/userController");

router.get("/", auth, getUsers);
router.get("/:id", auth, getUserById);
router.put("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);

module.exports = router;
