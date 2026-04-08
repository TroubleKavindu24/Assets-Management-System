// src/components/AssetList.jsx - Add dispose button and modal
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AssetList.css';
import AllocateAssetModal from '../Allocation/AllocateAssetModal';
import HandoverAssetModal from './HandoverAssetModal';
import DisposeAssetModal from '../../components/DisposeAssetModal';

const AssetList = () => {
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showDisposeModal, setShowDisposeModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Search and Filter States
  const [searchType, setSearchType] = useState('serial_no');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  // Get token from localStorage
  const getToken = () => localStorage.getItem('token');

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchTerm, searchType, filterStatus, filterType, assets]);

  const fetchAssets = async () => {
    try {
      const token = getToken();
      const response = await fetch('http://localhost:5005/api/assets/assetsList', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setAssets(data.data || []);
        setFilteredAssets(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch assets');
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];
    
    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(asset => {
        switch (searchType) {
          case 'serial_no':
            return asset.serial_no?.toLowerCase().includes(term);
          case 'type':
            return asset.asset_type?.toLowerCase().includes(term);
          case 'brand':
            return asset.brand?.toLowerCase().includes(term);
          case 'model':
            return asset.model?.toLowerCase().includes(term);
          default:
            return asset.serial_no?.toLowerCase().includes(term);
        }
      });
    }
    
    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }
    
    // Type filter
    if (filterType) {
      filtered = filtered.filter(asset => asset.asset_type === filterType);
    }
    
    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const handleAllocateClick = (asset) => {
    setSelectedAsset(asset);
    setShowAllocateModal(true);
  };

  const handleHandoverClick = (asset) => {
    setSelectedAsset(asset);
    setShowHandoverModal(true);
  };

  const handleDisposeClick = (asset) => {
    setSelectedAsset(asset);
    setShowDisposeModal(true);
  };

  const handleModalClose = () => {
    setShowAllocateModal(false);
    setShowHandoverModal(false);
    setShowDisposeModal(false);
    setSelectedAsset(null);
    fetchAssets(); // Refresh the list
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'status-available';
      case 'ALLOCATED': return 'status-allocated';
      case 'UNDER_REPAIR': return 'status-repair';
      case 'RETIRED': return 'status-retired';
      default: return '';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'AVAILABLE': return 'Available';
      case 'ALLOCATED': return 'Allocated';
      case 'UNDER_REPAIR': return 'Under Repair';
      case 'RETIRED': return 'Retired';
      default: return status;
    }
  };

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

  const clearFilters = () => {
    setSearchTerm('');
    setSearchType('serial_no');
    setFilterStatus('');
    setFilterType('');
  };

  // Get unique asset types and statuses for filters
  const uniqueAssetTypes = [...new Set(assets.map(a => a.asset_type))];
  const uniqueStatuses = [...new Set(assets.map(a => a.status))];

  if (loading) return <div className="loading">Loading assets...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="asset-list-container">
      <div className="list-header">
        <div className="header-left">
          <h2>Asset Inventory</h2>
          <p className="asset-count">Total Assets: {assets.length}</p>
        </div>
        <button 
          onClick={() => navigate('/assetForm')} 
          className="add-asset-btn"
          title="Add New Asset"
        >
          + Add Asset
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="search-section">
        <div className="search-controls">
          <div className="search-type-selector">
            <label>Search by:</label>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
              className="search-select"
            >
              <option value="serial_no">Serial Number</option>
              <option value="type">Asset Type</option>
              <option value="brand">Brand</option>
              <option value="model">Model</option>
            </select>
          </div>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={`Search by ${searchType === 'serial_no' ? 'Serial Number' : searchType === 'type' ? 'Asset Type' : searchType === 'brand' ? 'Brand' : 'Model'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-search-btn" title="Clear search">
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Type:</label>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              {uniqueAssetTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {(searchTerm || filterStatus || filterType) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              Clear All Filters
            </button>
          )}
        </div>

        <div className="search-stats">
          {filteredAssets.length !== assets.length && (
            <span className="search-results-count">
              Showing {filteredAssets.length} of {assets.length} assets
            </span>
          )}
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📦</div>
          <h3>No matching assets found</h3>
          <p>No assets match your search criteria. Try a different search term or clear filters.</p>
          <button onClick={clearFilters} className="clear-filters-btn">Clear Filters</button>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="asset-table">
              <thead>
                <tr>
                  <th>Serial No</th>
                  <th>Type</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>OS</th>
                  <th>RAM</th>
                  <th>Storage</th>
                  <th>Status</th>
                  <th>Purchase Date</th>
                  <th>Warranty</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((asset) => (
                  <tr key={asset.asset_id}>
                    <td><strong>{asset.serial_no}</strong></td>
                    <td>{asset.asset_type}</td>
                    <td>{asset.brand}</td>
                    <td>{asset.model || '-'}</td>
                    <td>{asset.os || '-'}</td>
                    <td>{asset.ram_capacity || '-'}</td>
                    <td>{asset.hard_drive || '-'}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(asset.status)}`}>
                        {getStatusLabel(asset.status)}
                      </span>
                    </td>
                    <td>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
                    <td>
                      {asset.warranty_end_date ? (
                        <span className={`warranty-badge ${new Date(asset.warranty_end_date) > new Date() ? 'warranty-active' : 'warranty-expired'}`}>
                          {new Date(asset.warranty_end_date) > new Date() ? 'Active' : 'Expired'}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="allocate-btn"
                        onClick={() => handleAllocateClick(asset)}
                        disabled={asset.status !== 'AVAILABLE'}
                        title={asset.status !== 'AVAILABLE' ? 'Asset not available for allocation' : 'Allocate this asset'}
                      >
                        Allocate
                      </button>
                      <button 
                        className="handover-btn"
                        onClick={() => handleHandoverClick(asset)}
                        disabled={asset.status !== 'ALLOCATED'}
                        title={asset.status !== 'ALLOCATED' ? 'Asset is not allocated' : 'Handover this asset'}
                      >
                        Handover
                      </button>
                      <button 
                        className="dispose-btn"
                        onClick={() => handleDisposeClick(asset)}
                        disabled={asset.status === 'RETIRED'}
                        title={asset.status === 'RETIRED' ? 'Asset already disposed' : 'Dispose this asset'}
                      >
                        Dispose
                      </button>
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

      <AllocateAssetModal
        isOpen={showAllocateModal}
        onClose={handleModalClose}
        asset={selectedAsset}
      />

      <HandoverAssetModal
        isOpen={showHandoverModal}
        onClose={handleModalClose}
        asset={selectedAsset}
      />

      <DisposeAssetModal
        isOpen={showDisposeModal}
        onClose={handleModalClose}
        asset={selectedAsset}
        onDisposeSuccess={fetchAssets}
      />
    </div>
  );
};

export default AssetList;