// src/components/AllocateAsset.jsx
import React, { useState, useEffect } from 'react';
import './AllocateAssetForm.css';

const AllocateAsset = () => {
  const [formData, setFormData] = useState({
    serial_no: '',
    ip_address: '',
    branch_id: '',
    department_id: '',
    allocated_by: '',
    allocated_date: new Date().toISOString().split('T')[0],
    return_date: '',
  });

  const [availableAssets, setAvailableAssets] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Get logged-in user from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchAvailableAssets();
    fetchBranches();
  }, []);

  const fetchAvailableAssets = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/assets/asset-available/Laptop');
      const data = await response.json();
      if (response.ok) {
        setAvailableAssets(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    }
  };

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await fetch('http://localhost:5005/api/departments/branches');
      const data = await response.json();
      if (response.ok) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError('Failed to fetch branches');
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
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // When branch changes, reset department and fetch new departments
    if (name === 'branch_id') {
      setFormData((prev) => ({ ...prev, department_id: '' }));
      fetchDepartmentsByBranch(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // Validation
    if (!formData.serial_no) {
      setError('Please enter or select a serial number');
      setLoading(false);
      return;
    }
    
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

    if (!formData.allocated_by) {
      setError('Please enter allocated by name');
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

      setMessage('✅ Asset allocated successfully!');
      setFormData({
        serial_no: '',
        ip_address: '',
        branch_id: '',
        department_id: '',
        allocated_by: loggedInUser.username || '',
        allocated_date: new Date().toISOString().split('T')[0],
        return_date: '',
      });
      fetchAvailableAssets();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="allocate-container">
      <div className="form-header">
        <h2>Allocate Asset</h2>
        <p>Manually assign an asset to a branch and department</p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="allocate-form">
        {/* Asset Selection */}
        <div className="form-row">
          <div className="form-group">
            <label>Serial Number *</label>
            <input
              type="text"
              name="serial_no"
              value={formData.serial_no}
              onChange={handleChange}
              required
              placeholder="Enter serial number"
              className="form-control"
              list="assets-list"
            />
            <datalist id="assets-list">
              {availableAssets.map(asset => (
                <option key={asset.serial_no} value={asset.serial_no}>
                  {asset.serial_no} - {asset.brand} {asset.os}
                </option>
              ))}
            </datalist>
            <small className="hint-text">
              Start typing to search available assets
            </small>
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
        </div>

        {/* Branch and Department Selection */}
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
                <option value="">-- Select Branch --</option>
                {branches.map((branch) => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.location}
                  </option>
                ))}
              </select>
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
              <option value="">-- Select Department --</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
            {!formData.branch_id && (
              <small className="hint-text">Please select a branch first</small>
            )}
          </div>
        </div>

        {/* Allocated By */}
        <div className="form-row">
          <div className="form-group">
            <label>Allocated By *</label>
            <input
              type="text"
              name="allocated_by"
              value={formData.allocated_by}
              onChange={handleChange}
              required
              placeholder="Name of person allocating"
              className="form-control"
            />
            <small className="hint-text">
              Current user: {loggedInUser.username || 'Not logged in'}
            </small>
          </div>

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
        </div>

        {/* Return Date */}
        <div className="form-row">
          <div className="form-group">
            <label>Expected Return Date</label>
            <input
              type="date"
              name="return_date"
              value={formData.return_date}
              onChange={handleChange}
              className="form-control"
            />
            <small className="hint-text">Optional - when asset is expected to be returned</small>
          </div>

          <div className="form-group">
            {/* Empty for layout */}
          </div>
        </div>

        {/* Available Assets Summary */}
        {availableAssets.length > 0 && (
          <div className="info-box">
            <h4>📊 Available Assets Summary</h4>
            <div className="summary-stats">
              <div className="stat">
                <span>Total Available:</span>
                <strong>{availableAssets.length}</strong>
              </div>
              <div className="stat">
                <span>Laptops:</span>
                <strong>{availableAssets.filter(a => a.asset_type === 'Laptop').length}</strong>
              </div>
              <div className="stat">
                <span>Machines:</span>
                <strong>{availableAssets.filter(a => a.asset_type === 'Machine').length}</strong>
              </div>
              <div className="stat">
                <span>Printers:</span>
                <strong>{availableAssets.filter(a => a.asset_type === 'Printer').length}</strong>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Allocating...' : 'Allocate Asset'}
          </button>
          <button 
            type="button" 
            onClick={() => {
              setFormData({
                serial_no: '',
                ip_address: '',
                branch_id: '',
                department_id: '',
                allocated_by: loggedInUser.username || '',
                allocated_date: new Date().toISOString().split('T')[0],
                return_date: '',
              });
              setDepartments([]);
            }} 
            className="reset-btn"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default AllocateAsset;