import { useState } from "react";

function Login() {
    //how form data is stored in React:
    // React state stores the username and password entered by the user.
  const [formData, setFormData] = useState({
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

    if (!formData.username || !formData.password) {
      setMessage("Please fill in all fields.");
      return;
    }

    try {
      // How the frontend sends requests to the backend:
      // Sends the Login credentials to the Express /login route.
      const response = await fetch("http://localhost:3000/login", {
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

  // How the React interface is organized:
  // This component contains the Login interface and its form.
  return (
    <div>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
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

        <button type="submit">Login</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default Login;