// src/components/DisposeAssetModal.jsx
import React, { useState } from 'react';
import '../pages/AssetsList/Modal.css';

const DisposeAssetModal = ({ isOpen, onClose, asset, onDisposeSuccess }) => {
  const [selectedLocation, setSelectedLocation] = useState('');
  const [disposeReason, setDisposeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const locations = ['Boralla', 'Location2', 'Location3'];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
      setError('Please select a disposal location');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5005/api/assets/asset-dispose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: asset?.asset_id,
          serial_no: asset?.serial_no,
          disposed_location: selectedLocation,
          disposed_reason: disposeReason || null,
          disposed_by: loggedInUser.username || loggedInUser.name || 'System Admin'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Disposal failed');
      }

      setMessage('Asset disposed successfully!');
      setTimeout(() => {
        onDisposeSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Dispose Asset</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Asset Serial Number</label>
              <input
                type="text"
                value={asset?.serial_no || ''}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-group">
              <label>Asset Type</label>
              <input
                type="text"
                value={asset?.asset_type || ''}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <input
                type="text"
                value={asset?.status || ''}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-group">
              <label>Disposal Location *</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                required
                className="form-control"
              >
                <option value="">Select Disposal Location</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Disposal Reason (Optional)</label>
              <textarea
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                placeholder="Enter reason for disposal (e.g., Damaged, Obsolete, Lost)"
                rows="3"
                className="form-control"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : 'Confirm Disposal'}
              </button>
              <button type="button" onClick={onClose} className="cancel-btn">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DisposeAssetModal;