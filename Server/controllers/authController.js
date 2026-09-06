const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const { createOTP } = require("../services/otpService");

// ===============================
// SIGNUP
// ===============================
const signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      mobileNumber,
      email,
      password,
      confirmPassword,
    } = req.body;

    // 1. Check required fields
    if (
      !firstName ||
      !lastName ||
      !mobileNumber ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 2. Validate first name
    if (!/^[A-Za-z]{2,30}$/.test(firstName.trim())) {
      return res.status(400).json({
        message: "First name must contain 2-30 letters only",
      });
    }

    // 3. Validate last name
    if (!/^[A-Za-z]{2,30}$/.test(lastName.trim())) {
      return res.status(400).json({
        message: "Last name must contain 2-30 letters only",
      });
    }

    // 4. Validate mobile number
    if (!/^\d{10}$/.test(mobileNumber.trim())) {
      return res.status(400).json({
        message: "Mobile number must contain exactly 10 digits",
      });
    }

    // 5. Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // 6. Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    // 7. Validate password strength
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      });
    }

    // 8. Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    // 9. Check duplicate email
    const existingEmail = await User.findOne({
      email: normalizedEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    // 10. Check duplicate mobile
    const existingMobile = await User.findOne({
      mobileNumber: mobileNumber.trim(),
    });

    if (existingMobile) {
      return res.status(409).json({
        message: "Mobile number is already registered",
      });
    }

    // 11. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 12. Create user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      mobileNumber: mobileNumber.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    // 13. Safe response
    return res.status(201).json({
      message: "Account created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        mobileNumber: user.mobileNumber,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// LOGIN
// ===============================
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // 1. Check required fields
    if (!identifier || !password) {
      return res.status(400).json({
        message: "Email/mobile number and password are required",
      });
    }

    // 2. Clean identifier
    const cleanedIdentifier = identifier.trim();

    // 3. Determine email or mobile
    const isEmail = cleanedIdentifier.includes("@");

    // 4. Find user
    let user;

    if (isEmail) {
      user = await User.findOne({
        email: cleanedIdentifier.toLowerCase(),
      });
    } else {
      user = await User.findOne({
        mobileNumber: cleanedIdentifier,
      });
    }

    // 5. Invalid user
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 6. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 7. Generate OTP
    const otp = await createOTP(user._id, "login");

    // Development only
    console.log(`Login OTP for ${user.email}: ${otp}`);

    // 8. Require OTP verification
    return res.status(200).json({
      message: "Password verified. OTP required.",
      requiresOTP: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);
  
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }
  
    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// VERIFY OTP
// ===============================
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // 1. Check required fields
    if (!userId || !otp) {
      return res.status(400).json({
        message: "User ID and OTP are required",
      });
    }

    // 2. Find login OTP
    const otpRecord = await OTP.findOne({
      userId,
      purpose: "login",
    });

    if (!otpRecord) {
      return res.status(400).json({
        message: "OTP not found or already used",
      });
    }

    // 3. Check OTP expiry
    if (new Date() > otpRecord.expiresAt) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    // 4. Check maximum attempts
    if (otpRecord.attempts >= 5) {
      await OTP.deleteOne({
        _id: otpRecord._id,
      });

      return res.status(429).json({
        message:
          "Too many incorrect attempts. Please request a new OTP.",
      });
    }

    // 5. Compare OTP
    const otpMatch = await bcrypt.compare(
      otp.toString(),
      otpRecord.otpHash
    );

    // 6. Wrong OTP
    if (!otpMatch) {
      otpRecord.attempts += 1;

      await otpRecord.save();

      return res.status(401).json({
        message: "Invalid OTP",
        attemptsRemaining: 5 - otpRecord.attempts,
      });
    }

    // 7. Correct OTP — delete it
    await OTP.deleteOne({
      _id: otpRecord._id,
    });

    // 8. Find verified user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // 9. Check JWT secret
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing from .env");

      return res.status(500).json({
        message: "Server configuration error",
      });
    }

    // 10. Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // 11. Login completed
    return res.status(200).json({
      message: "OTP verified successfully",
      loginSuccessful: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// GET CURRENT USER
// ===============================
const getMe = async (req, res) => {
  try {
    // Find the user using the ID stored in the JWT
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// RESEND OTP
// ===============================
const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check user ID
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    // Check whether user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Generate a new OTP
    const otp = await createOTP(user._id, "login");

    // Development only
    console.log(`Resend OTP for ${user.email}: ${otp}`);

    return res.status(200).json({
      message: "New OTP generated successfully",
      requiresOTP: true,
      userId: user._id,
      email: user.email,
    });
  } catch (error) {
    console.error("Resend OTP error:", error);

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// EXPORT
// ===============================
module.exports = {
  signup,
  login,
  verifyOTP,
  getMe,
  resendOTP,
};