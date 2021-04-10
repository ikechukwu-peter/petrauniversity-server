const mongoose = require("mongoose");
const dotenv = require("dotenv");

//Handle uncaughtExceptions
process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! Server shutting down...");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

//The location of config.env files
dotenv.config({ path: "./config.env" });

//initializing app
const app = require("./app");

//storing Database into a container
const DB = process.env.DATABASE;

//Connecting to mongoose
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log("DB connection successful!"));

//Setting port
const port = process.env.PORT || 5000;

//Listening for request
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//Handling unhandled rejection
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! Server shutting down...");
  console.log(err.name, err.message, err.stack);
  server.close(() => {
    process.exit(1);
  });
});
