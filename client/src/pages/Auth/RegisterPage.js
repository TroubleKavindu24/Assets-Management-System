import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [form, setForm] = useState({
    user_name: "",
    password: "",
    role: "ADMIN",
    department_name: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check if user is SUPER_ADMIN, if not redirect
  if (user && user.role !== "SUPER_ADMIN") {
    navigate("/");
    return null;
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        "http://localhost:5005/api/auth/register",
        form
      );
      setMessage(res.data.message);
      setForm({
        user_name: "",
        password: "",
        role: "ADMIN",
        department_name: "",
      });
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Register New User</h2>
        
        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="user_name"
              placeholder="Enter username"
              value={form.user_name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={form.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Department Name</label>
            <input
              type="text"
              name="department_name"
              placeholder="Enter department name"
              value={form.department_name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          
          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register User"}
          </button>
          
          {message && <p style={styles.success}>{message}</p>}
          {error && <p style={styles.error}>{error}</p>}
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "calc(100vh - 80px)",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    padding: "40px",
    width: "100%",
    maxWidth: "500px",
  },
  title: {
    margin: "0 0 10px 0",
    color: "#2c3e50",
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 30px 0",
    color: "#7f8c8d",
    textAlign: "center",
    fontSize: "14px",
  },
  inputGroup: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#2c3e50",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: "10px",
    border: "1px solid #ddd",
    borderRadius: "4px",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#2ecc71",
    color: "white",
    border: "none",
    borderRadius: "4px",
    fontSize: "16px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  success: {
    marginTop: "15px",
    color: "#2ecc71",
    textAlign: "center",
    fontSize: "14px",
  },
  error: {
    marginTop: "15px",
    color: "#e74c3c",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default RegisterPage;