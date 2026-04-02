// src/components/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  FaBoxes, FaUserCheck, FaCheckCircle, FaExchangeAlt,
  FaLaptop, FaPrint, FaMicrochip, FaBox, FaTrash,
  FaPlus, FaShare, FaList, FaChartLine, FaEye, FaHome
} from 'react-icons/fa';

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
    
    // Disposed assets
    disposedLaptops: 0,
    disposedPrinters: 0,
    disposedMachines: 0,
    disposedOther: 0,
    totalDisposed: 0,
    
    // Disposed by location
    disposedBoralla: 0,
    disposedLocation2: 0,
    disposedLocation3: 0,
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
        
        // Fetch disposed assets
        const disposedRes = await axios.get("http://localhost:5005/api/assets/disposed-assets");
        let disposedAssets = [];
        
        if (disposedRes.data.success && Array.isArray(disposedRes.data.data)) {
          disposedAssets = disposedRes.data.data;
        } else if (Array.isArray(disposedRes.data)) {
          disposedAssets = disposedRes.data;
        } else {
          disposedAssets = [];
        }
        
        // Calculate statistics for active assets
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
        
        // Calculate disposed statistics
        const disposedLaptops = disposedAssets.filter(a => a.asset_type === "Laptop").length;
        const disposedPrinters = disposedAssets.filter(a => a.asset_type === "Printer").length;
        const disposedMachines = disposedAssets.filter(a => a.asset_type === "Machine").length;
        const disposedOther = disposedAssets.filter(a => a.asset_type === "Other").length;
        const totalDisposed = disposedAssets.length;
        
        // Calculate disposed by location
        const disposedBoralla = disposedAssets.filter(a => a.disposed_location === "Boralla").length;
        const disposedLocation2 = disposedAssets.filter(a => a.disposed_location === "Location2").length;
        const disposedLocation3 = disposedAssets.filter(a => a.disposed_location === "Location3").length;
        
        setStats({
          totalLaptops, totalPrinters, totalMachines, totalOther, totalAssets,
          allocatedLaptops, allocatedPrinters, allocatedMachines, allocatedOther, totalAllocated,
          availableLaptops, availablePrinters, availableMachines, availableOther, totalAvailable,
          handoverLaptops, handoverPrinters, handoverMachines, handoverOther, totalHandover,
          disposedLaptops, disposedPrinters, disposedMachines, disposedOther, totalDisposed,
          disposedBoralla, disposedLocation2, disposedLocation3,
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

  // Prepare data for disposed by location bar chart
  const disposedLocationData = [
    { name: 'Boralla', count: stats.disposedBoralla, color: '#ef4444' },
    { name: 'Location2', count: stats.disposedLocation2, color: '#f59e0b' },
    { name: 'Location3', count: stats.disposedLocation3, color: '#8b5cf6' },
  ];

  // Prepare data for asset type distribution
  const assetTypeData = [
    { name: 'Laptops', total: stats.totalLaptops, allocated: stats.allocatedLaptops, available: stats.availableLaptops, disposed: stats.disposedLaptops },
    { name: 'Printers', total: stats.totalPrinters, allocated: stats.allocatedPrinters, available: stats.availablePrinters, disposed: stats.disposedPrinters },
    { name: 'Machines', total: stats.totalMachines, allocated: stats.allocatedMachines, available: stats.availableMachines, disposed: stats.disposedMachines },
    { name: 'Others', total: stats.totalOther, allocated: stats.allocatedOther, available: stats.availableOther, disposed: stats.disposedOther },
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
        <div style={styles.summaryCard} onClick={() => navigate("/assets-list")}>
          <div style={{...styles.summaryIconWrapper, backgroundColor: '#e0e7ff'}}>
            <FaBoxes style={{...styles.summaryIcon, color: '#3b82f6'}} />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAssets}</div>
            <div style={styles.summaryLabel}>Total Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard} onClick={() => navigate("/allocate-list")}>
          <div style={{...styles.summaryIconWrapper, backgroundColor: '#fef3c7'}}>
            <FaUserCheck style={{...styles.summaryIcon, color: '#f59e0b'}} />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAllocated}</div>
            <div style={styles.summaryLabel}>Allocated Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard} onClick={() => navigate("/assets-list")}>
          <div style={{...styles.summaryIconWrapper, backgroundColor: '#d1fae5'}}>
            <FaCheckCircle style={{...styles.summaryIcon, color: '#10b981'}} />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalAvailable}</div>
            <div style={styles.summaryLabel}>Available Assets</div>
          </div>
        </div>
        <div style={styles.summaryCard} onClick={() => navigate("/disposed-assets")}>
          <div style={{...styles.summaryIconWrapper, backgroundColor: '#fee2e2'}}>
            <FaTrash style={{...styles.summaryIcon, color: '#ef4444'}} />
          </div>
          <div style={styles.summaryContent}>
            <div style={styles.summaryNumber}>{stats.totalDisposed}</div>
            <div style={styles.summaryLabel}>Disposed Assets</div>
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

        {/* Disposed by Location Chart */}
        <div style={styles.chartSection}>
          <h2 style={styles.sectionTitle}>Disposed Assets by Location</h2>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disposedLocationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Asset Type Distribution Table */}
      {/* <div style={styles.tableSection}>
        <h2 style={styles.sectionTitle}>Asset Type Distribution</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Asset Type</th>
                <th>Total</th>
                <th>Allocated</th>
                <th>Available</th>
                <th>Disposed</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {assetTypeData.map((item, index) => {
                const utilization = item.total > 0 ? ((item.allocated / item.total) * 100).toFixed(1) : 0;
                return (
                  <tr key={index}>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.total}</td>
                    <td style={{ color: '#f59e0b' }}>{item.allocated}</td>
                    <td style={{ color: '#10b981' }}>{item.available}</td>
                    <td style={{ color: '#ef4444' }}>{item.disposed}</td>
                    <td>
                      <div style={styles.progressBar}>
                        <div style={{...styles.progressFill, width: `${utilization}%`}}></div>
                        <span style={styles.progressText}>{utilization}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Asset Status Grid */}
      <div style={styles.statusGrid}>
        {/* Allocated Section */}
        <div style={styles.statusCard}>
          <div style={{...styles.statusHeader, backgroundColor: '#fef3c7'}}>
            <FaUserCheck style={styles.statusIcon} />
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
            <FaCheckCircle style={styles.statusIcon} />
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

        {/* Disposed Section */}
        <div style={styles.statusCard}>
          <div style={{...styles.statusHeader, backgroundColor: '#fee2e2'}}>
            <FaTrash style={styles.statusIcon} />
            <h3 style={styles.statusTitle}>Disposed Assets</h3>
          </div>
          <div style={styles.statusContent}>
            <div style={styles.statusRow}>
              <span>Laptops</span>
              <strong>{stats.disposedLaptops}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Printers</span>
              <strong>{stats.disposedPrinters}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Machines</span>
              <strong>{stats.disposedMachines}</strong>
            </div>
            <div style={styles.statusRow}>
              <span>Others</span>
              <strong>{stats.disposedOther}</strong>
            </div>
            <div style={styles.statusTotal}>
              <span>Total Disposed</span>
              <strong>{stats.totalDisposed}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Disposed by Location Summary */}
      {stats.totalDisposed > 0 && (
        <div style={styles.locationSection}>
          <h2 style={styles.sectionTitle}>Disposal Location Summary</h2>
          <div style={styles.locationGrid}>
            <div style={styles.locationCard}>
              <div style={{...styles.locationBadge, backgroundColor: '#fee2e2', color: '#ef4444'}}>
                Boralla
              </div>
              <div style={styles.locationCount}>{stats.disposedBoralla}</div>
              <div style={styles.locationLabel}>Assets Disposed</div>
            </div>
            <div style={styles.locationCard}>
              <div style={{...styles.locationBadge, backgroundColor: '#fef3c7', color: '#f59e0b'}}>
                Location2
              </div>
              <div style={styles.locationCount}>{stats.disposedLocation2}</div>
              <div style={styles.locationLabel}>Assets Disposed</div>
            </div>
            <div style={styles.locationCard}>
              <div style={{...styles.locationBadge, backgroundColor: '#e0e7ff', color: '#3b82f6'}}>
                Location3
              </div>
              <div style={styles.locationCount}>{stats.disposedLocation3}</div>
              <div style={styles.locationLabel}>Assets Disposed</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {/* <div style={styles.actionsSection}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionButtons}>
          <button style={styles.actionButton} onClick={() => navigate("/assetForm")}>
            <FaPlus style={{ marginRight: '8px' }} /> Add New Asset
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/allocate-form")}>
            <FaShare style={{ marginRight: '8px' }} /> Allocate Asset
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/assets-list")}>
            <FaList style={{ marginRight: '8px' }} /> View All Assets
          </button>
          <button style={styles.actionButton} onClick={() => navigate("/allocate-list")}>
            <FaChartLine style={{ marginRight: '8px' }} /> View Allocations
          </button>
          <button style={{...styles.actionButton, backgroundColor: '#6b7280'}} onClick={() => navigate("/disposed-assets")}>
            <FaTrash style={{ marginRight: '8px' }} /> View Disposed
          </button>
        </div>
      </div> */}
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
    fontSize: "28px",
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
    ':hover': {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    },
  },
  summaryIconWrapper: {
    width: "56px",
    height: "56px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryIcon: {
    fontSize: "28px",
  },
  summaryContent: {
    flex: 1,
  },
  summaryNumber: {
    fontSize: "28px",
    fontWeight: "bold",
    color: "#111827",
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
  tableSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  tableContainer: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  sectionTitle: {
    fontSize: "18px",
    fontWeight: "600",
    color: "#111827",
    marginBottom: "20px",
  },
  progressBar: {
    position: "relative",
    width: "100px",
    height: "24px",
    backgroundColor: "#e5e7eb",
    borderRadius: "12px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: "12px",
    transition: "width 0.3s",
  },
  progressText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "11px",
    fontWeight: "bold",
    color: "#111827",
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
    color: "#374151",
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
  locationSection: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  locationGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
    marginTop: "16px",
  },
  locationCard: {
    textAlign: "center",
    padding: "20px",
    backgroundColor: "#f9fafb",
    borderRadius: "12px",
  },
  locationBadge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    marginBottom: "12px",
  },
  locationCount: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#111827",
  },
  locationLabel: {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "4px",
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
    display: "inline-flex",
    alignItems: "center",
    ':hover': {
      backgroundColor: "#2563eb",
      transform: "translateY(-1px)",
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
  
  .summary-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .action-button:hover {
    background-color: #2563eb;
    transform: translateY(-1px);
  }
`;
document.head.appendChild(styleSheet);

export default Dashboard;