process.on("uncaughtException", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to uncaught Exception Error");
  process.exit(1);
});

const app = require("./app");
const dotenv = require("dotenv");
const path = require("path");
const connectDatabase = require("./config/database");

dotenv.config({ path: path.join(__dirname, "config/config.env") });

connectDatabase();

const server = app.listen(process.env.PORT, () => {
  console.log(
    `My Server is listening on port ${process.env.PORT} in ${process.env.NODE_ENV}`
  );
});

// Handle Unhandled Promise Rejections;

// This will catch any unhandled promise rejections in the application
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  console.log("Shutting down the server due to unhandled Rejection");
  server.close(() => {
    process.exit(1);
  });
});
