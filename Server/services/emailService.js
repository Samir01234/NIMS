const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendOTPEmail(to, otp) {
  await transporter.sendMail({
    from: `"NIMS" <${process.env.SMTP_FROM}>`,
    to,
    subject: "Your NIMS Login OTP",
    text: `Your NIMS login OTP is ${otp}. It expires in 5 minutes.`,
    html: `
      <h2>NIMS Login Verification</h2>
      <p>Your login OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP expires in <strong>5 minutes</strong>.</p>
      <p>If you did not try to log in, please ignore this email.</p>
    `,
  });
}

module.exports = {
  sendOTPEmail,
};
