import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";

import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";

import Dashboard from "./pages/Dashboard/Dashboard";
import AddAssetForm from "./pages/AddAssets/AddAssetForm";
import AllocateAssetForm from "./pages/Allocation/AllocateAssetForm";
import AllocateList from "./pages/Allocation/AllocationList";
import AssetRequest from "./pages/AssetsList/AssetRequestForm";
import AssetsList from "./pages/AssetsList/AssetsList";
import RoleManagement from "./pages/Role_management/roleManagement";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import PermissionManagement from "./pages/PermissionManagement/PermissionManagement";
import DisposePage from "./pages/Dispose/DisposedAssets";

const AppContent = () => {
  const { loading } = useContext(AuthContext);
  const location = useLocation();
  
  // Check if current page is login page
  const isLoginPage = location.pathname === "/login";
  
  // Don't show footer on login page
  const showFooter = !isLoginPage;

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      <NavBar />
      <div style={{
        ...styles.mainContent,
        marginLeft: isLoginPage ? "0" : "260px",
      }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/assetForm" element={<ProtectedRoute><AddAssetForm /></ProtectedRoute>} />
          <Route path="/allocate-form" element={<ProtectedRoute><AllocateAssetForm /></ProtectedRoute>} />
          <Route path="/allocate-list" element={<ProtectedRoute><AllocateList /></ProtectedRoute>} />
          <Route path="/dispose-list" element={<ProtectedRoute><DisposePage /></ProtectedRoute>} />
          <Route path="/req-asset" element={<ProtectedRoute><AssetRequest /></ProtectedRoute>} />
          <Route path="/assets-list" element={<ProtectedRoute><AssetsList /></ProtectedRoute>} />
          <Route path="/register" element={<ProtectedRoute><RegisterPage /></ProtectedRoute>} />
          <Route path="/rolemanagement" element={<ProtectedRoute><RoleManagement /></ProtectedRoute>} />
          <Route path="/permissions" element={<ProtectedRoute><PermissionManagement /></ProtectedRoute>} />
        </Routes>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

const styles = {
  appWrapper: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  mainContent: {
    flex: 1,
    padding: "20px",
    backgroundColor: "#f5f5f5",
    transition: "margin-left 0.3s ease",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
  },
  loader: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3498db",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
};

export default App;