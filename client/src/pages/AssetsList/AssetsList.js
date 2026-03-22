import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const AssetsList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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
    <div>
      <h2>All Assets</h2>

      {assets.length === 0 ? (
        <p>No assets found.</p>
      ) : (
        <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Serial No</th>
              <th>Brand</th>
              <th>OS</th>
              <th>Purchase Date</th>
              <th>Status</th>
              <th>Action</th> {/* ✅ New Column */}
            </tr>
          </thead>

          <tbody>
            {assets.map((asset) => (
              <tr key={asset.asset_id}> {/* ✅ FIXED (was asset.id) */}
                <td>{asset.asset_id}</td>
                <td>{asset.asset_type}</td>
                <td>{asset.serial_no}</td>
                <td>{asset.brand || "-"}</td>
                <td>{asset.os || "-"}</td>
                <td>
                  {asset.purchase_date
                    ? new Date(asset.purchase_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{asset.status}</td>

                <td>
                  <button
                    onClick={() => handleAllocate(asset)}
                    disabled={asset.status !== "AVAILABLE"} // ✅ Only enable if AVAILABLE
                    style={{
                      backgroundColor:
                        asset.status === "AVAILABLE" ? "#22c55e" : "#9ca3af",
                      color: "white",
                      border: "none",
                      padding: "6px 12px",
                      cursor:
                        asset.status === "AVAILABLE" ? "pointer" : "not-allowed",
                      borderRadius: "4px",
                    }}
                  >
                    Allocate
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssetsList;