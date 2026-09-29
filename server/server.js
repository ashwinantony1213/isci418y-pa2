import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./User.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

app.post("/signup", async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists."
      });
    }

    const newUser = new User({
      f_name,
      l_name,
      username,
      password
    });

    await newUser.save();

    res.status(201).json({
      message: "User created successfully."
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});