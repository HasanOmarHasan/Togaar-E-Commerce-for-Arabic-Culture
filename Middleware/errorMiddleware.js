const ApiError = require("../utils/ApiError");

const sendErrorForDev = (err, res) => {
  res.status(err.codeStatus).json({
    message: err.message,
    status: err.status,
    error: err,
    stack: err.stack,
  });
};

const sendErrorForProd = (err, res) =>
  res.status(err.codeStatus).json({
    message: err.message,
    status: err.status,
  });

const handleJWTError = (req) =>
  new ApiError(req.t("http.InvalidToken"), 401);

const handleJWTExpiredError = (req) =>
  new ApiError(req.t("http.TokenExpired"), 401);

const errorMiddleware = (err, req, res, next) => {
  err.codeStatus = err.codeStatus || 500;
  err.status = err.status || req.t("http.error");

  if (process.env.NODE_ENV === "dev") {
    sendErrorForDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    if (err.name === "JsonWebTokenError") {
      err = handleJWTError(req);
    }

    if (err.name === "TokenExpiredError") {
      err = handleJWTExpiredError(req);
    }

    sendErrorForProd(err, res);
  }
};

module.exports = errorMiddleware;
