import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PermissionManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5005/api';

const PermissionManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [userPermissions, setUserPermissions] = useState([]);
  const [permissionHistory, setPermissionHistory] = useState([]);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [password, setPassword] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [remarks, setRemarks] = useState('');

  const token = localStorage.getItem('token');

  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Fetch users with permissions
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      
      const response = await authAxios.get('http://localhost:5005/api/permissions/users', { params });
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available permissions
  const fetchAvailablePermissions = async () => {
    try {
      const response = await authAxios.get('http://localhost:5005/api/permissions/list');
      setAvailablePermissions(response.data.data);
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  // Fetch user permissions
  const fetchUserPermissions = async (userId) => {
    try {
      const response = await authAxios.get(`http://localhost:5005/api/permissions/users/${userId}/permissions`);
      setUserPermissions(response.data.data);
      setSelectedPermissions(response.data.data.active_permissions || []);
    } catch (err) {
      console.error('Failed to fetch user permissions:', err);
    }
  };

  // Fetch permission history
  const fetchPermissionHistory = async (userId, page = 1) => {
    try {
      const response = await authAxios.get(`http://localhost:5005/api/permissions/users/${userId}/permissions/history?page=${page}&limit=20`);
      setPermissionHistory(response.data.data);
    } catch (err) {
      console.error('Failed to fetch permission history:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAvailablePermissions();
  }, [currentPage, searchTerm]);

  // Open permission modal
  const handleManagePermissions = async (user) => {
    setSelectedUser(user);
    await fetchUserPermissions(user.user_id);
    setShowPermissionModal(true);
    setSelectedPermissions(userPermissions.active_permissions || []);
  };

  // Open history modal
  const handleViewHistory = async (user) => {
    setSelectedUser(user);
    await fetchPermissionHistory(user.user_id);
    setShowHistoryModal(true);
  };

  // Grant single permission
  const handleGrantPermission = (permissionType) => {
    setPendingAction({
      type: 'grant',
      data: {
        userId: selectedUser.user_id,
        permissionType: permissionType
      }
    });
    setShowPasswordModal(true);
  };

  // Revoke permission
  const handleRevokePermission = (permissionType) => {
    setPendingAction({
      type: 'revoke',
      data: {
        userId: selectedUser.user_id,
        permissionType: permissionType
      }
    });
    setShowPasswordModal(true);
  };

  // Grant multiple permissions
  const handleGrantMultiplePermissions = () => {
    if (selectedPermissions.length === 0) {
      setError('Please select at least one permission');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setPendingAction({
      type: 'bulkGrant',
      data: {
        userId: selectedUser.user_id,
        permissions: selectedPermissions
      }
    });
    setShowPasswordModal(true);
  };

  // Execute action with password
  const executeAction = async () => {
    if (!password) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    
    try {
      let response;
      
      switch (pendingAction.type) {
        case 'grant':
          response = await authAxios.post(
            `http://localhost:5005/api/permissions/users/${pendingAction.data.userId}/permissions/${pendingAction.data.permissionType}/grant`,
            { password, remarks }
          );
          break;
        case 'revoke':
          response = await authAxios.delete(
            `http://localhost:5005/api/permissions/users/${pendingAction.data.userId}/permissions/${pendingAction.data.permissionType}/revoke`,
            { data: { password, remarks } }
          );
          break;
        case 'bulkGrant':
          response = await authAxios.post(
            `http://localhost:5005/api/permissions/users/${pendingAction.data.userId}/permissions/bulk-grant`,
            { permissions: pendingAction.data.permissions, password, remarks }
          );
          break;
        default:
          break;
      }
      
      if (response) {
        setSuccess(response.data.message);
        fetchUsers();
        fetchUserPermissions(selectedUser.user_id);
        setShowPasswordModal(false);
        setPassword('');
        setRemarks('');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to execute action');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Render permission badges
  const renderPermissionBadges = (permissions) => {
    if (!permissions || permissions.length === 0) {
      return <span className="no-permissions">No permissions</span>;
    }
    
    return (
      <div className="permission-badges">
        {permissions.map((perm, index) => (
          <span key={index} className="permission-badge">
            {perm.type || perm}
          </span>
        ))}
      </div>
    );
  };

  // Render role badge
  const renderRoleBadge = (role) => {
    const roles = {
      SUPER_ADMIN: { class: 'super-admin', label: 'SUPER ADMIN' },
      ADMIN: { class: 'admin', label: 'ADMIN' },
      STAFF: { class: 'staff', label: 'STAFF' }
    };
    
    const roleConfig = roles[role] || roles.STAFF;
    
    return (
      <span className={`role-badge ${roleConfig.class}`}>
        {roleConfig.label}
      </span>
    );
  };

  return (
    <div className="permission-management">
      <div className="header">
        <h1>Permission Management</h1>
        <p>Grant and revoke user permissions with full audit trail</p>
      </div>

      {/* Messages */}
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Controls */}
      <div className="controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search by username or department..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Department</th>
              <th>Role</th>
              <th>Active Permissions</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="6" className="loading-cell">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-cell">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.user_id} className={!user.is_active ? 'inactive-row' : ''}>
                  <td>
                    <strong>{user.user_name}</strong>
                  </td>
                  <td>{user.department_name}</td>
                  <td>{renderRoleBadge(user.role)}</td>
                  <td>{renderPermissionBadges(user.permissions)}</td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => handleManagePermissions(user)}
                      className="btn-manage"
                      disabled={!user.is_active}
                    >
                      Manage Permissions
                    </button>
                    <button
                      onClick={() => handleViewHistory(user)}
                      className="btn-history"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}

      {/* Permission Management Modal */}
      {showPermissionModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowPermissionModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Permissions</h3>
              <button className="close-btn" onClick={() => setShowPermissionModal(false)}>×</button>
            </div>
            
            <div className="user-info">
              <p><strong>User:</strong> {selectedUser.user_name}</p>
              <p><strong>Department:</strong> {selectedUser.department_name}</p>
              <p><strong>Current Role:</strong> {selectedUser.role}</p>
            </div>

            <div className="permissions-section">
              <h4>Available Permissions</h4>
              <div className="permissions-grid">
                {availablePermissions.map(permission => (
                  <div key={permission.id} className="permission-card">
                    <div className="permission-header">
                      <strong>{permission.label}</strong>
                      {userPermissions.active_permissions?.includes(permission.id) ? (
                        <button
                          onClick={() => handleRevokePermission(permission.id)}
                          className="btn-revoke-small"
                          disabled={loading}
                        >
                          Revoke
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantPermission(permission.id)}
                          className="btn-grant-small"
                          disabled={loading}
                        >
                          Grant
                        </button>
                      )}
                    </div>
                    <p className="permission-description">{permission.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bulk-section">
              <h4>Bulk Grant Permissions</h4>
              <div className="bulk-select">
                <select
                  multiple
                  value={selectedPermissions}
                  onChange={(e) => {
                    const values = Array.from(e.target.selectedOptions, option => option.value);
                    setSelectedPermissions(values);
                  }}
                  className="multi-select"
                  size="5"
                >
                  {availablePermissions.map(permission => (
                    <option key={permission.id} value={permission.id}>
                      {permission.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleGrantMultiplePermissions}
                  className="btn-bulk-grant"
                  disabled={loading}
                >
                  Grant Selected ({selectedPermissions.length})
                </button>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowPermissionModal(false)} className="btn-close">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission History Modal */}
      {showHistoryModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Permission History - {selectedUser.user_name}</h3>
              <button className="close-btn" onClick={() => setShowHistoryModal(false)}>×</button>
            </div>

            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Action</th>
                    <th>Status</th>
                    <th>Granted By</th>
                    <th>Granted At</th>
                    <th>Revoked By</th>
                    <th>Revoked At</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {permissionHistory.history?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-cell">No permission history found</td>
                    </tr>
                  ) : (
                    permissionHistory.history?.map((record, index) => (
                      <tr key={index}>
                        <td>
                          <span className="permission-type">
                            {record.permission_type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`action-badge ${record.action.toLowerCase()}`}>
                            {record.action}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${record.status.toLowerCase()}`}>
                            {record.status}
                          </span>
                        </td>
                        <td>{record.granted_by_name}</td>
                        <td>{new Date(record.granted_at).toLocaleString()}</td>
                        <td>{record.revoked_by_name || '-'}</td>
                        <td>{record.revoked_at ? new Date(record.revoked_at).toLocaleString() : '-'}</td>
                        <td className="remarks-cell">{record.remarks || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {permissionHistory.pagination && (
              <div className="pagination">
                <button
                  onClick={() => fetchPermissionHistory(selectedUser.user_id, permissionHistory.pagination.page - 1)}
                  disabled={permissionHistory.pagination.page === 1}
                  className="page-btn"
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {permissionHistory.pagination.page} of {permissionHistory.pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchPermissionHistory(selectedUser.user_id, permissionHistory.pagination.page + 1)}
                  disabled={permissionHistory.pagination.page === permissionHistory.pagination.totalPages}
                  className="page-btn"
                >
                  Next
                </button>
              </div>
            )}

            <div className="modal-actions">
              <button onClick={() => setShowHistoryModal(false)} className="btn-close">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Confirmation Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => {
          setShowPasswordModal(false);
          setPassword('');
          setRemarks('');
          setPendingAction(null);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Action</h3>
            <p>Please enter your SUPER_ADMIN password to confirm this action.</p>
            
            <div className="modal-form">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && executeAction()}
                placeholder="Enter your password"
                className="password-input"
                autoFocus
              />
            </div>

            <div className="modal-form">
              <label>Remarks (Optional):</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add remarks for this action"
                className="remarks-input"
                rows="3"
              />
            </div>
            
            <div className="modal-actions">
              <button onClick={executeAction} className="btn-confirm" disabled={loading}>
                Confirm
              </button>
              <button 
                onClick={() => {
                  setShowPasswordModal(false);
                  setPassword('');
                  setRemarks('');
                  setPendingAction(null);
                }} 
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagement;