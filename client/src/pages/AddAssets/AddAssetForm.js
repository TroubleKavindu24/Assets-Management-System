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
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    setMessage('Asset added successfully!');
    setFormData({
      asset_type: '',
      serial_no: '',
      brand: '',
      os: '',
      purchase_date: '',
    });

  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="add-asset-container">
      <h2>Add New Asset</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="asset-form">
        <div className="form-group">
          <label>Asset Type *</label>
          <select
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Type --</option>
            <option value="Laptop">Laptop</option>
            <option value="Machine">Machine</option>
            <option value="Printer">Printer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Serial Number *</label>
          <input
            type="text"
            name="serial_no"
            value={formData.serial_no}
            onChange={handleChange}
            required
            placeholder="Enter serial number"
          />
        </div>

        <div className="form-group">
          <label>Brand</label>
          <input
            type="text"
            name="brand"
            value={formData.brand}
            onChange={handleChange}
            placeholder="e.g. Dell, HP, Lenovo"
          />
        </div>

        <div className="form-group">
          <label>Operating System</label>
          <input
            type="text"
            name="os"
            value={formData.os}
            onChange={handleChange}
            placeholder="e.g. Windows 11 Pro, macOS Ventura"
          />
        </div>

        <div className="form-group">
          <label>Purchase Date</label>
          <input
            type="date"
            name="purchase_date"
            value={formData.purchase_date}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Adding...' : 'Add Asset'}
        </button>
      </form>
    </div>
  );
};

export default AddAssetForm;