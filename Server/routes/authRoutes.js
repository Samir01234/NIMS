const express = require("express");
const { loginLimiter } = require("../middleware/rateLimiter");

const {
    signup,
    login,
    verifyOTP,
    getMe,
    resendOTP,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Signup
router.post("/signup", signup);

// Login
router.post("/login", loginLimiter, login);

// Verify OTP
router.post("/verify-otp", verifyOTP);

// Resend OTP
router.post("/resend-otp", resendOTP);

// Protected current-user route
router.get("/me", authMiddleware, getMe);

module.exports = router;