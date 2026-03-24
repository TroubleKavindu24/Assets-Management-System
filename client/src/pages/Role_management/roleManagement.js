import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './roleManagement.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('promote');
  const [editingUser, setEditingUser] = useState(null);
  const [departmentOptions] = useState(['IT', 'HR', 'FINANCE', 'OPERATIONS', 'ADMIN']);

  const token = localStorage.getItem('token');

  // Axios interceptor for auth token
  const authAxios = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // Fetch users with pagination and filters
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm) params.search = searchTerm;
      if (roleFilter !== 'all') params.role = roleFilter;
      
      const response = await authAxios.get('http://localhost:5005/api/rolemanagement/users', { params });
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await authAxios.get('http://localhost:5005/api/rolemanagement/stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, roleFilter]);

  // Promote user
  const handlePromote = async (userId) => {
    if (!window.confirm('Are you sure you want to promote this user to ADMIN?')) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.put(`http://localhost:5005/api/rolemanagement/users/${userId}/promote`);
      setSuccess(response.data.message);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to promote user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Demote user
  const handleDemote = async (userId) => {
    if (!window.confirm('Are you sure you want to demote this user to STAFF?')) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.put(`http://localhost:5005/api/rolemanagement/users/${userId}/demote`);
      setSuccess(response.data.message);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to demote user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Deactivate user
  const handleDeactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.put(`http://localhost:5005/api/rolemanagement/users/${userId}/deactivateUser`);
      setSuccess(response.data.message);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Reactivate user
  const handleReactivate = async (userId) => {
    if (!window.confirm('Are you sure you want to reactivate this user?')) return;
    
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.put(`http://localhost:5005/api/rolemanagement/users/${userId}/reactivate`);
      setSuccess(response.data.message);
      fetchUsers();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reactivate user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Update department
  const handleUpdateDepartment = async (userId, department) => {
    setLoading(true);
    setError('');
    try {
      const response = await authAxios.put(`/role-management/users/${userId}/department`, {
        department_name: department
      });
      setSuccess(response.data.message);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
      setEditingUser(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update department');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Bulk role update
  const handleBulkUpdate = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const updates = selectedUsers.map(userId => ({
      userId: parseInt(userId),
      action: bulkAction
    }));

    setLoading(true);
    setError('');
    try {
      const response = await authAxios.post('http://localhost:5005/api/rolemanagement/users/bulk-update', { updates });
      const { successful, failed } = response.data.data;
      setSuccess(`Updated ${successful.length} users. Failed: ${failed.length}`);
      fetchUsers();
      fetchStats();
      setSelectedUsers([]);
      setShowBulkModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform bulk update');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Toggle user selection for bulk operations
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.user_id));
    }
  };

  // Render role badge
  const renderRoleBadge = (role) => {
    const roleColors = {
      SUPER_ADMIN: { bg: '#f3e8ff', color: '#7c3aed', label: 'SUPER ADMIN' },
      ADMIN: { bg: '#dbeafe', color: '#1e40af', label: 'ADMIN' },
      STAFF: { bg: '#dcfce7', color: '#166534', label: 'STAFF' }
    };
    
    const style = roleColors[role] || roleColors.STAFF;
    
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  // Render status badge
  const renderStatusBadge = (isActive) => {
    return (
      <span style={{
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#166534' : '#991b1b'
      }}>
        {isActive ? 'ACTIVE' : 'INACTIVE'}
      </span>
    );
  };

  return (
    <div className="role-management-container">
      {/* Header */}
      <div className="header">
        <h1>User Role Management</h1>
        <p>Manage user roles, departments, and account status</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.active_users?.SUPER_ADMIN || 0}</div>
            <div className="stat-label">Super Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.active_users?.ADMIN || 0}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.active_users?.STAFF || 0}</div>
            <div className="stat-label">Staff Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.inactive_users || 0}</div>
            <div className="stat-label">Inactive Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_users || 0}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
      )}

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
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin Only</option>
            <option value="STAFF">Staff Only</option>
          </select>
        </div>
        
        <div className="action-buttons">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-bulk"
            disabled={loading}
          >
            Bulk Actions ({selectedUsers.length})
          </button>
          {selectedUsers.length > 0 && (
            <button onClick={selectAllUsers} className="btn-secondary">
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={selectAllUsers}
                />
              </th>
              <th>Username</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && users.length === 0 ? (
              <tr>
                <td colSpan="7" className="loading-cell">Loading users...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-cell">No users found</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.user_id} className={!user.is_active ? 'inactive-row' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.user_id)}
                      onChange={() => toggleUserSelection(user.user_id)}
                      disabled={!user.is_active}
                    />
                  </td>
                  <td>
                    <strong>{user.user_name}</strong>
                  </td>
                  <td>{renderRoleBadge(user.role)}</td>
                  <td>
                    {editingUser === user.user_id ? (
                      <select
                        value={user.department_name}
                        onChange={(e) => handleUpdateDepartment(user.user_id, e.target.value)}
                        className="department-select"
                        autoFocus
                      >
                        {departmentOptions.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{user.department_name}</span>
                    )}
                  </td>
                  <td>{renderStatusBadge(user.is_active)}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    {user.is_active ? (
                      <>
                        {user.role === 'STAFF' && (
                          <button
                            onClick={() => handlePromote(user.user_id)}
                            className="btn-promote"
                            disabled={loading}
                          >
                            Promote
                          </button>
                        )}
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDemote(user.user_id)}
                            className="btn-demote"
                            disabled={loading}
                          >
                            Demote
                          </button>
                        )}
                        <button
                          onClick={() => setEditingUser(
                            editingUser === user.user_id ? null : user.user_id
                          )}
                          className="btn-edit"
                        >
                          {editingUser === user.user_id ? 'Cancel' : 'Edit Dept'}
                        </button>
                        <button
                          onClick={() => handleDeactivate(user.user_id)}
                          className="btn-deactivate"
                          disabled={loading}
                        >
                          Deactivate
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleReactivate(user.user_id)}
                          className="btn-reactivate"
                          disabled={loading}
                        >
                          Reactivate
                        </button>
                      </>
                    )}
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

      {/* Bulk Action Modal */}
      {showBulkModal && (
        <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Bulk Role Update</h3>
            <p>Selected users: {selectedUsers.length}</p>
            
            <div className="modal-form">
              <label>Action:</label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="bulk-select"
              >
                <option value="promote">Promote to ADMIN (STAFF only)</option>
                <option value="demote">Demote to STAFF (ADMIN only)</option>
              </select>
            </div>
            
            <div className="modal-actions">
              <button onClick={handleBulkUpdate} className="btn-confirm" disabled={loading}>
                Confirm Bulk Update
              </button>
              <button onClick={() => setShowBulkModal(false)} className="btn-cancel">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagement;