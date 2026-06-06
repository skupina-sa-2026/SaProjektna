const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h"
    }
  );
}

async function register(req, res) {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const { role, faceImageUrl } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Ime, email in geslo so obvezni" });
    }

    if (name.length > 80) {
      return res.status(400).json({ message: "Ime je lahko dolgo največ 80 znakov" });
    }

    if (email.length > 120) {
      return res.status(400).json({ message: "Email je lahko dolg največ 120 znakov" });
    }

    if (password.length < 6 || password.length > 72) {
      return res.status(400).json({ message: "Geslo mora imeti med 6 in 72 znakov" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({ message: "Uporabnik s tem emailom že obstaja" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "guest",
      faceImageUrl: faceImageUrl || null
    });

    return res.status(201).json({
      message: "Registracija uspešna",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        faceImageUrl: user.faceImageUrl
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri registraciji", error: error.message });
  }
}

async function login(req, res) {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email in geslo sta obvezna" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Napačen email ali geslo" });
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      return res.status(401).json({ message: "Napačen email ali geslo" });
    }

    const token = createToken(user);

    return res.json({
      message: "Prijava uspešna",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri prijavi", error: error.message });
  }
}

async function faceLoginPlaceholder(req, res) {
  return res.status(501).json({
    message: "Prijava s sliko je predvidena, vendar v tej verziji še ni implementirana. Uporabljena je prijava z geslom."
  });
}

module.exports = {
  register,
  login,
  faceLoginPlaceholder
};
