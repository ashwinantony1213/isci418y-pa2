import Signup from "./Signup";
import Login from "./Login";

function App() {
  // How the React interface is organized:
  // App is the main React component.
  // It displays the Signup and Login components.
  return (
    <div>
      <Signup />
      <Login />
    </div>
  );
}

export default App;