import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/Logo1.png";
import {
  FaHome,
  FaBox,
  FaUsers,
  FaChevronDown,
  FaSignOutAlt,
  FaUserPlus,
  FaClipboardList,
  FaPlusCircle,
  FaExchangeAlt,
  FaTrash,
  FaCog,
} from "react-icons/fa";

const NavBar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Don't show navbar on login page
  if (location.pathname === "/login") {
    return null;
  }

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  // Role checks
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "manager";
  
  const canRegisterUser = isAdmin || isSuperAdmin;
  const canManageSystem = isSuperAdmin;
  const canAddAsset = isAdmin || isSuperAdmin || isManager;
  const canAllocateAsset = isAdmin || isSuperAdmin || isManager;
  const canViewDisposed = isAdmin || isSuperAdmin;

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoContainer}>
        <img src={Logo} alt="logo" style={styles.logo} />
      </div>

      {/* Menu */}
      <div style={styles.menu}>
        <NavItem to="/" icon={<FaHome />} label="Dashboard" />

        {/* Assets Section */}
        <div>
          <div style={styles.menuItem} onClick={() => toggleMenu("assets")}>
            <span style={styles.icon}><FaBox /></span>
            Assets
            <FaChevronDown style={styles.arrow} />
          </div>

          {openMenu === "assets" && (
            <div style={styles.subMenu}>
              {canAddAsset && <SubItem to="/assetForm" label="Add Asset" icon={<FaPlusCircle />} />}
              {canAllocateAsset && <SubItem to="/allocate-form" label="Allocate Asset" icon={<FaExchangeAlt />} />}
              <SubItem to="/assets-list" label="Asset List" icon={<FaClipboardList />} />
              <SubItem to="/allocate-list" label="Allocation List" icon={<FaExchangeAlt />} />
              {canViewDisposed && <SubItem to="/dispose-list" label="Disposed Assets" icon={<FaTrash />} />}
            </div>
          )}
        </div>

        {/* User Registration - ADMIN and SUPER_ADMIN */}
        {canRegisterUser && (
          <NavItem to="/register" icon={<FaUserPlus />} label="Register User" />
        )}

        {/* System Management - SUPER_ADMIN only */}
        {canManageSystem && (
          <div>
            <div style={styles.menuItem} onClick={() => toggleMenu("manage")}>
              <span style={styles.icon}><FaCog /></span>
              System Admin
              <FaChevronDown style={styles.arrow} />
            </div>

            {openMenu === "manage" && (
              <div style={styles.subMenu}>
                <SubItem to="/rolemanagement" label="Role Management" />
                <SubItem to="/permissions" label="Permission Management" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Section */}
      <div style={styles.userSection}>
        <div>
          <div style={styles.userName}>{user?.user_name}</div>
          <div style={styles.userRole}>{user?.role}</div>
          <div style={styles.userDept}>{user?.department_name}</div>
        </div>
        <button onClick={handleLogout} style={styles.logout}>
          <FaSignOutAlt />
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ to, icon, label }) => (
  <Link to={to} style={styles.menuItem}>
    <span style={styles.icon}>{icon}</span>
    {label}
  </Link>
);

const SubItem = ({ to, label, icon }) => (
  <Link to={to} style={styles.subItem}>
    {icon && <span style={styles.subIcon}>{icon}</span>}
    {label}
  </Link>
);

const styles = {
  sidebar: {
    width: "260px",
    height: "100vh",
    background: "linear-gradient(135deg, #020930 0%, #0a1740 100%)",
    borderRight: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "fixed",
    top: 0,
    left: 0,
    padding: "20px 10px",
    zIndex: 1000,
    boxShadow: "2px 0 10px rgba(0,0,0,0.1)",
  },
  logoContainer: {
    textAlign: "center",
    marginBottom: "30px",
    padding: "10px",
  },
  logo: {
    width: "180px",
    marginBottom: "10px",
  },
  menu: {
    flex: 1,
    overflowY: "auto",
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 15px",
    borderRadius: "8px",
    color: "#ffffff",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "5px",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.1)",
    },
  },
  icon: {
    fontSize: "18px",
    minWidth: "20px",
  },
  arrow: {
    marginLeft: "auto",
    fontSize: "12px",
  },
  subMenu: {
    marginLeft: "35px",
    marginTop: "5px",
    marginBottom: "10px",
  },
  subItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    color: "#d1d5db",
    textDecoration: "none",
    borderRadius: "6px",
    transition: "all 0.2s",
    marginBottom: "2px",
    ":hover": {
      backgroundColor: "rgba(255,255,255,0.08)",
      color: "#ffffff",
    },
  },
  subIcon: {
    fontSize: "12px",
    minWidth: "16px",
  },
  userSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 10px 10px 10px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    marginTop: "10px",
  },
  userName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
  },
  userRole: {
    fontSize: "11px",
    color: "#9ca3af",
    textTransform: "uppercase",
    marginTop: "4px",
  },
  userDept: {
    fontSize: "10px",
    color: "#6b7280",
    marginTop: "2px",
  },
  logout: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#dc2626",
      transform: "scale(1.05)",
    },
  },
};

export default NavBar;