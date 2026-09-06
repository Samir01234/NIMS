const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // 1. Get Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    // 2. Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Invalid authorization format.",
      });
    }

    // 3. Extract token
    const token = authHeader.split(" ")[1];

    // 4. Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 5. Attach user information to request
    req.user = decoded;

    // 6. Continue to protected route
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;