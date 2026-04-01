// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    // Total assets by type
    totalLaptops: 0,
    totalPrinters: 0,
    totalMachines: 0,
    totalOther: 0,
    totalAssets: 0,
    
    // Allocated assets by type
    allocatedLaptops: 0,
    allocatedPrinters: 0,
    allocatedMachines: 0,
    allocatedOther: 0,
    totalAllocated: 0,
    
    // Available assets by type
    availableLaptops: 0,
    availablePrinters: 0,
    availableMachines: 0,
    availableOther: 0,
    totalAvailable: 0,
    
    // Handover/Returned assets
    handoverLaptops: 0,
    handoverPrinters: 0,
    handoverMachines: 0,
    handoverOther: 0,
    totalHandover: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all assets
        const assetsRes = await axios.get("http://localhost:5005/api/assets/assetsList");
        let assets = [];
        
        if (Array.isArray(assetsRes.data)) {
          assets = assetsRes.data;
        } else if (assetsRes.data.data && Array.isArray(assetsRes.data.data)) {
          assets = assetsRes.data.data;
        } else {
          assets = [];
        }
        
        // Fetch all allocations
        const allocationsRes = await axios.get("http://localhost:5005/api/assets/getAllAllocations");
        let allocations = [];
        
        if (Array.isArray(allocationsRes.data)) {
          allocations = allocationsRes.data;
        } else if (allocationsRes.data.data && Array.isArray(allocationsRes.data.data)) {
          allocations = allocationsRes.data.data;
        } else {
          allocations = [];
        }
        
        // Calculate statistics
        const totalLaptops = assets.filter(a => a.asset_type === "Laptop").length;
        const totalPrinters = assets.filter(a => a.asset_type === "Printer").length;
        const totalMachines = assets.filter(a => a.asset_type === "Machine").length;
        const totalOther = assets.filter(a => a.asset_type === "Other").length;
        const totalAssets = assets.length;
        
        const allocatedLaptops = assets.filter(a => a.asset_type === "Laptop" && a.status === "ALLOCATED").length;
        const allocatedPrinters = assets.filter(a => a.asset_type === "Printer" && a.status === "ALLOCATED").length;
        const allocatedMachines = assets.filter(a => a.asset_type === "Machine" && a.status === "ALLOCATED").length;
        const allocatedOther = assets.filter(a => a.asset_type === "Other" && a.status === "ALLOCATED").length;
        const totalAllocated = allocatedLaptops + allocatedPrinters + allocatedMachines + allocatedOther;
        
        const availableLaptops = assets.filter(a => a.asset_type === "Laptop" && a.status === "AVAILABLE").length;
        const availablePrinters = assets.filter(a => a.asset_type === "Printer" && a.status === "AVAILABLE").length;
        const availableMachines = assets.filter(a => a.asset_type === "Machine" && a.status === "AVAILABLE").length;
        const availableOther = assets.filter(a => a.asset_type === "Other" && a.status === "AVAILABLE").length;
        const totalAvailable = availableLaptops + availablePrinters + availableMachines + availableOther;
        
        const handoverLaptops = assets.filter(a => a.asset_type === "Laptop" && a.status === "AVAILABLE").length;
        const handoverPrinters = assets.filter(a => a.asset_type === "Printer" && a.status === "AVAILABLE").length;
        const handoverMachines = assets.filter(a => a.asset_type === "Machine" && a.status === "AVAILABLE").length;
        const handoverOther = assets.filter(a => a.asset_type === "Other" && a.status === "AVAILABLE").length;
        const totalHandover = handoverLaptops + handoverPrinters + handoverMachines + handoverOther;
        
        setStats({
          totalLaptops, totalPrinters, totalMachines, totalOther, totalAssets,
          allocatedLaptops, allocatedPrinters, allocatedMachines, allocatedOther, totalAllocated,
          availableLaptops, availablePrinters, availableMachines, availableOther, totalAvailable,
          handoverLaptops, handoverPrinters, handoverMachines, handoverOther, totalHandover,
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.message || "Failed to fetch dashboard data");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Prepare data for pie chart
  const pieData = [
    { name: 'Allocated', value: stats.totalAllocated, color: '#f59e0b' },
    { name: 'Available', value: stats.totalAvailable, color: '#10b981' },
    { name: 'Under Repair', value: stats.totalAssets - stats.totalAllocated - stats.totalAvailable, color: '#ef4444' },
  ];

  const COLORS = ['#f59e0b', '#10b981', '#ef4444'];

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
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Asset Management System Overview</p>
        </div>
        <div style={styles.dateTime}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>📊</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAssets}</div>
            <div style={styles.summaryLabel}>Total Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>🟡</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAllocated}</div>
            <div style={styles.summaryLabel}>Allocated Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>🟢</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAvailable}</div>
            <div style={styles.summaryLabel}>Available Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryIcon}>🔄</div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalHandover}</div>
            <div style={styles.summaryLabel}>Handover Assets</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Pie Chart Section */}
        <div style={styles.chartSection}>
          <h2 style={styles.sectionTitle}>Asset Status Distribution</h2>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Total Assets Section */}
        <div style={styles.statsSection}>
          <h2 style={styles.sectionTitle}>Total Assets</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>💻</div>
              <div style={styles.statNumber}>{stats.totalLaptops}</div>
              <div style={styles.statLabel}>Laptops</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🖨️</div>
              <div style={styles.statNumber}>{stats.totalPrinters}</div>
              <div style={styles.statLabel}>Printers</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>⚙️</div>
              <div style={styles.statNumber}>{stats.totalMachines}</div>
              <div style={styles.statLabel}>Machines</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>📦</div>
              <div style={styles.statNumber}>{stats.totalOther}</div>
              <div style={styles.statLabel}>Others</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Status Grid */}
      <div style={styles.statusGrid}>
        {/* Allocated Section */}
        <div style={styles.statusCard}>
          <div style={{...styles.statusHeader, backgroundColor: '#fef3c7'}}>
            <span style={styles.statusIcon}>🟡</span>
            <h3 style={styles.statusTitle}>Allocated Assets</h3>
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusRow}>
              <span>Laptops</span>
              <strong>{stats.allocatedLaptops}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Printers</span>
              <strong>{stats.allocatedPrinters}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Machines</span>
              <strong>{stats.allocatedMachines}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Others</span>
              <strong>{stats.allocatedOther}</strong>
            </div>
            <div style={styles.statusTotal}>
              <span>Total Allocated</span>
              <strong>{stats.totalAllocated}</strong>
            </div>
          </div>
        </div>

        {/* Available Section */}
        <div style={styles.statusCard}>
          <div style={{...styles.statusHeader, backgroundColor: '#d1fae5'}}>
            <span style={styles.statusIcon}>🟢</span>
            <h3 style={styles.statusTitle}>Available Assets</h3>
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusRow}>
              <span>Laptops</span>
              <strong>{stats.availableLaptops}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Printers</span>
              <strong>{stats.availablePrinters}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Machines</span>
              <strong>{stats.availableMachines}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Others</span>
              <strong>{stats.availableOther}</strong>
            </div>
            <div style={styles.statusTotal}>
              <span>Total Available</span>
              <strong>{stats.totalAvailable}</strong>
            </div>
          </div>
        </div>

        {/* Handover Section */}
        <div style={styles.statusCard}>
          <div style={{...styles.statusHeader, backgroundColor: '#e0e7ff'}}>
            <span style={styles.statusIcon}>🔄</span>
            <h3 style={styles.statusTitle}>Handover Assets</h3>
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusRow}>
              <span>Laptops</span>
              <strong>{stats.handoverLaptops}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Printers</span>
              <strong>{stats.handoverPrinters}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Machines</span>
              <strong>{stats.handoverMachines}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Others</span>
              <strong>{stats.handoverOther}</strong>
            </div>
            <div style={styles.statusTotal}>
              <span>Total Handover</span>
              <strong>{stats.totalHandover}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.actionsSection}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionButtons}>
          <button style={styles.actionButton} onClick={() => navigate("/add-asset")}>
            ➕ Add New Asset
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/allocate-asset")}>
            📤 Allocate Asset
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/assets-list")}>
            📋 View All Assets
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/allocations")}>
            📊 View Allocations
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: "#f3f4f6",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: "16px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "8px",
  },
  dateTime: {
    fontSize: "14px",
    color: "#6b7280",
    backgroundColor: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "20px",
    marginBottom: "32px",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
  },
  summaryIcon: {
    fontSize: "40px",
  },
  summaryContent: {
    flex: 1,
  },
  summaryNumber: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#3b82f6",
    lineHeight: 1,
  },
  summaryLabel: {
    fontSize: "14px",
    color: "#6b7280",
    marginTop: "4px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  chartSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  chartContainer: {
    height: "300px",
    marginTop: "16px",
  },
  statsSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
    gap: "16px",
  },
  statCard: {
    textAlign: "center",
    padding: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    transition: "transform 0.2s",
    cursor: "pointer",
    ":hover": {
      transform: "translateY(-2px)",
    },
  },
  statIcon: {
    fontSize: "32px",
    marginBottom: "8px",
  },
  statNumber: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#3b82f6",
  },
  statLabel: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    marginBottom: "32px",
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  statusHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
  },
  statusIcon: {
    fontSize: "20px",
  },
  statusTitle: {
    fontSize: "16px",
    fontWeight: "600",
    margin: 0,
    color: "#111827",
  },
  statusContent: {
    padding: "20px",
  },
  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: "14px",
    color: "#4b5563",
  },
  statusTotal: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0 0 0",
    marginTop: "8px",
    borderTop: "2px solid #e5e7eb",
    fontWeight: "600",
    fontSize: "16px",
    color: "#111827",
  },
  actionsSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  actionButtons: {
    display: "flex",
    gap: "16px",
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
    transition: "all 0.2s",
    ":hover": {
      backgroundColor: "#2563eb",
      transform: "translateY(-1px)",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
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

// Add this to your global CSS or component
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;