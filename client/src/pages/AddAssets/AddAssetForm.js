// src/components/AddAssetForm.jsx
import React, { useState } from 'react';
import './AddAssetForm.css';

const AddAssetForm = () => {
  const [formData, setFormData] = useState({
    asset_type: '',
    serial_no: '',
    brand: '',
    os: '',
    purchase_date: '',
    ram_capacity: '',
    hard_drive: '',
    processor: '',
    model: '',
    gen: '',
    warranty_period_months: '',
    status: 'AVAILABLE'
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const brandOptions = [
    { value: '', label: 'Select Brand' },
    { value: 'HP', label: 'HP' },
    { value: 'DELL', label: 'DELL' },
    { value: 'TOSHIBA', label: 'TOSHIBA' },
    { value: 'Lenovo', label: 'Lenovo' },
    { value: 'Apple', label: 'Apple' },
    { value: 'N/A', label: 'N/A' },
  ];

  const osOptions = [
    { value: '', label: 'Select OS' },
    { value: 'Windows 10', label: 'Windows 10' },
    { value: 'Windows 11', label: 'Windows 11' },
    { value: 'macOS', label: 'macOS' },
    { value: 'N/A', label: 'N/A' },
  ];

  const statusOptions = [
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'ALLOCATED', label: 'Allocated' },
    { value: 'UNDER_REPAIR', label: 'Under Repair' },
    { value: 'RETIRED', label: 'Retired' },
  ];

  // Helper function to check if specs section should be shown (Laptop or Desktop PC)
  const shouldShowSpecs = () => {
    return formData.asset_type === 'Laptop' || formData.asset_type === 'Desktop PC';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.asset_type) {
      errors.asset_type = 'Asset type is required';
    }
    if (!formData.serial_no.trim()) {
      errors.serial_no = 'Serial number is required';
    }

    // Validation for Laptop and Desktop PC types - specs required
    if (formData.asset_type === 'Laptop' || formData.asset_type === 'Desktop PC') {
      if (!formData.ram_capacity) {
        errors.ram_capacity = 'RAM capacity is required';
      }
      if (!formData.hard_drive) {
        errors.hard_drive = 'Hard drive is required';
      }
      if (!formData.processor) {
        errors.processor = 'Processor is required';
      }
    }

    // Warranty period validation
    if (formData.warranty_period_months) {
      const months = parseInt(formData.warranty_period_months);
      if (isNaN(months) || months < 0 || months > 120) {
        errors.warranty_period_months = 'Warranty period must be between 0 and 120 months';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix the validation errors');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:5005/api/assets/add-asset', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          asset_type: formData.asset_type,
          serial_no: formData.serial_no.trim(),
          brand: formData.brand || 'N/A',
          os: formData.os || 'N/A',
          purchase_date: formData.purchase_date || null,
          ram_capacity: shouldShowSpecs() ? formData.ram_capacity : null,
          hard_drive: shouldShowSpecs() ? formData.hard_drive : null,
          processor: shouldShowSpecs() ? formData.processor : null,
          model: formData.model || null,
          gen: formData.gen || null,
          warranty_period_months: formData.warranty_period_months ? parseInt(formData.warranty_period_months) : null,
          status: formData.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to add asset');
      }

      setMessage('Asset added successfully!');
      setFormData({
        asset_type: '',
        serial_no: '',
        brand: '',
        os: '',
        purchase_date: '',
        ram_capacity: '',
        hard_drive: '',
        processor: '',
        model: '',
        gen: '',
        warranty_period_months: '',
        status: 'AVAILABLE'
      });
      setValidationErrors({});

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      asset_type: '',
      serial_no: '',
      brand: '',
      os: '',
      purchase_date: '',
      ram_capacity: '',
      hard_drive: '',
      processor: '',
      model: '',
      gen: '',
      warranty_period_months: '',
      status: 'AVAILABLE'
    });
    setValidationErrors({});
  };

  return (
    <div className="form-page">
      <div>
        <h2>Add New Asset</h2>
      </div>
      <div className="form-wrapper">
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <div className="form-para">
              <p>Fill in the details below to add a new asset to inventory</p>
            </div>
            
            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}
            
            {/* Row 1: Asset Type and Serial Number */}
            <div className="form-row">
              <div className="form-group">
                <label>Asset Type <span className="required">*</span></label>
                <select
                  name="asset_type"
                  value={formData.asset_type}
                  onChange={handleChange}
                  required
                  className="form-control"
                >
                  <option value="">Select Type</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop PC">Desktop PC</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Printer">Printer</option>
                  <option value="Other">Other</option>
                </select>
                {validationErrors.asset_type && <span className="error-text">{validationErrors.asset_type}</span>}
              </div>

              <div className="form-group">
                <label>Serial Number <span className="required">*</span></label>
                <input
                  type="text"
                  name="serial_no"
                  value={formData.serial_no}
                  onChange={handleChange}
                  required
                  placeholder="Enter serial number"
                  className="form-control"
                />
                {validationErrors.serial_no && <span className="error-text">{validationErrors.serial_no}</span>}
              </div>
            </div>

            {/* Row 2: Brand and OS */}
            <div className="form-row">
              <div className="form-group">
                <label>Brand</label>
                <select
                  name="brand"
                  value={formData.brand}
                  onChange={handleChange}
                  className="form-control"
                >
                  {brandOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Operating System</label>
                <select
                  name="os"
                  value={formData.os}
                  onChange={handleChange}
                  className="form-control"
                >
                  {osOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Model and Generation */}
            <div className="form-row">
              <div className="form-group">
                <label>Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  placeholder="e.g., EliteBook, OptiPlex, Precision"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Generation</label>
                <input
                  type="text"
                  name="gen"
                  value={formData.gen}
                  onChange={handleChange}
                  placeholder="e.g., 11th Gen, 12th Gen, M2"
                  className="form-control"
                />
              </div>
            </div>

            {/* Row 4: Purchase Date and Warranty Period */}
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Date</label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Warranty Period (Months)</label>
                <input
                  type="number"
                  name="warranty_period_months"
                  value={formData.warranty_period_months}
                  onChange={handleChange}
                  placeholder="e.g., 12, 24, 36"
                  className="form-control"
                  min="0"
                  max="120"
                />
                {validationErrors.warranty_period_months && <span className="error-text">{validationErrors.warranty_period_months}</span>}
              </div>
            </div>

            {/* Specs Section - Shows only for Laptop and Desktop PC */}
            {shouldShowSpecs() && (
              <div className="specs-section">
                <div className="form-section-title">
                  <h4>Hardware Specifications</h4>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>RAM Capacity <span className="required">*</span></label>
                    <input
                      type="text"
                      name="ram_capacity"
                      value={formData.ram_capacity}
                      onChange={handleChange}
                      placeholder="e.g., 8GB, 16GB, 32GB, 64GB"
                      className="form-control"
                    />
                    {validationErrors.ram_capacity && <span className="error-text">{validationErrors.ram_capacity}</span>}
                  </div>

                  <div className="form-group">
                    <label>Hard Drive <span className="required">*</span></label>
                    <input
                      type="text"
                      name="hard_drive"
                      value={formData.hard_drive}
                      onChange={handleChange}
                      placeholder="e.g., 256GB SSD, 512GB SSD, 1TB HDD, 2TB SSD"
                      className="form-control"
                    />
                    {validationErrors.hard_drive && <span className="error-text">{validationErrors.hard_drive}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Processor <span className="required">*</span></label>
                    <input
                      type="text"
                      name="processor"
                      value={formData.processor}
                      onChange={handleChange}
                      placeholder="e.g., Intel Core i5-1240P, Intel Core i7-13700H, AMD Ryzen 7 7840U, Apple M2"
                      className="form-control"
                    />
                    {validationErrors.processor && <span className="error-text">{validationErrors.processor}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-control"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? 'Adding...' : 'Add Asset'}
              </button>
              <button type="button" onClick={handleReset} className="btn-secondary">
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetForm;