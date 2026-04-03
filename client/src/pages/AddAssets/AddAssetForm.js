// src/components/AddAssetForm.jsx
import React, { useState } from 'react';
import Footer from '../../components/Footer';
import './AddAssetForm.css';

const AddAssetForm = () => {
  const [formData, setFormData] = useState({
    asset_type: '',
    serial_no: '',
    brand: '',
    os: '',
    purchase_date: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.asset_type || !formData.serial_no.trim()) {
      setError("Asset type and serial number are required");
      return;
    }

    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5005/api/assets/add-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serial_no: formData.serial_no.trim(),
          brand: formData.brand || 'N/A',
          os: formData.os || 'N/A',
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
      });

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
    });
  };

  return (
    <div className="form-page">
      <div className="form-wrapper">
        <div className="form-container">
          <div className="form-header">
            <h2>Add New Asset</h2>
            <p>Fill in the details below to add a new asset to inventory</p>
          </div>

          {message && <div className="message success">{message}</div>}
          {error && <div className="message error">{error}</div>}

          <form onSubmit={handleSubmit}>
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
                  <option value="Machine">Machine</option>
                  <option value="Printer">Printer</option>
                  <option value="Other">Other</option>
                </select>
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
              </div>
            </div>

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
            </div>

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