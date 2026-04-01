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
  
  const [currentAllocation, setCurrentAllocation] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAllocation, setLoadingAllocation] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Get logged-in user from localStorage
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (isOpen && asset) {
      setFormData({
        asset_id: asset.asset_id,
        department_id: '',
        requested_by: loggedInUser.username || loggedInUser.name || 'Unknown User',
        condition_note: '',
        handover_date: new Date().toISOString().split('T')[0],
      });
      fetchCurrentAllocation(asset.serial_no);
      fetchBranches();
    }
  }, [isOpen, asset]);

  const fetchCurrentAllocation = async (serialNo) => {
    setLoadingAllocation(true);
    try {
      const response = await fetch(`http://localhost:5005/api/assets/serial/${serialNo}`);
      const data = await response.json();
      
      if (response.ok && data.allocation) {
        setCurrentAllocation(data.allocation);
        // Pre-select the branch and department from current allocation
        if (data.allocation.branch_id) {
          setSelectedBranch(data.allocation.branch_id.toString());
          fetchDepartmentsByBranch(data.allocation.branch_id);
          // Wait for departments to load then set department
          setTimeout(() => {
            setFormData(prev => ({
              ...prev,
              department_id: data.allocation.department_id?.toString() || ''
            }));
          }, 500);
        }
      } else {
        setCurrentAllocation(null);
      }
    } catch (err) {
      console.error('Error fetching allocation:', err);
    } finally {
      setLoadingAllocation(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/departments/branches');
      const data = await response.json();
      if (response.ok) {
        setBranches(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
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
    }
  };

  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranch(branchId);
    setFormData((prev) => ({ ...prev, department_id: '' }));
    fetchDepartmentsByBranch(branchId);
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

    if (!formData.department_id) {
      setError('Please select a department');
      setLoading(false);
      return;
    }

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

  // Get branch name from ID
  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branch_id === parseInt(branchId));
    return branch ? branch.location : 'Unknown Branch';
  };

  // Get department name from ID
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.department_id === parseInt(deptId));
    return dept ? dept.department_name : 'Unknown Department';
  };

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
            {/* Asset Information Section */}
            <div className="info-section">
              <h3>Asset Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Serial Number:</label>
                  <span><strong>{asset?.serial_no}</strong></span>
                </div>
                <div className="info-item">
                  <label>Asset Type:</label>
                  <span>{asset?.asset_type}</span>
                </div>
                <div className="info-item">
                  <label>Brand:</label>
                  <span>{asset?.brand || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${asset?.status === 'ALLOCATED' ? 'status-allocated' : ''}`}>
                    {asset?.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Allocation Section */}
            {loadingAllocation ? (
              <div className="loading-section">Loading current allocation...</div>
            ) : currentAllocation ? (
              <div className="info-section allocation-info">
                <h3>Current Allocation Details</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Branch:</label>
                    <span className="highlight">
                      🏢 {getBranchName(currentAllocation.branch_id)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Department:</label>
                    <span className="highlight">
                      📍 {getDepartmentName(currentAllocation.department_id)}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>IP Address:</label>
                    <span>{currentAllocation.ip_address || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Allocated By:</label>
                    <span>{currentAllocation.allocated_by}</span>
                  </div>
                  <div className="info-item">
                    <label>Allocated Date:</label>
                    <span>{currentAllocation.allocated_date ? new Date(currentAllocation.allocated_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  {currentAllocation.return_date && (
                    <div className="info-item">
                      <label>Expected Return:</label>
                      <span>{new Date(currentAllocation.return_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="warning-message">
                ⚠️ No active allocation found for this asset.
              </div>
            )}

            {/* Handover Form Section */}
            <div className="info-section">
              <h3>Handover Details</h3>
              <div className="form-group">
                <label>Handover By *</label>
                <input
                  type="text"
                  name="requested_by"
                  value={formData.requested_by}
                  readOnly
                  className="form-control read-only"
                />
                <small className="hint-text">Auto-filled with logged-in user: {formData.requested_by}</small>
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
            </div>

            <div className="modal-actions">
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? 'Processing...' : 'Confirm Handover'}
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