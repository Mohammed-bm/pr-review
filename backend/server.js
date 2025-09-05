  const express = require("express");
  const dotenv = require("dotenv");
  const connectDB = require("./config/db");
  const authRoutes = require("./routes/authRoutes");
  const webhookRoutes = require("./routes/webhookRoutes");
  const prRoutes = require("./routes/prRoutes");
  const { errorHandler } = require("./middleware/errorMiddleware");
  const { protect } = require("./middleware/authMiddleware"); // ⬅ import middleware

  dotenv.config();
  connectDB();
require('dotenv').config();

  const app = express();
  app.use(express.json()); // parse JSON requests

  // Routes
  app.use("/api/auth", authRoutes);

  app.use("/api/prs", prRoutes);

  app.use("/webhooks", webhookRoutes);

  // ✅ Protected test route
  app.get("/api/private", protect, (req, res) => {
    res.json({ msg: "You accessed a protected route!", user: req.user });
  });

  // Public test route
  app.get("/", (req, res) => {
    res.send("API is running...");
  });

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

  app.use(errorHandler);