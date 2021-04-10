const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const compression = require("compression");

const userRouter = require("./routes/userRoutes");
const app = express();

// Set security HTTP headers
app.use(helmet());
//Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

//compress app
app.use(compression());

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
