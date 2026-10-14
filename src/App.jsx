import Signup from "./Signup";
import Login from "./Login";
import Project from "./Projects";

function App() {
  // How the React interface is organized:
  // App is the main React component.
  // It displays the Signup and Login components.
  return (
    <div>
      <Signup />
      <Login />
      <Project />
    </div>
  );
}

export default App;