import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

const AllocationList = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user } = useContext(AuthContext);

  // Fetch all allocations
  const fetchAllocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5005/api/assets/getAllAllocations");
      setAllocations(response.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch allocations");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  // Handle return asset
  const handleReturnAsset = async (allocationId, assetId) => {
    if (window.confirm("Are you sure you want to mark this asset as returned?")) {
      try {
        await axios.put(`http://localhost:5005/api/assets/return-asset/${allocationId}`, {
          asset_id: assetId,
          return_date: new Date().toISOString().split("T")[0]
        });
        alert("Asset returned successfully!");
        fetchAllocations(); // Refresh the list
      } catch (err) {
        console.error(err);
        alert(err.response?.data?.message || "Failed to return asset");
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loader}></div>
        <p>Loading allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorMessage}>{error}</p>
        <button onClick={fetchAllocations} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Asset Allocations</h1>
        {user && (
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.user_name}</span>
            <span style={styles.userRole}>({user.role})</span>
          </div>
        )}
      </div>

      {/* Allocations Table */}
      {allocations.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No allocations found</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Serial No</th>
                <th style={styles.th}>Department</th>
                <th style={styles.th}>IP Address</th>
                <th style={styles.th}>Allocated By</th>
                <th style={styles.th}>Allocated Date</th>
                <th style={styles.th}>Return Date</th>
                {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                  <th style={styles.th}>Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {allocations.map((item) => (
                <tr key={item.allocation_id} style={styles.row}>
                  <td style={styles.td}>
                    <code style={styles.serialCode}>{item.serial_no || "-"}</code>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.departmentBadge}>{item.department_id}</span>
                  </td>
                  <td style={styles.td}>
                    <code style={styles.ipAddress}>{item.ip_address || "-"}</code>
                  </td>
                  <td style={styles.td}>{item.allocated_by}</td>
                  <td style={styles.td}>{formatDate(item.allocated_date)}</td>
                  <td style={styles.td}>
                    {item.return_date ? formatDate(item.return_date) : "-"}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(item.return_date ? styles.statusReturned : styles.statusActive),
                      }}
                    >
                      {item.return_date ? "ALLOCATED" : "ACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    flexWrap: "wrap",
  },
  title: {
    color: "#1f2937",
    fontSize: "28px",
    margin: 0,
  },
  userInfo: {
    padding: "8px 16px",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  userName: {
    fontWeight: "bold",
    color: "#3b82f6",
  },
  userRole: {
    marginLeft: "8px",
    color: "#6b7280",
    fontSize: "14px",
  },
  tableWrapper: {
    overflowX: "auto",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  headerRow: {
    backgroundColor: "#1f2937",
    color: "white",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    fontSize: "14px",
  },
  row: {
    borderBottom: "1px solid #e5e7eb",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "12px",
    fontSize: "14px",
  },
  serialCode: {
    backgroundColor: "#f3f4f6",
    padding: "4px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
  },
  ipAddress: {
    backgroundColor: "#f3f4f6",
    padding: "4px 6px",
    borderRadius: "4px",
    fontFamily: "monospace",
    fontSize: "12px",
  },
  departmentBadge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
  },
  statusActive: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusReturned: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  returnButton: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  returnedText: {
    color: "#10b981",
    fontWeight: "500",
    fontSize: "12px",
  },
  emptyState: {
    textAlign: "center",
    padding: "60px",
    backgroundColor: "white",
    borderRadius: "8px",
    color: "#6b7280",
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

export default AllocationList;