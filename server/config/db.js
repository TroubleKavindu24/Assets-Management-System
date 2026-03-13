const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "assetallocationsystem",
  "root",
  "24112000@Kk",
  {
    host: "localhost",
    dialect: "mysql",
    logging: false,
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");
  } catch (error) {
    console.error("❌ DB connection error:", error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  connectDB,
};