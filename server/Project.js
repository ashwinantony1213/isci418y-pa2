
import mongoose from "mongoose";

// Schema for storing project information in MongoDB
const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true,
    trim: true
  },

  // Project can only have one of these three statuses
  status: {
    type: String,
    required: true,
    enum: ["Planning", "Active", "Completed"]
  },

  // Connects the project lead to an existing user
  project_lead_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

// Creates the Projects collection model
export default mongoose.model(
  "Project",
  projectSchema,
  "Projects"
);
