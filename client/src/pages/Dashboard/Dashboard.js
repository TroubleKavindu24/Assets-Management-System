import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [counts, setCounts] = useState({
    totalAllocations: 0,
    availablePrinters: 0,
    availableMachines: 0,
    availableLaptops: 0,
    totalAssets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fetch dashboard statistics
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all allocations
        const allocationsRes = await axios.get("http://localhost:5005/api/assets/getAllAllocations");
        let allocations = [];
        
        // Handle different response structures
        if (Array.isArray(allocationsRes.data)) {
          allocations = allocationsRes.data;
        } else if (allocationsRes.data.data && Array.isArray(allocationsRes.data.data)) {
          allocations = allocationsRes.data.data;
        } else if (allocationsRes.data.allocations && Array.isArray(allocationsRes.data.allocations)) {
          allocations = allocationsRes.data.allocations;
        } else {
          allocations = [];
        }
        
        const totalAllocations = allocations.length;

        // Fetch all assets
        const assetsRes = await axios.get("http://localhost:5005/api/assets/assetsList");
        let assets = [];
        
        // Handle different response structures
        if (Array.isArray(assetsRes.data)) {
          assets = assetsRes.data;
        } else if (assetsRes.data.data && Array.isArray(assetsRes.data.data)) {
          assets = assetsRes.data.data;
        } else if (assetsRes.data.assets && Array.isArray(assetsRes.data.assets)) {
          assets = assetsRes.data.assets;
        } else {
          assets = [];
        }
        
        const totalAssets = assets.length;

        // Count available assets by type
        const availablePrinters = assets.filter(
          asset => asset.asset_type === "Printer" && asset.status === "AVAILABLE"
        ).length;
        
        const availableMachines = assets.filter(
          asset => asset.asset_type === "Machine" && asset.status === "AVAILABLE"
        ).length;
        
        const availableLaptops = assets.filter(
          asset => asset.asset_type === "Laptop" && asset.status === "AVAILABLE"
        ).length;

        setCounts({
          totalAllocations,
          availablePrinters,
          availableMachines,
          availableLaptops,
          totalAssets,
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        console.error("Error response:", err.response);
        setError(err.response?.data?.message || "Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Navigate to allocations page
  const handleViewAllocations = () => {
    navigate("/allocate-list");
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorMessage}>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <p style={styles.subtitle}>Welcome to Asset Management System</p>
      </div>

      {/* Stats Grid */}
      <div style={styles.statsGrid}>
        {/* Total Assets Card */}
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.cardNumber}>{counts.totalAssets}</div>
            <div style={styles.cardLabel}>Total Assets</div>
          </div>
        </div>

        {/* Allocations Card with Click */}
        <div 
          style={{...styles.card, ...styles.clickableCard}} 
          onClick={handleViewAllocations}
        >
          <div style={styles.cardContent}>
            <div style={styles.cardNumber}>{counts.totalAllocations}</div>
            <div style={styles.cardLabel}>Total Allocations</div>
            <div style={styles.cardLink}>View All →</div>
          </div>
        </div>

        {/* Available Laptops Card */}
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.cardNumber}>{counts.availableLaptops}</div>
            <div style={styles.cardLabel}>Available Laptops</div>
            {counts.availableLaptops === 0 && (
              <div style={styles.warningText}>No laptops available</div>
            )}
          </div>
        </div>

        {/* Available Machines Card */}
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.cardNumber}>{counts.availableMachines}</div>
            <div style={styles.cardLabel}>Available Machines</div>
            {counts.availableMachines === 0 && (
              <div style={styles.warningText}>No machines available</div>
            )}
          </div>
        </div>

        {/* Available Printers Card */}
        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.cardNumber}>{counts.availablePrinters}</div>
            <div style={styles.cardLabel}>Available Printers</div>
            {counts.availablePrinters === 0 && (
              <div style={styles.warningText}>No printers available</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div style={styles.recentSection}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionButtons}>
          <button 
            style={styles.actionButton}
            onClick={() => navigate("/assetForm")}
          >
            + Add New Asset
          </button>
          <button 
            style={styles.actionButton}
            onClick={() => navigate("/allocate-form")}
          >
          Allocate Asset
          </button>
          <button 
            style={styles.actionButton}
            onClick={() => navigate("/assets-list")}
          >
          View All Assets
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "30px",
  },
  title: {
    color: "#1f2937",
    fontSize: "32px",
    marginBottom: "10px",
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "16px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "40px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "20px",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "default",
  },
  clickableCard: {
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    position: "relative",
    overflow: "hidden",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
  },
  cardIcon: {
    fontSize: "48px",
  },
  cardContent: {
    flex: 1,
  },
  cardNumber: {
    fontSize: "36px",
    fontWeight: "bold",
    color: "#3b82f6",
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "8px",
  },
  cardLink: {
    fontSize: "12px",
    color: "#3b82f6",
    marginTop: "8px",
    textDecoration: "underline",
  },
  warningText: {
    fontSize: "12px",
    color: "#ef4444",
    marginTop: "5px",
  },
  recentSection: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    color: "#1f2937",
    fontSize: "20px",
    marginBottom: "20px",
  },
  actionButtons: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap",
  },
  actionButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "12px 24px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s",
    ":hover": {
      backgroundColor: "#2563eb",
    },
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
  },
  loader: {
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    animation: "spin 1s linear infinite",
  },
  errorContainer: {
    textAlign: "center",
    padding: "60px",
  },
  errorMessage: {
    color: "#ef4444",
    marginBottom: "20px",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

export default Dashboard;