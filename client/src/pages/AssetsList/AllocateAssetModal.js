// src/components/AllocateAssetModal.jsx
import React, { useState, useEffect } from 'react';
import './Modal.css';

const AllocateAssetModal = ({ isOpen, onClose, asset }) => {
  const [formData, setFormData] = useState({
    serial_no: '',
    ip_address: '',
    department_id: '',
    allocated_by: '',
    allocated_date: new Date().toISOString().split('T')[0],
    return_date: '',
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
        ...formData,
        serial_no: asset.serial_no,
        allocated_by: loggedInUser.username || '',
      });
      fetchDepartments();
    }
  }, [isOpen, asset]);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/departments/get-departments');
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
      const response = await fetch('http://localhost:5005/api/assets/asset-allocation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Allocation failed');
      }

      setMessage('✅ Asset allocated successfully!');
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
          <h2>Allocate Asset</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {message && <div className="success-message">{message}</div>}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Serial Number *</label>
              <input
                type="text"
                name="serial_no"
                value={formData.serial_no}
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
              <label>IP Address *</label>
              <input
                type="text"
                name="ip_address"
                value={formData.ip_address}
                onChange={handleChange}
                required
                placeholder="e.g., 192.168.1.100"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>Allocated By *</label>
              <input
                type="text"
                name="allocated_by"
                value={formData.allocated_by}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Allocated Date</label>
                <input
                  type="date"
                  name="allocated_date"
                  value={formData.allocated_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Return Date (Expected)</label>
                <input
                  type="date"
                  name="return_date"
                  value={formData.return_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Allocating...' : 'Allocate Asset'}
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

export default AllocateAssetModal;