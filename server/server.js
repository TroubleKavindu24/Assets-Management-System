const express = require("express");
const cors = require("cors");
const { sequelize, connectDB } = require("./config/db");
const setupAssociations = require("./models/associations");

// Setup associations BEFORE anything else
setupAssociations();

// Import routes
const authRoutes = require("./routes/auth.routes");
const assetRoutes = require("./routes/assets.routes");
const roleManageRoutes = require("./routes/roleManagement.routes");
const permissionRoutes = require("./routes/permission.routes");
const departmentsRoutes = require("./routes/departments.routes");

const errorHandler = require("./middlewares/errorMiddleware");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

require('dotenv').config();

// Connect DB FIRST
connectDB();

// Sync Sequelize models - Using force: true for clean slate
sequelize
  .sync({ force: true })  // This will drop and recreate all tables
  .then(() => {
    console.log("✅ Models synced successfully");
    console.log("All tables created successfully");
  })
  .catch((err) => {
    console.error("❌ Sync error:", err);
    console.error("Error details:", err.message);
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/rolemanagement", roleManageRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/departments", departmentsRoutes);

// Error handler (LAST)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});