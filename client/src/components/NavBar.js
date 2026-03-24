import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isAssetsOpen, setIsAssetsOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Don't show navbar on login page
  if (window.location.pathname === "/login") {
    return null;
  }

  // Toggle dropdowns
  const toggleAssetsDropdown = () => {
    setIsAssetsOpen(!isAssetsOpen);
    setIsManageOpen(false); // Close other dropdown
  };

  const toggleManageDropdown = () => {
    setIsManageOpen(!isManageOpen);
    setIsAssetsOpen(false); // Close other dropdown
  };

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
            
            {/* Assets Dropdown */}
            <div 
              style={styles.dropdown}
              onMouseEnter={() => {
                setIsAssetsOpen(true);
                setIsManageOpen(false);
              }}
              onMouseLeave={() => setIsAssetsOpen(false)}
            >
              <button 
                onClick={toggleAssetsDropdown}
                style={styles.dropdownBtn}
              >
                Assets
                <span style={styles.dropdownArrow}>
                  {isAssetsOpen ? " ▲" : " ▼"}
                </span>
              </button>
              
              {isAssetsOpen && (
                <div style={styles.dropdownContent}>
                  <Link to="/assetForm" style={styles.dropdownLink}>
                    Add
                  </Link>
                  <Link to="/allocate-form" style={styles.dropdownLink}>
                    Allocate
                  </Link>
                  <Link to="/req-asset" style={styles.dropdownLink}>
                    Request
                  </Link>
                  <Link to="/allocate-list" style={styles.dropdownLink}>
                    Allocation List
                  </Link>
                  <Link to="/assets-list" style={styles.dropdownLink}>
                    Asset List
                  </Link>
                </div>
              )}
            </div>
            
            {/* Manage Dropdown - Only for SUPER_ADMIN */}
            {user.role === "SUPER_ADMIN" && (
              <div 
                style={styles.dropdown}
                onMouseEnter={() => {
                  setIsManageOpen(true);
                  setIsAssetsOpen(false);
                }}
                onMouseLeave={() => setIsManageOpen(false)}
              >
                <button 
                  onClick={toggleManageDropdown}
                  style={styles.dropdownBtn}
                >
                  Manage
                  <span style={styles.dropdownArrow}>
                    {isManageOpen ? " ▲" : " ▼"}
                  </span>
                </button>
                
                {isManageOpen && (
                  <div style={styles.dropdownContent}>
                    <Link to="/role-management" style={styles.dropdownLink}>
                      Role Management
                    </Link>
                    <Link to="/register" style={styles.dropdownLink}>
                      User Register
                    </Link>
                    <Link to="/reports" style={styles.dropdownLink}>
                      Reports
                    </Link>
                  </div>
                )}
              </div>
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
    position: "sticky",
    top: 0,
    zIndex: 1000,
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
    transition: "color 0.3s",
    ":hover": {
      color: "#3498db",
    },
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
    cursor: "pointer",
    ":hover": {
      color: "#3498db",
    },
  },
  dropdown: {
    position: "relative",
    display: "inline-block",
  },
  dropdownBtn: {
    backgroundColor: "transparent",
    color: "#ecf0f1",
    border: "none",
    padding: "0.5rem 0",
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "color 0.3s",
    whiteSpace: "nowrap",
    fontFamily: "inherit",
    ":hover": {
      color: "#3498db",
    },
  },
  dropdownArrow: {
    fontSize: "0.7rem",
    marginLeft: "4px",
  },
  dropdownContent: {
    position: "absolute",
    top: "35px",
    left: "0",
    backgroundColor: "#fff",
    minWidth: "180px",
    boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
    borderRadius: "4px",
    zIndex: 1000,
    overflow: "hidden",
    animation: "fadeIn 0.2s ease-in-out",
  },
  dropdownLink: {
    color: "#333",
    padding: "12px 16px",
    textDecoration: "none",
    display: "block",
    fontSize: "0.9rem",
    transition: "all 0.3s",
    whiteSpace: "nowrap",
    borderBottom: "1px solid #f0f0f0",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#f5f5f5",
      color: "#3498db",
      paddingLeft: "20px",
    },
    ":last-child": {
      borderBottom: "none",
    },
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: "0.8rem",
    marginLeft: "0.5rem",
    paddingLeft: "0.5rem",
    borderLeft: "1px solid #465c6f",
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
    ":hover": {
      backgroundColor: "#c0392b",
    },
  },
};

// Add CSS animation keyframes (you can add this to your global CSS file)
const globalStyles = `
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Optional: Add responsive design for mobile */
@media (max-width: 768px) {
  .nav-links {
    gap: 0.8rem;
  }
  
  .dropdown-content {
    position: fixed;
    top: auto;
    left: 0;
    right: 0;
    margin: 0 10px;
  }
}
`;

export default NavBar;