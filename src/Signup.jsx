import { useState } from "react";

function Signup() {
  const [formData, setFormData] = useState({
    f_name: "",
    l_name: "",
    username: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleSubmit = async (event) => {
  event.preventDefault();

  if (
    !formData.f_name ||
    !formData.l_name ||
    !formData.username ||
    !formData.password
  ) {
    setMessage("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    setMessage(data.message);
  } catch (error) {
    setMessage("Unable to connect to the server.");
  }
};

  return (
    <div>
      <h1>Signup</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>First Name</label>
          <input
            type="text"
            name="f_name"
            value={formData.f_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Last Name</label>
          <input
            type="text"
            name="l_name"
            value={formData.l_name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button type="submit">Sign Up</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Signup;