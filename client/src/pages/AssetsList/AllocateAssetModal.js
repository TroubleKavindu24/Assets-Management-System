// src/components/AllocateAssetModal.jsx
import React, { useState, useEffect } from 'react';
import './Modal.css';

const AllocateAssetModal = ({ isOpen, onClose, asset }) => {
  const [formData, setFormData] = useState({
    serial_no: '',
    ip_address: '',
    branch_id: '',
    department_id: '',
    allocated_by: '',
    allocated_date: new Date().toISOString().split('T')[0],
    return_date: '',
  });
  
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        serial_no: asset.serial_no,
        ip_address: '',
        branch_id: '',
        department_id: '',
        allocated_by: loggedInUser.username || loggedInUser.name || 'Unknown User',
        allocated_date: new Date().toISOString().split('T')[0],
        return_date: '',
      });
      fetchBranches();
    }
  }, [isOpen, asset]);

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await fetch('http://localhost:5005/api/departments/branches');
      const data = await response.json();
      
      if (response.ok) {
        setBranches(data.data || []);
        if (data.data && data.data.length === 0) {
          setError('No branches found. Please contact administrator.');
        }
      } else {
        setError(data.message || 'Failed to fetch branches');
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchDepartmentsByBranch = async (branchId) => {
    if (!branchId) {
      setDepartments([]);
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:5005/api/departments/branch/${branchId}`);
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.data || []);
        if (data.data && data.data.length === 0) {
          setError('No departments found for this branch.');
        }
      } else {
        setError(data.message || 'Failed to fetch departments');
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Network error: ' + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (name === 'branch_id') {
      setFormData((prev) => ({ ...prev, department_id: '' }));
      fetchDepartmentsByBranch(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!formData.branch_id) {
      setError('Please select a branch');
      setLoading(false);
      return;
    }
    
    if (!formData.department_id) {
      setError('Please select a department');
      setLoading(false);
      return;
    }

    if (!formData.ip_address) {
      setError('Please enter IP address');
      setLoading(false);
      return;
    }

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

      setMessage('Asset allocated successfully!');
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
          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Asset Serial Number *</label>
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Branch *</label>
                {loadingBranches ? (
                  <div className="loading-indicator">Loading branches...</div>
                ) : (
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    required
                    className="form-control"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.location}
                      </option>
                    ))}
                  </select>
                )}
                {branches.length === 0 && !loadingBranches && (
                  <small className="error-text">No branches available</small>
                )}
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  required
                  disabled={!formData.branch_id || loadingBranches}
                  className="form-control"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.department_id} value={dept.department_id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
                {!formData.branch_id && (
                  <small className="hint-text">Select a branch first</small>
                )}
                {formData.branch_id && departments.length === 0 && (
                  <small className="error-text">No departments found</small>
                )}
              </div>
            </div>

            <div className="form-row">
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
                <small className="hint-text">Auto-filled: {formData.allocated_by}</small>
              </div>
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
                <label>Expected Return Date</label>
                <input
                  type="date"
                  name="return_date"
                  value={formData.return_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-actions">
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