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

  // Don't show navbar on login page
  if (window.location.pathname === "/login") {
    return null;
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            Asset Management System
          </Link>
        </div>

        {user && (
          <div style={styles.navLinks}>
            <Link to="/" style={styles.link}>
              Dashboard
            </Link>
            <Link to="/assets-list" style={styles.link}>
              Assets List
            </Link>
            <Link to="/assetForm" style={styles.link}>
              Add Asset
            </Link>
            <Link to="/allocate-form" style={styles.link}>
              Allocate Asset
            </Link>
            <Link to="/allocate-list" style={styles.link}>
              Allocation List
            </Link>
            <Link to="/req-asset" style={styles.link}>
              Request Asset
            </Link>
            
            {/* Show Register option only for SUPER_ADMIN */}
            {user.role === "SUPER_ADMIN" && (
              <Link to="/register" style={styles.link}>
                Register User
              </Link>
            )}
            
            <div style={styles.userInfo}>
              <span style={styles.userName}>{user.user_name}</span>
              <span style={styles.userRole}>({user.role})</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    backgroundColor: "#2c3e50",
    padding: "0 20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    height: "60px",
    display: "flex",
    alignItems: "center",
  },
  container: {
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  logoLink: {
    color: "#ecf0f1",
    textDecoration: "none",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "1.2rem",
  },
  link: {
    color: "#ecf0f1",
    textDecoration: "none",
    padding: "0.5rem 0",
    fontSize: "0.9rem",
    transition: "color 0.3s",
    whiteSpace: "nowrap",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    marginLeft: "0.5rem",
  },
  userName: {
    color: "#3498db",
    fontWeight: "bold",
    fontSize: "0.9rem",
  },
  userRole: {
    color: "#95a5a6",
    fontSize: "0.85rem",
  },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "0.4rem 0.8rem",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.85rem",
    transition: "background-color 0.3s",
  },
};

export default NavBar;