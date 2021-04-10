const express = require("express");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");
const cors = require("cors");

const userRouter = require("./routes/userRoutes");
const app = express();

// Set security HTTP headers
app.use(helmet());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

//compress app
app.use(compression());

//Define CORS options
const corsOptions = {
  origin: "https://petrau.netlify.app",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

//CORS enable
app.use(cors(corsOptions));
// 3) ROUTES
// app.use('/', viewRouter);
app.use("/api", userRouter);

app.all("*", (req, res, next) => {
  res.json({
    status: "fail",
    error: `Can't find ${req.originalUrl} on this server!`,
  });
});

module.exports = app;
