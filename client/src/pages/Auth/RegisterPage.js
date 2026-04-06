import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const [form, setForm] = useState({
    user_name: "",
    password: "",
    role: "user",
    department_name: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const canRegister = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");
  
  if (!canRegister) {
    navigate("/");
    return null;
  }

  const getAvailableRoles = () => {
    if (user.role === "SUPER_ADMIN") {
      return [
        { value: "ADMIN", label: "ADMIN" },
        { value: "manager", label: "Manager" },
        { value: "user", label: "User" },
      ];
    } else if (user.role === "ADMIN") {
      return [
        { value: "manager", label: "Manager" },
        { value: "user", label: "User" },
      ];
    }
    return [];
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:5005/api/auth/register",
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setMessage(res.data.message);
      setForm({
        user_name: "",
        password: "",
        role: user.role === "SUPER_ADMIN" ? "ADMIN" : "manager",
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
        <p style={styles.subtitle}>
          Logged in as: <strong>{user.user_name}</strong> ({user.role})
        </p>
        
        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username *</label>
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
            <label style={styles.label}>Password *</label>
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
            <label style={styles.label}>Role *</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              style={styles.select}
            >
              {getAvailableRoles().map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Department Name *</label>
            <select
              name="department_name"
              value={form.department_name}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="Legal">Legal</option>
              <option value="Treasury">Treasury</option>
              <option value="Gold Loan">Gold Loan</option>
              <option value="Fixed Deposit">Fixed Deposit</option>
            </select>
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