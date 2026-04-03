import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";

import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

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
import Footer from "./components/Footer";

const AppContent = () => {
  const { loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <NavBar />
      <div style={styles.mainContent}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assetForm"
            element={
              <ProtectedRoute>
                <AddAssetForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocate-form"
            element={
              <ProtectedRoute>
                <AllocateAssetForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/allocate-list"
            element={
              <ProtectedRoute>
                <AllocateList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispose-list"
            element={
              <ProtectedRoute>
                <DisposePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/req-asset"
            element={
              <ProtectedRoute>
                <AssetRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assets-list"
            element={
              <ProtectedRoute>
                <AssetsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <ProtectedRoute>
                <RegisterPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rolemanagement"
            element={
              <ProtectedRoute>
                <RoleManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/permissions"
            element={
              <ProtectedRoute>
                <PermissionManagement />
              </ProtectedRoute>
            }
          />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const styles = {
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
  mainContent: {
    marginLeft: "260px", // Same width as sidebar
    padding: "20px",
    minHeight: "100vh",
    backgroundColor: "#f5f5f5",
  },
};

// Add spin animation for loader
const spinStyles = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

export default App;