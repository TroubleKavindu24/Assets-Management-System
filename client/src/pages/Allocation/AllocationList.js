// src/components/AllocationList.jsx
import React, { useState, useEffect } from 'react';
import './AllocationList.css';

const AllocationList = () => {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5005/api/assets/getAllAllocations', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Transform data to include status based on return_date
        const transformedAllocations = (data.data || []).map(alloc => ({
          ...alloc,
          allocation_status: alloc.return_date ? 'COMPLETED' : 'ACTIVE'
        }));
        setAllocations(transformedAllocations);
      } else {
        setError(data.message || 'Failed to fetch allocations');
      }
    } catch (err) {
      console.error('Error fetching allocations:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleHandover = async (allocation) => {
    if (!window.confirm(`Are you sure you want to handover asset ${allocation.serial_no}?`)) {
      return;
    }

    setHandoverLoading(allocation.allocation_id);
    
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5005/api/assets/asset-handover/${allocation.allocation_id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          return_date: new Date().toISOString().split('T')[0],
          return_condition: 'Good',
          remarks: 'Handed over successfully'
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Handover failed');
      }

      // Refresh allocations list
      await fetchAllocations();
      
      alert(`Asset ${allocation.serial_no} handed over successfully!`);
      
    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Handover error:', err);
    } finally {
      setHandoverLoading(null);
    }
  };

  const handleMoreClick = (allocation) => {
    setSelectedAllocation(allocation);
    setShowDetailsModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filter allocations based on selected filter
  const filteredAllocations = allocations.filter(alloc => {
    if (filter === 'active') return alloc.allocation_status === 'ACTIVE';
    if (filter === 'completed') return alloc.allocation_status === 'COMPLETED';
    return true;
  });

  // Pagination
  const indexOfLastItem = page * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAllocations = filteredAllocations.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAllocations.length / itemsPerPage);

  const stats = {
    total: allocations.length,
    active: allocations.filter(a => a.allocation_status === 'ACTIVE').length,
    completed: allocations.filter(a => a.allocation_status === 'COMPLETED').length
  };

  // Get accessories display text
  const getAccessoriesDisplay = (allocation) => {
    const accessories = [];
    if (allocation.allocated_charger) accessories.push('Charger');
    if (allocation.allocated_bag) accessories.push('Bag');
    if (allocation.allocated_mouse) accessories.push('Mouse');
    if (allocation.allocated_keyboard) accessories.push('Keyboard');
    if (allocation.desktop_allocated_mouse) accessories.push('Desktop Mouse');
    if (allocation.desktop_allocated_keyboard) accessories.push('Desktop Keyboard');
    if (allocation.allocated_monitor_id) accessories.push('Monitor');
    
    return accessories.length > 0 ? accessories.join(', ') : 'None';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading allocations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button onClick={fetchAllocations} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="allocation-list-container">
      <div className="list-header">
        <div>
          <h2>Asset Allocations</h2>
          <p className="subtitle">Complete history of all asset allocations</p>
        </div>
        <button onClick={fetchAllocations} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => { setFilter('all'); setPage(1); }}
        >
          All ({stats.total})
        </button>
        <button 
          className={`filter-tab ${filter === 'active' ? 'active' : ''}`}
          onClick={() => { setFilter('active'); setPage(1); }}
        >
          Active ({stats.active})
        </button>
        <button 
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => { setFilter('completed'); setPage(1); }}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Stats Summary */}
      <div className="stats-summary">
        <div className="stat-card">
          <span className="stat-label">Total Allocations</span>
          <span className="stat-value">{stats.total}</span>
        </div>
        <div className="stat-card active">
          <span className="stat-label">Active Allocations</span>
          <span className="stat-value">{stats.active}</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-label">Completed</span>
          <span className="stat-value">{stats.completed}</span>
        </div>
      </div>

      {filteredAllocations.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>No {filter === 'active' ? 'Active' : filter === 'completed' ? 'Completed' : ''} Allocations Found</h3>
          <p>
            {filter === 'active' 
              ? 'No assets are currently allocated. Allocate an asset to see it here!' 
              : filter === 'completed'
              ? 'No completed allocations yet.'
              : 'No allocations have been made yet. Start by allocating an asset!'}
          </p>
          {filter === 'active' && (
            <button onClick={() => window.location.href = '/allocate-asset'} className="allocate-now-btn">
              + Allocate Asset Now
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="allocation-table">
              <thead>
                <tr>
                  <th>Serial No</th>
                  <th>IP Address</th>
                  <th>Asset Type</th>
                  <th>Brand</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>Allocated By</th>
                  <th>Allocated Date</th>
                  <th>Accessories</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentAllocations.map((allocation) => (
                  <tr key={allocation.allocation_id}>
                    <td>
                      <strong className="serial-number">{allocation.serial_no}</strong>
                    </td>
                    <td>
                      <code className="ip-address">{allocation.ip_address}</code>
                    </td>
                    <td>
                      <span className="asset-type-badge">
                        {allocation.asset?.asset_type || '-'}
                      </span>
                    </td>
                    <td>
                      {allocation.asset?.brand || '-'}
                    </td>
                    <td>
                      <span className="branch-info">
                        {allocation.branch?.location || '-'}
                      </span>
                    </td>
                    <td>
                      <span className="dept-info">
                        {allocation.department?.department_name || '-'}
                      </span>
                    </td>
                    <td>{allocation.allocated_by}</td>
                    <td>{formatDate(allocation.allocated_date)}</td>
                    <td>
                      <span className="accessories-badge">
                        {getAccessoriesDisplay(allocation)}
                      </span>
                    </td>
                    <td>
                      {allocation.allocation_status === 'ACTIVE' ? (
                        <span className="badge-active">Active</span>
                      ) : (
                        <span className="badge-completed">Completed</span>
                      )}
                    </td>
                    <td className="action-cell">
                      <div className="action-buttons">
                        <button
                          className="more-btn"
                          onClick={() => handleMoreClick(allocation)}
                          title="View details"
                        >
                          View Details
                        </button>
                        {allocation.allocation_status === 'ACTIVE' ? (
                          <button
                            className="handover-btn"
                            onClick={() => handleHandover(allocation)}
                            disabled={handoverLoading === allocation.allocation_id}
                            title="Handover this asset"
                          >
                            {handoverLoading === allocation.allocation_id ? (
                              <>Processing...</>
                            ) : (
                              <>Handover</>
                            )}
                          </button>
                        ) : (
                          <button className="completed-btn" disabled>
                            Completed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(page - 1)} 
                disabled={page === 1}
                className="page-btn"
              >
                Previous
              </button>
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={page === totalPages}
                className="page-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAllocation && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Allocation Details</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <label>Serial Number:</label>
                  <span><strong>{selectedAllocation.serial_no}</strong></span>
                </div>
                <div className="detail-item">
                  <label>IP Address:</label>
                  <span><code>{selectedAllocation.ip_address}</code></span>
                </div>
                <div className="detail-item">
                  <label>Asset Type:</label>
                  <span>{selectedAllocation.asset?.asset_type || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Brand:</label>
                  <span>{selectedAllocation.asset?.brand || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Model:</label>
                  <span>{selectedAllocation.asset?.model || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>OS:</label>
                  <span>{selectedAllocation.asset?.os || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>RAM:</label>
                  <span>{selectedAllocation.asset?.ram_capacity || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Storage:</label>
                  <span>{selectedAllocation.asset?.hard_drive || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Processor:</label>
                  <span>{selectedAllocation.asset?.processor || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Branch:</label>
                  <span>{selectedAllocation.branch?.location || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Department:</label>
                  <span>{selectedAllocation.department?.department_name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Allocated By:</label>
                  <span>{selectedAllocation.allocated_by}</span>
                </div>
                <div className="detail-item">
                  <label>Allocated Date:</label>
                  <span>{formatDate(selectedAllocation.allocated_date)}</span>
                </div>
                {selectedAllocation.return_date && (
                  <div className="detail-item">
                    <label>Handover Date:</label>
                    <span>{formatDate(selectedAllocation.return_date)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <label>Accessories:</label>
                  <span>{getAccessoriesDisplay(selectedAllocation)}</span>
                </div>
                <div className="detail-item">
                  <label>Status:</label>
                  <span>
                    {selectedAllocation.allocation_status === 'ACTIVE' ? (
                      <span className="badge-active">Active</span>
                    ) : (
                      <span className="badge-completed">Completed</span>
                    )}
                  </span>
                </div>
                {selectedAllocation.return_condition && (
                  <div className="detail-item">
                    <label>Return Condition:</label>
                    <span>{selectedAllocation.return_condition}</span>
                  </div>
                )}
                {selectedAllocation.return_remarks && (
                  <div className="detail-item">
                    <label>Return Remarks:</label>
                    <span>{selectedAllocation.return_remarks}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedAllocation.allocation_status === 'ACTIVE' ? (
                <button 
                  className="handover-from-modal-btn"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleHandover(selectedAllocation);
                  }}
                >
                  Handover Asset
                </button>
              ) : (
                <button className="completed-modal-btn" disabled>
                  Already Handed Over
                </button>
              )}
              <button className="close-modal-btn" onClick={() => setShowDetailsModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllocationList;