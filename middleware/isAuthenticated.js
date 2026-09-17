const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

const JWT_OPTIONS = {
  algorithms: ["HS256"],
  issuer: "badfish-api",
  audience: "badfish-client"
};


async function isAuthenticated(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Missing or invalid Authorization header."
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!token) {
      return res.status(401).json({
        message: "Authentication token is missing."
      });
    }

    const payload = jwt.verify(
      token,
      process.env.TOKEN_SECRET,
      JWT_OPTIONS
    );

    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({
        message: "User linked to this token no longer exists."
      });
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        message: "Authentication token has been revoked."
      });
    }

    req.user = user;
    req.auth = payload;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Authentication token expired." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid authentication token." });
    }

    next(error);
  }
}

module.exports = isAuthenticated;
