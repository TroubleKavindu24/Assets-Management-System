// src/components/HandoverAssetModal.jsx
import React, { useState, useEffect } from 'react';
import './Modal.css';

const HandoverAssetModal = ({ isOpen, onClose, asset }) => {

  const token = localStorage.getItem('token');

  const [currentAllocation, setCurrentAllocation] = useState(null);

  const [formData, setFormData] = useState({
    return_date: new Date().toISOString().split('T')[0],
    return_condition: 'Good',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // ================= FETCH CURRENT ALLOCATION =================
  useEffect(() => {
    if (isOpen && asset) {
      fetchCurrentAllocation(asset.serial_no);
    }
  }, [isOpen, asset]);

  const fetchCurrentAllocation = async (serialNo) => {
    setLoadingAllocation(true);
    try {
      const res = await fetch(`http://localhost:5005/api/assets/serial/${serialNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (res.ok && data.allocation) {
        setCurrentAllocation(data.allocation);
      } else {
        setCurrentAllocation(null);
      }

    } catch (err) {
      console.error(err);
      setError('Failed to load allocation');
    } finally {
      setLoadingAllocation(false);
    }
  };

  // ================= HANDLE =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!currentAllocation) {
      setError('No allocation found');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5005/api/assets/asset-handover/${currentAllocation.allocation_id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(formData)
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMessage('Asset returned successfully');

      setTimeout(() => {
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

        {/* HEADER */}
        <div className="modal-header">
          <h2>Asset Return / Handover</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          {/* ================= ASSET INFO ================= */}
          <div className="form-group">
            <label>Serial Number</label>
            <input value={asset?.serial_no} readOnly className="form-control read-only" />
          </div>

          <div className="form-group">
            <label>Asset Type</label>
            <input value={asset?.asset_type} readOnly className="form-control read-only" />
          </div>

          <div className="form-group">
            <label>Brand</label>
            <input value={asset?.brand || 'N/A'} readOnly className="form-control read-only" />
          </div>

          {/* ================= CURRENT ALLOCATION ================= */}
          {loadingAllocation ? (
            <div className="loading-text">Loading allocation...</div>
          ) : currentAllocation ? (
            <div className="info-box">
              <h4>Current Allocation Details</h4>

              <div className="form-group">
                <label>Branch</label>
                <input value={currentAllocation.branch?.location || 'N/A'} readOnly className="form-control read-only" />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input value={currentAllocation.department?.department_name || 'N/A'} readOnly className="form-control read-only" />
              </div>

              <div className="form-group">
                <label>IP Address</label>
                <input value={currentAllocation.ip_address || 'N/A'} readOnly className="form-control read-only" />
              </div>

              <div className="form-group">
                <label>Allocated By</label>
                <input value={currentAllocation.allocated_by || 'N/A'} readOnly className="form-control read-only" />
              </div>
            </div>
          ) : (
            <div className="warning-text">No active allocation found</div>
          )}

          {/* ================= RETURN FORM ================= */}
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Return Date *</label>
              <input
                type="date"
                name="return_date"
                value={formData.return_date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Condition *</label>
              <select
                name="return_condition"
                value={formData.return_condition}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Good">Good</option>
                <option value="Damaged">Damaged</option>
                <option value="Repair Needed">Repair Needed</option>
              </select>
            </div>

            <div className="form-group">
              <label>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="form-control"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {loading ? 'Processing...' : 'Confirm Return'}
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

export default HandoverAssetModal;