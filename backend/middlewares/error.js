const ErrorHandler = require("../utils/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Handle Mongoose CastError
  if (err.name === "CastError") {
    const message = `Product not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Handle Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((value) => value.message)
      .join(", ");
    err = new ErrorHandler(message, 400);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode).json({
      success: false,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }

  if (process.env.NODE_ENV === "production") {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
    });
  }

  if (err.name === "JsonWebTokenError") {
    let message = "Json Web Token is invalid, try again";
    err = new ErrorHandler(message, 400);
  }
  if (err.name === "TokenExpiredError") {
    let message = "Json Web Token is Expired, try again";
    err = new ErrorHandler(message, 400);
  }
  // Default fallback
  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
