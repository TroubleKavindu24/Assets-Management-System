// src/components/DisposedAssets.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DisposedAssets.css';

const DisposedAssets = () => {
  const [disposedAssets, setDisposedAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search and Filter States
  const [searchType, setSearchType] = useState('serial_no');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchDisposedAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchTerm, searchType, locationFilter, typeFilter, disposedAssets]);

  const fetchDisposedAssets = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5005/api/assets/disposed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDisposedAssets(data.data || []);
        setFilteredAssets(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch disposed assets');
      }
    } catch (err) {
      console.error('Error fetching disposed assets:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...disposedAssets];
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(asset => {
        switch (searchType) {
          case 'serial_no':
            return asset.serial_no?.toLowerCase().includes(term);
          case 'asset_type':
            return asset.asset_type?.toLowerCase().includes(term);
          case 'brand':
            return asset.brand?.toLowerCase().includes(term);
          case 'disposed_by':
            return asset.disposed_by?.toLowerCase().includes(term);
          case 'disposed_reason':
            return asset.disposed_reason?.toLowerCase().includes(term);
          default:
            return asset.serial_no?.toLowerCase().includes(term);
        }
      });
    }
    
    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(asset => asset.disposed_location === locationFilter);
    }
    
    // Asset type filter
    if (typeFilter) {
      filtered = filtered.filter(asset => asset.asset_type === typeFilter);
    }
    
    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSearchType('serial_no');
    setLocationFilter('');
    setTypeFilter('');
  };

  const getLocationBadgeClass = (location) => {
    switch (location) {
      case 'Borella':
        return 'location-borella';
      case 'Location 1':
        return 'location-location1';
      case 'Location 2':
        return 'location-location2';
      default:
        return '';
    }
  };

  const getAssetTypeBadgeClass = (type) => {
    switch (type) {
      case 'Laptop':
        return 'type-laptop';
      case 'Desktop PC':
        return 'type-desktop';
      case 'Monitor':
        return 'type-monitor';
      case 'Printer':
        return 'type-printer';
      default:
        return 'type-other';
    }
  };

  // Get unique asset types for filter
  const uniqueAssetTypes = [...new Set(disposedAssets.map(a => a.asset_type))];
  const uniqueLocations = [...new Set(disposedAssets.map(a => a.disposed_location))];

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAssets.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate summary statistics
  const summaryStats = {
    total: disposedAssets.length,
    byLocation: {
      Borella: disposedAssets.filter(a => a.disposed_location === 'Borella').length,
      'Location 1': disposedAssets.filter(a => a.disposed_location === 'Location 1').length,
      'Location 2': disposedAssets.filter(a => a.disposed_location === 'Location 2').length,
    },
    byType: {
      Laptop: disposedAssets.filter(a => a.asset_type === 'Laptop').length,
      'Desktop PC': disposedAssets.filter(a => a.asset_type === 'Desktop PC').length,
      Monitor: disposedAssets.filter(a => a.asset_type === 'Monitor').length,
      Printer: disposedAssets.filter(a => a.asset_type === 'Printer').length,
      Other: disposedAssets.filter(a => a.asset_type === 'Other').length,
    }
  };

  if (loading) return <div className="loading">Loading disposed assets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="disposed-assets-container">
      <div className="disposed-header">
        <div className="header-left">
          <h2>Disposed Assets</h2>
          <p className="asset-count">Total Disposed: {disposedAssets.length}</p>
        </div>
        <button 
          onClick={() => navigate('/assets-list')} 
          className="back-btn"
        >
          ← Back to Assets
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">🗑️</div>
          <div className="summary-info">
            <span className="summary-label">Total Disposed</span>
            <span className="summary-value">{summaryStats.total}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📍</div>
          <div className="summary-info">
            <span className="summary-label">Locations</span>
            <span className="summary-value">{uniqueLocations.length}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💻</div>
          <div className="summary-info">
            <span className="summary-label">Asset Types</span>
            <span className="summary-value">{uniqueAssetTypes.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="filter-section">
        <div className="filter-controls">
          <div className="search-type-selector">
            <label>Search by:</label>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="filter-select"
            >
              <option value="serial_no">Serial Number</option>
              <option value="asset_type">Asset Type</option>
              <option value="brand">Brand</option>
              <option value="disposed_by">Disposed By</option>
              <option value="disposed_reason">Disposal Reason</option>
            </select>
          </div>
          
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={`Search by ${searchType.replace('_', ' ')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="filter-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-filter-btn" title="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="location-filter">
            <label>Location:</label>
            <select 
              value={locationFilter} 
              onChange={(e) => setLocationFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Locations</option>
              <option value="Borella">Borella</option>
              <option value="Location 1">Location 1</option>
              <option value="Location 2">Location 2</option>
            </select>
          </div>

          <div className="type-filter">
            <label>Asset Type:</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {uniqueAssetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {(searchTerm || locationFilter || typeFilter) && (
            <button onClick={clearFilters} className="clear-all-btn">
              Clear All Filters
            </button>
          )}
        </div>
        
        <div className="filter-stats">
          {filteredAssets.length !== disposedAssets.length && (
            <span className="filter-results-count">
              Showing {filteredAssets.length} of {disposedAssets.length} disposed assets
            </span>
          )}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">🗑️</div>
          <h3>No disposed assets found</h3>
          <p>
            {searchTerm || locationFilter || typeFilter 
              ? "No assets match your filter criteria. Try different search terms."
              : "No assets have been disposed yet."}
          </p>
          {(searchTerm || locationFilter || typeFilter) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="disposed-table">
              <thead>
                <tr>
                  <th>Serial No</th>
                  <th>Asset Type</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>OS</th>
                  <th>Disposed Location</th>
                  <th>Disposed By</th>
                  <th>Disposed Date</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((asset) => (
                  <tr key={asset.disposed_id}>
                    <td><strong className="serial-number">{asset.serial_no}</strong></td>
                    <td>
                      <span className={`asset-type-badge ${getAssetTypeBadgeClass(asset.asset_type)}`}>
                        {asset.asset_type}
                      </span>
                    </td>
                    <td>{asset.brand || '-'}</td>
                    <td>{asset.model || '-'}</td>
                    <td>{asset.os || '-'}</td>
                    <td>
                      <span className={`location-badge ${getLocationBadgeClass(asset.disposed_location)}`}>
                        {asset.disposed_location}
                      </span>
                    </td>
                    <td>{asset.disposed_by}</td>
                    <td>{formatDate(asset.disposed_date)}</td>
                    <td className="reason-cell" title={asset.disposed_reason}>
                      {asset.disposed_reason ? (
                        asset.disposed_reason.length > 50 
                          ? asset.disposed_reason.substring(0, 50) + '...' 
                          : asset.disposed_reason
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          {filteredAssets.length > itemsPerPage && (
            <div className="pagination-section">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredAssets.length)} of {filteredAssets.length} assets
              </div>
              <div className="pagination-controls">
                <button 
                  onClick={handlePrevPage} 
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  ← Previous
                </button>
                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={handleNextPage} 
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DisposedAssets;