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

  const colors = {
    bg: "#1e293b",           
    text: "#e2e8f0",       
    primary: "#2c3e50",      
    primaryHover: "#3b4f67",
    hoverBg: "rgba(44, 62, 80, 0.4)", 
    border: "rgba(226, 232, 240, 0.1)",
  };

  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        background: colors.bg,
        color: colors.text,
        position: "fixed",
        top: 0,
        left: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${colors.border}`,
        boxShadow: "2px 0 15px rgba(0,0,0,0.25)",
        zIndex: 1000,
      }}
    >
      {/* Header / Brand */}
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${colors.border}` }}>
        <h3
          style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#cbd5e1", // lighter for contrast
          }}
        >
          Menu
        </h3>
      </div>

      {/* Main Navigation Links */}
      <nav style={{ flex: 1, padding: "20px 0" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          <li>
            <Link
              to="/add"
              style={{
                display: "block",
                padding: "14px 24px",
                color: colors.text,
                textDecoration: "none",
                fontSize: "1.05rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.hoverBg;
                e.currentTarget.style.color = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.text;
              }}
            >
              Add Agreement
            </Link>
          </li>
          <li>
            <Link
              to="/summary"
              style={{
                display: "block",
                padding: "14px 24px",
                color: colors.text,
                textDecoration: "none",
                fontSize: "1.05rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = colors.hoverBg;
                e.currentTarget.style.color = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = colors.text;
              }}
            >
              Summary
            </Link>
          </li>

        </ul>
      </nav>

      <div
        style={{
          padding: "20px",
          borderTop: `1px solid ${colors.border}`,
          background: "rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            marginBottom: "12px",
            fontSize: "1.05rem",
            fontWeight: 500,
            color: "#ffffffff", // slightly muted
          }}
        >
          User : {user?.username || "User"}
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: "100%",
            padding: "10px 16px",
            background: colors.primary,
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "1rem",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.primaryHover;
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = colors.primary;
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default NavBar;