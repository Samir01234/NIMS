const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("../routes/authRoutes");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
  });

app.get("/", (req, res) => {
  res.json({
    message: "NIMS API is running 🚀",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`NIMS server running on port ${PORT}`);
});