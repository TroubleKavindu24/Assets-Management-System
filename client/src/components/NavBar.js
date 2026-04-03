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
    setIsManageOpen(false);
  };

  const toggleManageDropdown = () => {
    setIsManageOpen(!isManageOpen);
    setIsAssetsOpen(false);
  };

  return (
    <>
      <div style={styles.sidebar}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            Asset Management
          </Link>
        </div>

        {user && (
          <div style={styles.navContainer}>
            <Link to="/" style={styles.link}>
              Dashboard
            </Link>
            
            {/* Assets Dropdown */}
            <div style={styles.dropdown}>
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
                    ➤ Add Asset
                  </Link>
                  <Link to="/allocate-form" style={styles.dropdownLink}>
                    ➤ Allocate Asset
                  </Link>
                  <Link to="/req-asset" style={styles.dropdownLink}>
                    ➤ Request Asset
                  </Link>
                  <Link to="/allocate-list" style={styles.dropdownLink}>
                    ➤ Allocation List
                  </Link>
                  <Link to="/assets-list" style={styles.dropdownLink}>
                    ➤ Asset List
                  </Link>
                  <Link to="/dispose-list" style={styles.dropdownLink}>
                    ➤ Disposed Assets
                  </Link>
                </div>
              )}
            </div>
            
            {/* Manage Dropdown - Only for SUPER_ADMIN */}
            {user.role === "SUPER_ADMIN" && (
              <div style={styles.dropdown}>
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
                    <Link to="/rolemanagement" style={styles.dropdownLink}>
                      ➤ Role Management
                    </Link>
                    <Link to="/permissions" style={styles.dropdownLink}>
                      ➤ Permissions Management
                    </Link>
                    <Link to="/register" style={styles.dropdownLink}>
                      ➤ User Register
                    </Link>
                    <Link to="/reports" style={styles.dropdownLink}>
                      ➤ Reports
                    </Link>
                  </div>
                )}
              </div>
            )}
            
            <div style={styles.userInfo}>
              <div style={styles.userDetails}>
                <span style={styles.userName}>{user.user_name}</span>
                <span style={styles.userRole}>({user.role})</span>
              </div>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const styles = {
  sidebar: {
    width: "260px",
    backgroundColor: "#2c3e50",
    height: "100vh",
    position: "fixed",
    top: 0,
    left: 0,
    color: "white",
    display: "flex",
    flexDirection: "column",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    overflowY: "auto",
    zIndex: 1000,
  },
  logo: {
    padding: "20px",
    borderBottom: "1px solid #465c6f",
    marginBottom: "20px",
    textAlign: "center",
  },
  logoLink: {
    color: "#ecf0f1",
    textDecoration: "none",
    fontSize: "1.2rem",
    fontWeight: "bold",
    transition: "color 0.3s",
    display: "block",
    ":hover": {
      color: "#3498db",
    },
  },
  navContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "0 15px",
  },
  link: {
    color: "#ecf0f1",
    textDecoration: "none",
    padding: "12px 15px",
    fontSize: "0.95rem",
    transition: "all 0.3s",
    borderRadius: "6px",
    marginBottom: "5px",
    display: "block",
    cursor: "pointer",
    ":hover": {
      backgroundColor: "#34495e",
      color: "#3498db",
      paddingLeft: "20px",
    },
  },
  dropdown: {
    marginBottom: "5px",
    width: "100%",
  },
  dropdownBtn: {
    backgroundColor: "transparent",
    color: "#ecf0f1",
    border: "none",
    padding: "12px 15px",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "all 0.3s",
    fontFamily: "inherit",
    width: "100%",
    textAlign: "left",
    borderRadius: "6px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ":hover": {
      backgroundColor: "#34495e",
      color: "#3498db",
    },
  },
  dropdownArrow: {
    fontSize: "0.7rem",
    marginLeft: "8px",
  },
  dropdownContent: {
    backgroundColor: "#34495e",
    marginLeft: "15px",
    marginTop: "5px",
    marginBottom: "5px",
    borderRadius: "6px",
    overflow: "hidden",
    animation: "slideDown 0.2s ease-in-out",
  },
  dropdownLink: {
    color: "#ecf0f1",
    padding: "10px 15px 10px 30px",
    textDecoration: "none",
    display: "block",
    fontSize: "0.9rem",
    transition: "all 0.3s",
    cursor: "pointer",
    borderLeft: "3px solid transparent",
    ":hover": {
      backgroundColor: "#2c3e50",
      color: "#3498db",
      borderLeftColor: "#3498db",
      paddingLeft: "35px",
    },
  },
  userInfo: {
    marginTop: "auto",
    padding: "20px 15px",
    borderTop: "1px solid #465c6f",
    marginBottom: "20px",
  },
  userDetails: {
    marginBottom: "12px",
    textAlign: "center",
  },
  userName: {
    color: "#3498db",
    fontWeight: "bold",
    fontSize: "0.95rem",
    display: "block",
    marginBottom: "4px",
  },
  userRole: {
    color: "#95a5a6",
    fontSize: "0.85rem",
    display: "block",
  },
  logoutBtn: {
    backgroundColor: "#e74c3c",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    transition: "all 0.3s",
    width: "100%",
    fontWeight: "bold",
    ":hover": {
      backgroundColor: "#c0392b",
      transform: "translateY(-1px)",
    },
  },
};

// Add CSS animation keyframes
const globalStyles = `
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom scrollbar for sidebar */
.sidebar::-webkit-scrollbar {
  width: 8px;
}

.sidebar::-webkit-scrollbar-track {
  background: #2c3e50;
}

.sidebar::-webkit-scrollbar-thumb {
  background: #465c6f;
  border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: #3498db;
}
`;

export default NavBar;