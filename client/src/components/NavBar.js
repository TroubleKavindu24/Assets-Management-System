import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const styles = {
    container: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#1e293b",
      padding: "12px 30px",
      color: "#fff",
    },
    logo: {
      fontSize: "20px",
      fontWeight: "bold",
    },
    navLinks: {
      display: "flex",
      gap: "20px",
      alignItems: "center",
    },
    link: {
      textDecoration: "none",
      color: "#e2e8f0",
      fontSize: "14px",
      transition: "0.3s",
    },
    button: {
      backgroundColor: "#ef4444",
      border: "none",
      padding: "8px 14px",
      color: "#fff",
      borderRadius: "6px",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.container}>
      {/* Logo / Brand */}
      <div style={styles.logo}>Asset System</div>

      {/* Navigation Links */}
      <div style={styles.navLinks}>
        <Link to="/assetForm" style={styles.link}>Add Asset</Link>
        <Link to="/allocate-form" style={styles.link}>Allocate Asset</Link>
        <Link to="/allocate-list" style={styles.link}>Allocation List</Link>
        <Link to="/req-asset" style={styles.link}>Request Form</Link>
        <Link to="/assets-list" style={styles.link}>Asset List</Link>
        <Link to="/add" style={styles.link}>Add Agreement</Link>
      </div>

      {/* Logout Button */}
      <button onClick={handleLogout} style={styles.button}>
        Logout
      </button>
    </div>
  );
};

export default NavBar;