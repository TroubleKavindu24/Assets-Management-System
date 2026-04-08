// src/components/AllocateAsset.jsx
import React, { useState, useEffect } from 'react';
import './AllocateAssetForm.css';

const AllocateAsset = () => {
  const [formData, setFormData] = useState({
    asset_id: '',
    serial_no: '',
    ip_address: '',
    branch_id: '',
    department_id: '',
    allocated_by: '',
    allocated_date: new Date().toISOString().split('T')[0],
    asset_type: '',
    // Laptop fields
    allocated_charger: false,
    allocated_bag: false,
    allocated_mouse: false,
    allocated_keyboard: false,
    // Desktop PC fields
    allocated_monitor_id: '',
    desktop_allocated_mouse: false,
    desktop_allocated_keyboard: false,
  });

  const [availableAssets, setAvailableAssets] = useState([]);
  const [availableMonitors, setAvailableMonitors] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetType, setAssetType] = useState('');

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (assetType) {
      fetchAvailableAssetsByType(assetType);
    } else {
      setAvailableAssets([]);
    }
  }, [assetType]);

  const fetchAvailableAssetsByType = async (type) => {
    setLoadingAssets(true);
    try {
      const response = await fetch(`http://localhost:5005/api/assets/available/${encodeURIComponent(type)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (response.ok && data.success) {
        setAvailableAssets(data.data || []);
      } else {
        setAvailableAssets([]);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to fetch available assets');
    } finally {
      setLoadingAssets(false);
    }
  };

  const fetchAvailableMonitors = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/assets/available/Monitor', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (response.ok && data.success) {
        setAvailableMonitors(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching monitors:', err);
    }
  };

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await fetch('http://localhost:5005/api/departments/branches', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (response.ok && data.success) {
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
      const response = await fetch(`http://localhost:5005/api/departments/branch/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      if (response.ok && data.success) {
        setDepartments(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to fetch departments');
    }
  };

  const handleAssetSelect = (e) => {
    const selectedSerialNo = e.target.value;
    const asset = availableAssets.find(a => a.serial_no === selectedSerialNo);
    
    if (asset) {
      setSelectedAsset(asset);
      setFormData(prev => ({
        ...prev,
        asset_id: asset.asset_id,
        serial_no: asset.serial_no,
        asset_type: asset.asset_type,
      }));

      if (asset.asset_type === 'Desktop PC') {
        fetchAvailableMonitors();
      }
    } else {
      setSelectedAsset(null);
      setFormData(prev => ({
        ...prev,
        asset_id: '',
        serial_no: '',
        asset_type: '',
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    if (name === 'branch_id') {
      setFormData((prev) => ({ ...prev, department_id: '' }));
      fetchDepartmentsByBranch(value);
    }
  };

  const validateLaptopAccessories = () => {
    const { allocated_charger, allocated_bag, allocated_mouse, allocated_keyboard } = formData;
    return allocated_charger || allocated_bag || allocated_mouse || allocated_keyboard;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!formData.asset_id) {
      setError('Please select a valid asset');
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

    if (formData.asset_type === 'Laptop' && !validateLaptopAccessories()) {
      setError('Please select at least one accessory for the Laptop');
      setLoading(false);
      return;
    }

    const requestBody = {
      asset_id: parseInt(formData.asset_id),
      ip_address: formData.ip_address,
      branch_id: parseInt(formData.branch_id),
      department_id: parseInt(formData.department_id),
      allocated_by: formData.allocated_by,
      allocated_date: formData.allocated_date,
      asset_type: formData.asset_type,
    };

    if (formData.asset_type === 'Desktop PC') {
      requestBody.allocated_monitor_id = formData.allocated_monitor_id ? parseInt(formData.allocated_monitor_id) : null;
      requestBody.desktop_allocated_mouse = formData.desktop_allocated_mouse;
      requestBody.desktop_allocated_keyboard = formData.desktop_allocated_keyboard;
    }

    if (formData.asset_type === 'Laptop') {
      requestBody.allocated_charger = formData.allocated_charger;
      requestBody.allocated_bag = formData.allocated_bag;
      requestBody.allocated_mouse = formData.allocated_mouse;
      requestBody.allocated_keyboard = formData.allocated_keyboard;
    }

    try {
      const response = await fetch('http://localhost:5005/api/assets/asset-allocation', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Allocation failed');
      }

      setMessage('Asset allocated successfully');
      
      setFormData({
        asset_id: '',
        serial_no: '',
        ip_address: '',
        branch_id: '',
        department_id: '',
        allocated_by: loggedInUser.username || '',
        allocated_date: new Date().toISOString().split('T')[0],
        asset_type: '',
        allocated_charger: false,
        allocated_bag: false,
        allocated_mouse: false,
        allocated_keyboard: false,
        allocated_monitor_id: '',
        desktop_allocated_mouse: false,
        desktop_allocated_keyboard: false,
      });
      setSelectedAsset(null);
      setAssetType('');
      setAvailableAssets([]);
      setAvailableMonitors([]);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message);
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      asset_id: '',
      serial_no: '',
      ip_address: '',
      branch_id: '',
      department_id: '',
      allocated_by: loggedInUser.username || '',
      allocated_date: new Date().toISOString().split('T')[0],
      asset_type: '',
      allocated_charger: false,
      allocated_bag: false,
      allocated_mouse: false,
      allocated_keyboard: false,
      allocated_monitor_id: '',
      desktop_allocated_mouse: false,
      desktop_allocated_keyboard: false,
    });
    setSelectedAsset(null);
    setAssetType('');
    setAvailableAssets([]);
    setAvailableMonitors([]);
    setDepartments([]);
    setError('');
    setMessage('');
  };

  return (
    <div className="allocate-container">
      <div className="form-header">
        <h2>Allocate Assets</h2>
        <p>Assign an asset to a branch and department</p>
      </div>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="allocate-form">
        <div className="form-row">
          <div className="form-group">
            <label>Asset Type *</label>
            <select
              name="asset_type_filter"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select Asset Type</option>
              <option value="Laptop">Laptop</option>
              <option value="Desktop PC">Desktop PC</option>
              <option value="Monitor">Monitor</option>
              <option value="Printer">Printer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Select Asset *</label>
            {loadingAssets ? (
              <div className="loading-indicator">Loading assets...</div>
            ) : (
              <select
                name="serial_no"
                value={formData.serial_no}
                onChange={handleAssetSelect}
                required
                className="form-control"
                disabled={!assetType}
              >
                <option value="">Select Asset</option>
                {availableAssets.map(asset => (
                  <option key={asset.asset_id} value={asset.serial_no}>
                    {asset.display_name || `${asset.serial_no} - ${asset.brand} ${asset.model || ''}`}
                  </option>
                ))}
              </select>
            )}
            {assetType && availableAssets.length === 0 && !loadingAssets && (
              <small className="hint-text">No available assets of this type</small>
            )}
          </div>
        </div>

        {selectedAsset && (
          <div className="info-box">
            <h4>Asset Specifications</h4>
            <div className="specs-grid">
              <div className="spec-item">
                <span>Brand:</span>
                <strong>{selectedAsset.brand}</strong>
              </div>
              <div className="spec-item">
                <span>Model:</span>
                <strong>{selectedAsset.model || 'N/A'}</strong>
              </div>
              <div className="spec-item">
                <span>Serial No:</span>
                <strong>{selectedAsset.serial_no}</strong>
              </div>
              {(selectedAsset.asset_type === 'Laptop' || selectedAsset.asset_type === 'Desktop PC') && (
                <>
                  <div className="spec-item">
                    <span>RAM:</span>
                    <strong>{selectedAsset.ram_capacity || 'N/A'}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Storage:</span>
                    <strong>{selectedAsset.hard_drive || 'N/A'}</strong>
                  </div>
                  <div className="spec-item">
                    <span>Processor:</span>
                    <strong>{selectedAsset.processor || 'N/A'}</strong>
                  </div>
                  <div className="spec-item">
                    <span>OS:</span>
                    <strong>{selectedAsset.os || 'N/A'}</strong>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {selectedAsset && selectedAsset.asset_type === 'Laptop' && (
          <div className="info-box laptop-options">
            <h4>Laptop Accessories</h4>
            <div className="accessories-grid">
              <label className="accessory-checkbox">
                <input
                  type="checkbox"
                  name="allocated_charger"
                  checked={formData.allocated_charger}
                  onChange={handleChange}
                />
                <span>Charger</span>
              </label>
              <label className="accessory-checkbox">
                <input
                  type="checkbox"
                  name="allocated_bag"
                  checked={formData.allocated_bag}
                  onChange={handleChange}
                />
                <span>Laptop Bag</span>
              </label>
              <label className="accessory-checkbox">
                <input
                  type="checkbox"
                  name="allocated_mouse"
                  checked={formData.allocated_mouse}
                  onChange={handleChange}
                />
                <span>Mouse</span>
              </label>
              <label className="accessory-checkbox">
                <input
                  type="checkbox"
                  name="allocated_keyboard"
                  checked={formData.allocated_keyboard}
                  onChange={handleChange}
                />
                <span>External Keyboard</span>
              </label>
            </div>
            <small className="hint-text">Select one or more accessories to allocate with this laptop</small>
          </div>
        )}

        {selectedAsset && selectedAsset.asset_type === 'Desktop PC' && (
          <div className="info-box desktop-options">
            <h4>Desktop PC Accessories</h4>
            <div className="form-row">
              <div className="form-group">
                <label>Allocate Monitor</label>
                <select
                  name="allocated_monitor_id"
                  value={formData.allocated_monitor_id}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="">No Monitor</option>
                  {availableMonitors.map(monitor => (
                    <option key={monitor.asset_id} value={monitor.asset_id}>
                      {monitor.display_name || `${monitor.serial_no} - ${monitor.brand} ${monitor.model || ''}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="desktop_allocated_mouse"
                    checked={formData.desktop_allocated_mouse}
                    onChange={handleChange}
                  />
                  <span>Allocate Mouse</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="desktop_allocated_keyboard"
                    checked={formData.desktop_allocated_keyboard}
                    onChange={handleChange}
                  />
                  <span>Allocate Keyboard</span>
                </label>
              </div>
            </div>
          </div>
        )}

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
              <small className="hint-text">Please select a branch first</small>
            )}
          </div>
        </div>

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
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Allocating...' : 'Allocate Asset'}
          </button>
          <button 
            type="button" 
            onClick={handleReset} 
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