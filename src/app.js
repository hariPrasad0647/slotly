
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const hpp = require("hpp");
const morgan = require("morgan");

const env = require("./config/env");
const routes = require("./routes");
const errorMiddleware = require("./middlewares/error.middleware");
const requestContextMiddleware = require("./middlewares/requestContext.middleware");

const app = express();

/*
|--------------------------------------------------------------------------
| Security Middlewares
|--------------------------------------------------------------------------
*/

app.use(helmet());
app.use(hpp());

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: "10kb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

/*
|--------------------------------------------------------------------------
| Utilities
|--------------------------------------------------------------------------
*/

app.use(compression());
app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| Request Context
|--------------------------------------------------------------------------
*/

app.use(requestContextMiddleware);

/*
|--------------------------------------------------------------------------
| Logging
|--------------------------------------------------------------------------
*/

if (env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/

app.use("/api/v1", routes);

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message: "Route not found",
  });
});

/*
|--------------------------------------------------------------------------
| Global Error Middleware
|--------------------------------------------------------------------------
*/

app.use(errorMiddleware);

module.exports = app;

