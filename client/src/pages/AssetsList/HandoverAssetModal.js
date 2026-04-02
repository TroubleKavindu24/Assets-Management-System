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
        if (data.allocation.branch_id) {
          setSelectedBranch(data.allocation.branch_id.toString());
          fetchDepartmentsByBranch(data.allocation.branch_id);
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

      setMessage('Asset handed over successfully');
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

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.branch_id === parseInt(branchId));
    return branch ? branch.location : 'Unknown Branch';
  };

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
              <label>Brand</label>
              <input
                type="text"
                value={asset?.brand || 'N/A'}
                readOnly
                className="form-control read-only"
              />
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <input
                type="text"
                value={asset?.status || 'N/A'}
                readOnly
                className="form-control read-only"
              />
            </div>

            {loadingAllocation ? (
              <div className="loading-text">Loading allocation details...</div>
            ) : currentAllocation ? (
              <>
                <div className="form-group">
                  <label>Current Branch</label>
                  <input
                    type="text"
                    value={getBranchName(currentAllocation.branch_id)}
                    readOnly
                    className="form-control read-only"
                  />
                </div>

                <div className="form-group">
                  <label>Current Department</label>
                  <input
                    type="text"
                    value={getDepartmentName(currentAllocation.department_id)}
                    readOnly
                    className="form-control read-only"
                  />
                </div>

                <div className="form-group">
                  <label>IP Address</label>
                  <input
                    type="text"
                    value={currentAllocation.ip_address || 'N/A'}
                    readOnly
                    className="form-control read-only"
                  />
                </div>

                <div className="form-group">
                  <label>Allocated By</label>
                  <input
                    type="text"
                    value={currentAllocation.allocated_by}
                    readOnly
                    className="form-control read-only"
                  />
                </div>
              </>
            ) : (
              <div className="warning-text">No active allocation found</div>
            )}

            <div className="form-group">
              <label>Handover By *</label>
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
                placeholder="Describe the condition of the asset"
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

            <div className="form-actions">
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