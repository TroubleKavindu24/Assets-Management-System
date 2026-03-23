import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const AssetsList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check if user has permission to allocate (ADMIN or SUPER_ADMIN)
  const canAllocate = user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN");

  // Fetch all assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5005/api/assets/assetsList");
      setAssets(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to fetch assets");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // Handle Allocate Button Click
  const handleAllocate = (asset) => {
    navigate("/allocate-form", {
      state: { asset }  // pass asset data
    });
  };

  if (loading) return <p>Loading assets...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>All Assets</h2>
        {user && (
          <div style={styles.userRole}>
            Logged in as: <strong>{user.user_name}</strong> ({user.role})
          </div>
        )}
      </div>

      {assets.length === 0 ? (
        <p>No assets found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Serial No</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>OS</th>
                <th style={styles.th}>Purchase Date</th>
                <th style={styles.th}>Status</th>
                {/* Action column only visible for ADMIN/SUPER_ADMIN */}
                {canAllocate && <th style={styles.th}>Action</th>}
              </tr>
            </thead>

            <tbody>
              {assets.map((asset) => (
                <tr key={asset.asset_id} style={styles.row}>
                  <td style={styles.td}>{asset.asset_type}</td>
                  <td style={styles.td}>{asset.serial_no}</td>
                  <td style={styles.td}>{asset.brand || "-"}</td>
                  <td style={styles.td}>{asset.os || "-"}</td>
                  <td style={styles.td}>
                    {asset.purchase_date
                      ? new Date(asset.purchase_date).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...(asset.status === "AVAILABLE"
                          ? styles.statusAvailable
                          : asset.status === "ALLOCATED"
                          ? styles.statusAllocated
                          : styles.statusMaintenance),
                      }}
                    >
                      {asset.status}
                    </span>
                  </td>
                  
                  {/* Action column only visible for ADMIN/SUPER_ADMIN */}
                  {canAllocate && (
                    <td style={styles.td}>
                      <button
                        onClick={() => handleAllocate(asset)}
                        disabled={asset.status !== "AVAILABLE"}
                        style={{
                          ...styles.allocateButton,
                          ...(asset.status === "AVAILABLE"
                            ? styles.buttonEnabled
                            : styles.buttonDisabled),
                        }}
                        onMouseEnter={(e) => {
                          if (asset.status === "AVAILABLE") {
                            e.target.style.backgroundColor = "#16a34a";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (asset.status === "AVAILABLE") {
                            e.target.style.backgroundColor = "#22c55e";
                          }
                        }}
                      >
                        {asset.status === "AVAILABLE" ? "Allocate" : "Not Available"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Show message for STAFF users */}
      {user && user.role === "STAFF" && (
        <div style={styles.infoMessage}>
          <p>📋 You are viewing as STAFF member. Allocation actions are disabled for your role.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  userRole: {
    padding: "8px 16px",
    backgroundColor: "#f3f4f6",
    borderRadius: "6px",
    fontSize: "14px",
  },
  tableWrapper: {
    overflowX: "auto",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: "white",
    borderRadius: "8px",
    overflow: "hidden",
  },
  headerRow: {
    backgroundColor: "#2c3e50",
    color: "white",
  },
  th: {
    padding: "12px",
    textAlign: "left",
    fontWeight: "600",
    borderBottom: "2px solid #e5e7eb",
  },
  row: {
    borderBottom: "1px solid #e5e7eb",
    transition: "background-color 0.2s",
  },
  td: {
    padding: "12px",
    textAlign: "left",
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "500",
    display: "inline-block",
  },
  statusAvailable: {
    backgroundColor: "#d1fae5",
    color: "#065f46",
  },
  statusAllocated: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusMaintenance: {
    backgroundColor: "#fef3c7",
    color: "#92400e",
  },
  allocateButton: {
    border: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: "500",
    transition: "background-color 0.2s",
  },
  buttonEnabled: {
    backgroundColor: "#22c55e",
    color: "white",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    color: "#e5e7eb",
    cursor: "not-allowed",
  },
  infoMessage: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#e0f2fe",
    borderLeft: "4px solid #0284c7",
    borderRadius: "4px",
    color: "#0c4a6e",
  },
};

export default AssetsList;