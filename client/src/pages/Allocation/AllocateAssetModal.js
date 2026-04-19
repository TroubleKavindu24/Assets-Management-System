import React, { useState, useEffect } from 'react';
import '../AssetsList/Modal.css';

const AllocateAssetModal = ({ isOpen, onClose, asset }) => {

  const token = localStorage.getItem('token');
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    serial_no: '',
    ip_address: '',
    branch_id: '',
    department_id: '',
    allocated_by: '',
    allocated_date: new Date().toISOString().split('T')[0],
    return_date: '',

    // Laptop
    allocated_charger: false,
    allocated_bag: false,
    allocated_mouse: false,
    allocated_keyboard: false,

    // Desktop
    allocated_monitor_id: '',
    desktop_allocated_mouse: false,
    desktop_allocated_keyboard: false,
  });

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [availableMonitors, setAvailableMonitors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      setFormData((prev) => ({
        ...prev,
        serial_no: asset.serial_no,
        allocated_by: loggedInUser.username || 'User',
      }));

      fetchBranches();

      if (asset.asset_type === 'Desktop PC') {
        fetchAvailableMonitors();
      }
    }
  }, [isOpen, asset]);

  // ================= FETCH =================

  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const res = await fetch('http://localhost:5005/api/departments/branches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBranches(data.data || []);
    } catch {
      setError('Failed to fetch branches');
    } finally {
      setLoadingBranches(false);
    }
  };

  const fetchDepartmentsByBranch = async (branchId) => {
    try {
      const res = await fetch(`http://localhost:5005/api/departments/branch/${branchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setDepartments(data.data || []);
    } catch {
      setError('Failed to fetch departments');
    }
  };

  const fetchAvailableMonitors = async () => {
    try {
      const res = await fetch('http://localhost:5005/api/assets/available/Monitor', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAvailableMonitors(data.data || []);
    } catch {
      console.log('Monitor fetch error');
    }
  };

  // ================= HANDLE =================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'branch_id') {
      setFormData(prev => ({ ...prev, department_id: '' }));
      fetchDepartmentsByBranch(value);
    }
  };

  // ================= SUBMIT =================

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!formData.ip_address) return setError('IP required'), setLoading(false);
    if (!formData.branch_id) return setError('Branch required'), setLoading(false);
    if (!formData.department_id) return setError('Department required'), setLoading(false);

    // Laptop validation
    if (asset.asset_type === 'Laptop') {
      const hasAccessory =
        formData.allocated_charger ||
        formData.allocated_bag ||
        formData.allocated_mouse ||
        formData.allocated_keyboard;

      if (!hasAccessory) {
        setError('Select at least one laptop accessory');
        setLoading(false);
        return;
      }
    }

    const body = {
      asset_id: asset.asset_id,
      ip_address: formData.ip_address,
      branch_id: parseInt(formData.branch_id),
      department_id: parseInt(formData.department_id),
      allocated_by: 1,
      allocated_date: formData.allocated_date,
    };

    if (asset.asset_type === 'Laptop') {
      body.allocated_charger = formData.allocated_charger;
      body.allocated_bag = formData.allocated_bag;
      body.allocated_mouse = formData.allocated_mouse;
      body.allocated_keyboard = formData.allocated_keyboard;
    }

    if (asset.asset_type === 'Desktop PC') {
      body.allocated_monitor_id = formData.allocated_monitor_id || null;
      body.desktop_allocated_mouse = formData.desktop_allocated_mouse;
      body.desktop_allocated_keyboard = formData.desktop_allocated_keyboard;
    }

    try {
      const res = await fetch('http://localhost:5005/api/assets/asset-allocation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      setMessage('Asset allocated successfully');
      setTimeout(onClose, 1500);

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
          <h2>Allocate Asset</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {/* BODY */}
        <div className="modal-body">

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit} className="modal-form">

            {/* SERIAL + TYPE */}
            <div className="form-row">
              <div className="form-group">
                <label>Serial No</label>
                <input className="form-control read-only" value={asset.serial_no} readOnly />
              </div>

              <div className="form-group">
                <label>Asset Type</label>
                <input className="form-control read-only" value={asset.asset_type} readOnly />
              </div>
            </div>

            {/* BRANCH + DEPT */}
            <div className="form-row">
              <div className="form-group">
                <label>Branch</label>
                <select name="branch_id" className="form-control" onChange={handleChange}>
                  <option value="">Select Branch</option>
                  {branches.map(b => (
                    <option key={b.branch_id} value={b.branch_id}>{b.location}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Department</label>
                <select name="department_id" className="form-control" onChange={handleChange}>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.department_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* IP */}
            <div className="form-group">
              <label>IP Address</label>
              <input name="ip_address" className="form-control" onChange={handleChange} />
            </div>

            {/* LAPTOP */}
            {asset.asset_type === 'Laptop' && (
              <div className="info-box">
                <h4>Laptop Accessories</h4>
                <div className="accessories-grid">
                  <label className="accessory-checkbox"><input type="checkbox" name="allocated_charger" onChange={handleChange}/> Charger</label>
                  <label className="accessory-checkbox"><input type="checkbox" name="allocated_bag" onChange={handleChange}/> Bag</label>
                  <label className="accessory-checkbox"><input type="checkbox" name="allocated_mouse" onChange={handleChange}/> Mouse</label>
                  <label className="accessory-checkbox"><input type="checkbox" name="allocated_keyboard" onChange={handleChange}/> Keyboard</label>
                </div>
              </div>
            )}

            {/* DESKTOP */}
            {asset.asset_type === 'Desktop PC' && (
              <div className="info-box desktop-options">
                <h4>Desktop Accessories</h4>

                <select name="allocated_monitor_id" className="form-control" onChange={handleChange}>
                  <option value="">No Monitor</option>
                  {availableMonitors.map(m => (
                    <option key={m.asset_id} value={m.asset_id}>{m.serial_no}</option>
                  ))}
                </select>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" name="desktop_allocated_mouse" onChange={handleChange}/> Mouse
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" name="desktop_allocated_keyboard" onChange={handleChange}/> Keyboard
                  </label>
                </div>
              </div>
            )}

            {/* BUTTONS */}
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {loading ? 'Allocating...' : 'Allocate'}
              </button>
              <button type="button" className="cancel-btn" onClick={onClose}>
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