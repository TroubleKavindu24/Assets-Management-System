const express = require("express");
const cors = require("cors");
const { sequelize, connectDB } = require("./config/db");
const authRoutes = require("./routes/auth.routes");
const assetRoutes = require("./routes/assets.routes");

const errorHandler = require("./middlewares/errorMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB FIRST
connectDB();

// Sync Sequelize models
sequelize
  .sync({ alter: true })
  .then(() => console.log("✅ Models synced"))
  .catch((err) => console.error("❌ Sync error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// Error handler (LAST)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});