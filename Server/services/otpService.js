const bcrypt = require("bcrypt");
const OTP = require("../models/OTP");
const { generateOTP } = require("../utils/otp");

async function createOTP(userId, purpose) {
  // Check whether a recent OTP already exists
  const existingOTP = await OTP.findOne({
    userId,
    purpose,
  });

  // 60-second resend cooldown
  if (existingOTP) {
    const secondsSinceCreated =
      (Date.now() - existingOTP.createdAt.getTime()) / 1000;

    if (secondsSinceCreated < 60) {
      const secondsRemaining = Math.ceil(
        60 - secondsSinceCreated
      );

      const error = new Error(
        `Please wait ${secondsRemaining} seconds before requesting a new OTP.`
      );

      error.statusCode = 429;

      throw error;
    }

    // Old OTP is older than the cooldown
    await OTP.deleteOne({
      _id: existingOTP._id,
    });
  }

  // Generate a new 6-digit OTP
  const otp = generateOTP();

  // Hash OTP before storing it
  const otpHash = await bcrypt.hash(otp, 10);

  // OTP expires after 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Save new OTP
  await OTP.create({
    userId,
    otpHash,
    purpose,
    expiresAt,
  });

  // Return plain OTP temporarily
  return otp;
}

module.exports = {
  createOTP,
};