const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize, connectDB } = require("./config/db");
const setupAssociations = require("./models/associations");

setupAssociations();

// Import routes
const authRoutes = require("./routes/auth.routes");
const assetRoutes = require("./routes/assets.routes");
const roleManageRoutes = require("./routes/roleManagement.routes");
const permissionRoutes = require("./routes/permission.routes");
const departmentsRoutes = require("./routes/departments.routes");

const errorHandler = require("./middlewares/errorMiddleware");

require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect DB FIRST
connectDB();

// Sync Sequelize models
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("✅ Models synced successfully");

    // Run seeder
    const { exec } = require("child_process");
    exec("node seeders/20250101000000-initial-data.js", (error, stdout) => {
      if (error) {
        console.log("⚠️ Seeder not run automatically.");
      } else {
        console.log(stdout);
      }
    });
  })
  .catch((err) => {
    console.error("❌ Sync error:", err);
  });

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/rolemanagement", roleManageRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/departments", departmentsRoutes);

// ✅ SERVE REACT BUILD (IMPORTANT)
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// Error handler (LAST)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 5005;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});