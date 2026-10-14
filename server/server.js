import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./User.js";
import Project from "./Project.js"
import ProjectMembership from "./ProjectMembership.js";

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


// Checks if an ID is a valid MongoDB ObjectId
const validId = (id) => mongoose.isValidObjectId(id);

// User fields to display without showing passwords
const userFields = "f_name l_name username";

// Gets all registered users from MongoDB
// Used for selecting project leads and members
app.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, userFields);

    res.json(users);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load users."
    });
  }
});

// Creates a new project
app.post("/projects", async (req, res) => {
  try {
    const {
      name,
      description,
      status,
      project_lead_id
    } = req.body;

    // Checks that all required information was provided
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof description !== "string" ||
      !description.trim() ||
      !["Planning", "Active", "Completed"].includes(status) ||
      !project_lead_id
    ) {
      return res.status(400).json({
        message: "All project fields are required."
      });
    }

    // Checks if the selected project lead exists
    if (
      !validId(project_lead_id) ||
      !(await User.exists({ _id: project_lead_id }))
    ) {
      return res.status(404).json({
        message: "Project lead does not exist."
      });
    }

    // Uses a transaction to save the project and lead membership together
    const session = await mongoose.startSession();
    let project;

    try {
      await session.withTransaction(async () => {
        // Creates the project document in MongoDB
        const [created] = await Project.create(
          [{
            name: name.trim(),
            description: description.trim(),
            status,
            project_lead_id
          }],
          { session }
        );

        project = created;

        // Automatically adds the project lead as a member
        await ProjectMembership.create(
          [{
            project_id: project._id,
            user_id: project_lead_id
          }],
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    // Gets the new project with its lead's information
    const result = await Project.findById(project._id)
      .populate("project_lead_id", userFields);

    res.status(201).json({
      message: "Project created successfully.",
      project: result
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create project."
    });
  }
});

// Gets all projects from MongoDB
app.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("project_lead_id", userFields);

    res.json(projects);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load projects."
    });
  }
});

// Gets all members belonging to a selected project
app.get("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;

    // Checks whether the selected project exists
    if (
      !validId(projectId) ||
      !(await Project.exists({ _id: projectId }))
    ) {
      return res.status(404).json({
        message: "Project does not exist."
      });
    }

    // Finds the memberships and loads each user's details
    const members = await ProjectMembership.find({
      project_id: projectId
    }).populate("user_id", userFields);

    res.json(members);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to load members."
    });
  }
});

// Adds a registered user to a selected project
app.post("/projects/:projectId/members", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { user_id } = req.body;

    // Checks whether the project exists
    if (
      !validId(projectId) ||
      !(await Project.exists({ _id: projectId }))
    ) {
      return res.status(404).json({
        message: "Project does not exist."
      });
    }

    // Checks whether the user exists
    if (
      !validId(user_id) ||
      !(await User.exists({ _id: user_id }))
    ) {
      return res.status(404).json({
        message: "User does not exist."
      });
    }

    // Prevents the same user from joining twice
    const existing = await ProjectMembership.exists({
      project_id: projectId,
      user_id
    });

    if (existing) {
      return res.status(409).json({
        message: "User is already a member of this project."
      });
    }

    // Saves the membership using ObjectId references
    const membership = await ProjectMembership.create({
      project_id: projectId,
      user_id
    });

    res.status(201).json({
      message: "Member added successfully.",
      membership
    });
  } catch (error) {
    // Handles duplicate memberships caught by MongoDB
    if (error.code === 11000) {
      return res.status(409).json({
        message: "User is already a member of this project."
      });
    }

    console.error(error);

    res.status(500).json({
      message: "Unable to add member."
    });
  }
});

// Removes a non-lead member from a project
app.delete(
  "/projects/:projectId/members/:userId",
  async (req, res) => {
    try {
      const { projectId, userId } = req.params;

      // Checks whether the project exists
      if (!validId(projectId)) {
        return res.status(404).json({
          message: "Project does not exist."
        });
      }

      const project = await Project.findById(projectId);

      if (!project) {
        return res.status(404).json({
          message: "Project does not exist."
        });
      }

      // Checks whether the user exists
      if (
        !validId(userId) ||
        !(await User.exists({ _id: userId }))
      ) {
        return res.status(404).json({
          message: "User does not exist."
        });
      }

      // Does not allow removing the project lead
      if (project.project_lead_id.equals(userId)) {
        return res.status(403).json({
          message: "Project lead cannot be removed."
        });
      }

      // Deletes the membership from MongoDB
      const removed = await ProjectMembership.findOneAndDelete({
        project_id: projectId,
        user_id: userId
      });

      if (!removed) {
        return res.status(404).json({
          message: "Membership does not exist."
        });
      }

      res.json({
        message: "Member removed successfully."
      });
    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Unable to remove member."
      });
    }
  }
);


app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});