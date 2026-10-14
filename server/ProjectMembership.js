
import mongoose from "mongoose";

// Stores the relationship between a project and a user
const membershipSchema = new mongoose.Schema({
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

// Prevents a user from joining the same project twice
membershipSchema.index(
  { project_id: 1, user_id: 1 },
  { unique: true }
);

// Creates the ProjectMemberships collection model
export default mongoose.model(
  "ProjectMembership",
  membershipSchema,
  "ProjectMemberships"
);
