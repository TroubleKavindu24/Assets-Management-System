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
  
  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [searchTerm, searchType, assets]);

  const fetchAssets = async () => {
    try {
      const response = await fetch('http://localhost:5005/api/assets/assetsList');
      const data = await response.json();
      
      if (response.ok) {
        setAssets(data.data || []);
        setFilteredAssets(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch assets');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = [...assets];
    
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
          default:
            return asset.serial_no?.toLowerCase().includes(term);
        }
      });
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
    fetchAssets();
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

  const clearSearch = () => {
    setSearchTerm('');
    setSearchType('serial_no');
  };

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

      {/* Search Section */}
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
            </select>
          </div>
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder={`Search by ${searchType === 'serial_no' ? 'Serial Number' : searchType === 'type' ? 'Asset Type' : 'Brand'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="clear-search-btn" title="Clear search">
                ✕
              </button>
            )}
          </div>
          <div className="search-stats">
            {searchTerm && (
              <span className="search-results-count">
                Found {filteredAssets.length} result{filteredAssets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="no-data">
          {searchTerm ? (
            <>
              <div className="no-data-icon">🔍</div>
              <h3>No matching assets found</h3>
              <p>No assets match your search criteria. Try a different search term.</p>
              <button onClick={clearSearch} className="clear-filters-btn">Clear Search</button>
            </>
          ) : (
            <>
              <div className="no-data-icon">📦</div>
              <h3>No Assets Found</h3>
              <p>No assets have been added yet. Click the + Add Asset button to get started!</p>
            </>
          )}
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
                  <th>OS</th>
                  <th>Status</th>
                  <th>Purchase Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((asset) => (
                  <tr key={asset.asset_id}>
                    <td><strong>{asset.serial_no}</strong></td>
                    <td>{asset.asset_type}</td>
                    <td>{asset.brand}</td>
                    <td>{asset.os}</td>
                    <td>
                      <span className={`status-badge ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
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