// src/components/AssetList.jsx
import React, { useState, useEffect } from 'react';
import './AssetList.css';

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/assets/assetsList');
      const data = await response.json();
      
      if (response.ok) {
        setAssets(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch assets');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'ALLOCATED': return 'status-allocated';
      case 'UNDER_REPAIR': return 'status-repair';
      case 'RETIRED': return 'status-retired';
      default: return '';
    }
  };

  if (loading) return <div className="loading">Loading assets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="asset-list-container">
      <div className="list-header">
        <h2>Asset Inventory</h2>
        <button onClick={fetchAssets} className="refresh-btn">Refresh</button>
      </div>

      {assets.length === 0 ? (
        <div className="no-data">No assets found. Add some assets first!</div>
      ) : (
        <div className="table-responsive">
          <table className="asset-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Serial No</th>
                <th>Type</th>
                <th>Brand</th>
                <th>OS</th>
                <th>Status</th>
                <th>Purchase Date</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.asset_id}>
                  <td>{asset.asset_id}</td>
                  <td><strong>{asset.serial_no}</strong></td>
                  <td>{asset.asset_type}</td>
                  <td>{asset.brand}</td>
                  <td>{asset.os}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AssetList;