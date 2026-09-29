import mongoose from "mongoose";

// How the backend communicates with MongoDB:
// This Mongoose schema defines how user documents are stored in MongoDB.
const userSchema = new mongoose.Schema({
  f_name: {
    type: String,
    required: true
  },
  l_name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model("User", userSchema);

export default User;