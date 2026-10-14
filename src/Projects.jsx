
import { useEffect, useState } from "react";

// Address of the Express backend
const API = "http://localhost:3000";

// Displays the user's name instead of their MongoDB ID
function displayName(user) {
  if (!user) return "Unknown User";

  return `${user.f_name} ${user.l_name} (${user.username})`;
}

// Sends requests from React to the Express backend
async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers
    }
  });

  const data = await response.json();

  // Shows an error message if the request fails
  if (!response.ok) {
    throw new Error(data.message || "Request failed.");
  }

  return data;
}

function Projects() {
  // Stores the users, projects, and memberships from MongoDB
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [members, setMembers] = useState([]);

  // Stores the currently selected project and user
  const [selectedProject, setSelectedProject] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  // Stores the information entered in the project form
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "Planning",
    project_lead_id: ""
  });

  // Stores success and error messages
  const [message, setMessage] = useState("");
  const [memberMessage, setMemberMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Finds the currently selected project
  const currentProject = projects.find(
    (project) => project._id === selectedProject
  );

  // Loads registered users and projects from the backend
  async function loadOverview() {
    try {
      const [nextUsers, nextProjects] = await Promise.all([
        request("/users"),
        request("/projects")
      ]);

      setUsers(nextUsers);
      setProjects(nextProjects);
    } catch (error) {
      setMessage(error.message);
    }
  }

  // Loads the members of the selected project
  async function loadMembers(projectId) {
    try {
      const data = await request(
        `/projects/${projectId}/members`
      );

      setMembers(data);
    } catch (error) {
      setMemberMessage(error.message);
    }
  }

  // Loads users and projects when the page first opens
  useEffect(() => {
    loadOverview();
  }, []);

  // Updates the membership list when another project is selected
  useEffect(() => {
    setMembers([]);
    setMemberMessage("");

    if (selectedProject) {
      loadMembers(selectedProject);
    }
  }, [selectedProject]);

  // Updates the project form when the user types or selects a value
  function handleChange(event) {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: value
    });
  }

  // Creates a project and sends its information to MongoDB
  async function createProject(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const data = await request("/projects", {
        method: "POST",
        body: JSON.stringify(form)
      });

      setMessage(data.message);

      // Clears the form after successfully creating a project
      setForm({
        name: "",
        description: "",
        status: "Planning",
        project_lead_id: ""
      });

      // Refreshes the project list and selects the new project
      await loadOverview();
      setSelectedProject(data.project._id);
      await loadMembers(data.project._id);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Adds a registered user to the selected project
  async function addMember(event) {
    event.preventDefault();
    setLoading(true);
    setMemberMessage("");

    try {
      const data = await request(
        `/projects/${selectedProject}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: selectedUser
          })
        }
      );

      setMemberMessage(data.message);

      // Clears the selected user after adding them
      setSelectedUser("");

      // Refreshes the displayed membership list
      await loadMembers(selectedProject);
    } catch (error) {
      setMemberMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  // Removes a member from the selected project
  async function removeMember(userId) {
    setLoading(true);
    setMemberMessage("");

    try {
      const data = await request(
        `/projects/${selectedProject}/members/${userId}`,
        {
          method: "DELETE"
        }
      );

      setMemberMessage(data.message);

      // Updates the members shown after removal
      await loadMembers(selectedProject);
    } catch (error) {
      setMemberMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="projects-container">
      <h2>Project Management</h2>

      {/* Form used to create a new project */}
      <section className="project-section">
        <h3>Create Project</h3>

        <form onSubmit={createProject}>
          <label>Project Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter project name"
            required
          />

          <label>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Enter project description"
            required
          />

          <label>Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
          </select>

          <label>Project Lead</label>
          <select
            name="project_lead_id"
            value={form.project_lead_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Project Lead</option>

            {/* Gets the project lead options from registered users */}
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {displayName(user)}
              </option>
            ))}
          </select>

          <button type="submit" disabled={loading}>
            Create Project
          </button>
        </form>

        <p role="status">{message}</p>

        <button
          type="button"
          onClick={loadOverview}
          disabled={loading}
        >
          Refresh Users and Projects
        </button>
      </section>

      {/* Displays all projects stored in MongoDB */}
      <section className="project-section">
        <h3>View Projects</h3>

        {projects.length === 0 ? (
          <p>No projects created yet.</p>
        ) : (
          projects.map((project) => (
            <div className="project-card" key={project._id}>
              <h4>{project.name}</h4>

              <p>
                <strong>Description:</strong>{" "}
                {project.description}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {project.status}
              </p>

              <p>
                <strong>Project Lead:</strong>{" "}
                {displayName(project.project_lead_id)}
              </p>

              <button
                type="button"
                onClick={() =>
                  setSelectedProject(project._id)
                }
              >
                Manage Members
              </button>
            </div>
          ))
        )}
      </section>

      {/* Allows users to manage memberships for a project */}
      <section className="project-section">
        <h3>Manage Project Memberships</h3>

        <label>Select Project</label>
        <select
          value={selectedProject}
          onChange={(event) => {
            setSelectedProject(event.target.value);
            setSelectedUser("");
          }}
        >
          <option value="">Select a Project</option>

          {projects.map((project) => (
            <option key={project._id} value={project._id}>
              {project.name}
            </option>
          ))}
        </select>

        {currentProject && (
          <>
            <h4>Members of {currentProject.name}</h4>

            {/* Lists all members belonging to the selected project */}
            <ul>
              {members.map((membership) => {
                const user = membership.user_id;

                if (!user) return null;

                // Checks if the current member is the project lead
                const isLead =
                  currentProject.project_lead_id?._id ===
                  user._id;

                return (
                  <li key={membership._id}>
                    {displayName(user)}

                    {isLead ? (
                      // The project lead cannot be removed
                      <strong> (Project Lead)</strong>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                          removeMember(user._id)
                        }
                      >
                        Remove
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Form used to add registered users to a project */}
            <form onSubmit={addMember}>
              <label>Add Member</label>

              <select
                value={selectedUser}
                onChange={(event) =>
                  setSelectedUser(event.target.value)
                }
                required
              >
                <option value="">Select a User</option>

                {/* Lists registered users available to select */}
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {displayName(user)}
                  </option>
                ))}
              </select>

              <button type="submit" disabled={loading}>
                Add Member
              </button>
            </form>
          </>
        )}

        <p role="status">{memberMessage}</p>
      </section>
    </div>
  );
}

export default Projects;
