const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.json({
    message: "Airbnb Smart Locker API deluje",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      lockers: "/api/lockers",
      reservations: "/api/reservations",
      logs: "/api/logs"
    }
  });
});

app.use("/api/auth", require("./src/routes/authRoutes"));
app.use("/api/users", require("./src/routes/userRoutes"));
app.use("/api/lockers", require("./src/routes/lockerRoutes"));
app.use("/api/reservations", require("./src/routes/reservationRoutes"));
app.use("/api/logs", require("./src/routes/accessLogRoutes"));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Streznik deluje na http://localhost:${PORT}`);
});
