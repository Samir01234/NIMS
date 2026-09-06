const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["login", "email_verification", "forgot_password"],
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OTP", otpSchema);