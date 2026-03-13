import React, { useEffect, useState } from "react";
import axios from "axios";

const AssetsList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all assets from backend
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5005/api/assets/assetsList"); // <-- replace with your backend route
      setAssets(response.data.data); // your controller sends { count, data }
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

  if (loading) return <p>Loading assets...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>All Assets</h2>
      {assets.length === 0 ? (
        <p>No assets found.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Serial No</th>
              <th>Brand</th>
              <th>OS</th>
              <th>Purchase Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td>{asset.id}</td>
                <td>{asset.asset_type}</td>
                <td>{asset.serial_no}</td>
                <td>{asset.brand || "-"}</td>
                <td>{asset.os || "-"}</td>
                <td>{new Date(asset.purchase_date).toLocaleDateString()}</td>
                <td>{asset.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AssetsList;