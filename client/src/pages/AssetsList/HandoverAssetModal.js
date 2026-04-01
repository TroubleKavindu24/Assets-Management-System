// src/components/HandoverAssetModal.jsx
import React, { useState, useEffect } from 'react';
import './Modal.css';

const HandoverAssetModal = ({ isOpen, onClose, asset }) => {
  const [formData, setFormData] = useState({
    asset_id: '',
    department_id: '',
    requested_by: '',
    condition_note: '',
    handover_date: new Date().toISOString().split('T')[0],
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get logged-in user from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        asset_id: asset.asset_id,
        department_id: '',
        requested_by: loggedInUser.username || '',
        condition_note: '',
        handover_date: new Date().toISOString().split('T')[0],
      });
      fetchDepartments();
    }
  }, [isOpen, asset]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/assets/departments');
      const data = await response.json();
      if (response.ok) {
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch('http://localhost:5005/api/assets/asset-handover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Handover failed');
      }

      setMessage('✅ Asset handed over successfully!');
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
        <div className="modal-header">
          <h2>Handover Asset</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
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
              <label>Department *</label>
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.department_id} value={dept.department_id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Requested By *</label>
              <input
                type="text"
                name="requested_by"
                value={formData.requested_by}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-group">
              <label>Condition Note</label>
              <textarea
                name="condition_note"
                value={formData.condition_note}
                onChange={handleChange}
                placeholder="Describe the condition of the asset (e.g., Good, Minor scratches, Needs repair)"
                rows="3"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Handover Date</label>
              <input
                type="date"
                name="handover_date"
                value={formData.handover_date}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="modal-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : 'Handover Asset'}
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