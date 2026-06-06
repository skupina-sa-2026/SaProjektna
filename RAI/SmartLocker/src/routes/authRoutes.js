const express = require("express");
const router = express.Router();

const {
  register,
  login,
  faceLoginPlaceholder
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/face-login", faceLoginPlaceholder);

module.exports = router;
