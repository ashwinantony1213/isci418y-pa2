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

// How the backend communicates with MongoDB:
// Mongoose connects the Express backend to the MongoDB Atlas database
// using the connection string stored in the .env file.
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// How Express handles Signup requests:
// This route receives Signup data sent by the React frontend.
app.post("/signup", async (req, res) => {
  try {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    // How the backend communicates with MongoDB:
    // Searches MongoDB to see if this username already exists.
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(400).json({
        message: "Username already exists."
      });
    }

    // Creates a new MongoDB user document.
    const newUser = new User({
      f_name,
      l_name,
      username,
      password
    });

    // Saves the new user document in MongoDB.
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

// How Express handles Login requests:
// This route receives the username and password from the React Login form.
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Username and password are required."
      });
    }

    // How the backend communicates with MongoDB:
    // Searches the database for a user with the supplied username.
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({
        message: "Username does not exist."
      });
    }

    // Compares the supplied password with the stored password.
    if (user.password !== password) {
      return res.status(400).json({
        message: "Incorrect password."
      });
    }

    res.status(200).json({
      message: "Login successful."
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