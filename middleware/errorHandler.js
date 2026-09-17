function notFoundHandler(req, res) {
  return res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    Object.prototype.hasOwnProperty.call(error, "body")
  ) {
    return res.status(400).json({ message: "Request body contains invalid JSON." });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed.",
      errors: Object.values(error.errors).map((item) => item.message)
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid resource id or field value."
    });
  }

  if (error.code === 11000) {
    const duplicatedFields = Object.keys(error.keyPattern || {});

    return res.status(409).json({
      message: `Duplicate value for: ${duplicatedFields.join(", ") || "unique field"}.`
    });
  }

  const status = Number.isInteger(error.status) ? error.status : 500;
  const exposeMessage = status < 500 || process.env.NODE_ENV !== "production";

  return res.status(status).json({
    message: exposeMessage
      ? error.message || "Internal server error."
      : "Internal server error."
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
