const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function getUsers(req, res) {
  try {
    const users = await User.find().select("-passwordHash");
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju uporabnikov", error: error.message });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Uporabnik ne obstaja" });
    }

    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri branju uporabnika", error: error.message });
  }
}

async function updateUser(req, res) {
  try {
    const { name, email, password, role, faceImageUrl } = req.body;

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (faceImageUrl !== undefined) updateData.faceImageUrl = faceImageUrl;

    if (password !== undefined && password.length > 0) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ message: "Uporabnik ne obstaja" });
    }

    return res.json({
      message: "Uporabnik posodobljen",
      user
    });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri posodabljanju uporabnika", error: error.message });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Uporabnik ne obstaja" });
    }

    return res.json({ message: "Uporabnik izbrisan" });
  } catch (error) {
    return res.status(500).json({ message: "Napaka pri brisanju uporabnika", error: error.message });
  }
}

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser
};
