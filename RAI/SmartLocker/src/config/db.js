const mongoose = require("mongoose");

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      throw new Error("MONGO_URI ni nastavljen v .env datoteki");
    }

    await mongoose.connect(uri);
    console.log("Povezava z MongoDB je uspela");
  } catch (error) {
    console.error("Napaka pri povezavi z MongoDB:", error.message);
    process.exit(1);
  }
}

module.exports = connectDB;
