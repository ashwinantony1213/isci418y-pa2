import express from "express";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.post("/signup", (req, res) => {
  const { f_name, l_name, username, password } = req.body;

  if (!f_name || !l_name || !username || !password) {
    return res.status(400).json({
      message: "All fields are required."
    });
  }

  res.status(200).json({
    message: "Signup data received."
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});