import React, { useContext, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Logo from "../assets/Logo1.png";
import {
  FaHome,
  FaBox,
  FaUsers,
  FaCog,
  FaChevronDown,
  FaSignOutAlt,
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

  if (location.pathname === "/login") return null;

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logoContainer}>
        <img src={Logo} alt="logo" style={styles.logo} />
        {/* <h3 style={styles.title}>AssetMaster</h3>
        <span style={styles.subtitle}>Management System</span> */}
      </div>

      {/* Menu */}
      <div style={styles.menu}>
        <NavItem to="/" icon={<FaHome />} label="Dashboard" />

        {/* Assets */}
        <div>
          <div style={styles.menuItem} onClick={() => toggleMenu("assets")}>
            <span style={styles.icon}><FaBox /></span>
            Assets
            <FaChevronDown style={styles.arrow} />
          </div>

          {openMenu === "assets" && (
            <div style={styles.subMenu}>
              <SubItem to="/assetForm" label="Add Asset" />
              <SubItem to="/allocate-form" label="Allocate Asset" />
              <SubItem to="/assets-list" label="Asset List" />
              <SubItem to="/allocate-list" label="Allocate Assets" />
              <SubItem to="/dispose-list" label="Disposed Assets" />
            </div>
          )}
        </div>

        {/* Manage */}
        {user?.role === "SUPER_ADMIN" && (
          <div>
            <div style={styles.menuItem} onClick={() => toggleMenu("manage")}>
              <span style={styles.icon}><FaUsers /></span>
              Manage
              <FaChevronDown style={styles.arrow} />
            </div>

            {openMenu === "manage" && (
              <div style={styles.subMenu}>
                <SubItem to="/register" label="User Register" />
                <SubItem to="/rolemanagement" label="Roles" />
                <SubItem to="/permissions" label="Permissions" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* User */}
      <div style={styles.userSection}>
        <div>
          <div style={styles.userName}>{user?.user_name}</div>
          <div style={styles.userRole}>{user?.role}</div>
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

const SubItem = ({ to, label }) => (
  <Link to={to} style={styles.subItem}>
    {label}
  </Link>
);

const styles = {
  sidebar: {
    width: "250px",
    height: "100vh",
    background: "#020930e3",
    borderRight: "1px solid #e5e7eb",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "fixed",
    padding: "20px 10px",
  },

  logoContainer: {
    textAlign: "center",
    marginBottom: "20px",
  },

  logo: {
    width: "150px",
    marginBottom: "10px",
  },

  title: {
    fontSize: "16px",
    fontWeight: "700",
    margin: 0,
  },

  subtitle: {
    fontSize: "12px",
    color: "#6b7280",
  },

  menu: {
    flex: 1,
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    borderRadius: "8px",
    color: "#ffffffff",
    textDecoration: "none",
    cursor: "pointer",
    fontSize: "14px",
    marginBottom: "5px",
  },

  icon: {
    fontSize: "16px",
  },

  arrow: {
    marginLeft: "auto",
    fontSize: "12px",
  },

  subMenu: {
    marginLeft: "30px",
    marginTop: "5px",
  },

  subItem: {
    display: "block",
    padding: "8px",
    fontSize: "13px",
    color: "#ffffffff",
    textDecoration: "none",
    borderRadius: "6px",
  },

  userSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px",
    borderTop: "1px solid #e5e7eb",
  },

  userName: {
    fontSize: "14px",
    fontWeight: "600",
  },

  userRole: {
    fontSize: "12px",
    color: "#9ca3af",
  },

  logout: {
    background: "#ef4444",
    border: "none",
    color: "white",
    padding: "8px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default NavBar;