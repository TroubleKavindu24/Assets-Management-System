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

  // ✅ Dropdowns
  const brandOptions = ['', 'HP', 'DELL', 'TOSHIBA', 'EPSON'];
  const osOptions = ['', 'Windows 10', 'Windows 11'];

  // ✅ Conditions
  const isComputer = () =>
    formData.asset_type === 'Laptop' || formData.asset_type === 'Desktop PC';

  const isPeripheral = () =>
    formData.asset_type === 'Monitor' || formData.asset_type === 'Printer';

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // ✅ VALIDATION
  const validateForm = () => {
    const errors = {};

    if (!formData.asset_type) {
      errors.asset_type = 'Asset type is required';
    }

    if (!formData.serial_no.trim()) {
      errors.serial_no = 'Serial number is required';
    }

    if (isComputer()) {
      if (!formData.ram_capacity) errors.ram_capacity = 'RAM required';
      if (!formData.hard_drive) errors.hard_drive = 'Hard drive required';
      if (!formData.processor) errors.processor = 'Processor required';
    }

    if (formData.warranty_period_months) {
      const months = parseInt(formData.warranty_period_months);
      if (isNaN(months) || months < 0 || months > 120) {
        errors.warranty_period_months = 'Warranty must be 0–120 months';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

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
          os: isPeripheral() ? null : (formData.os || 'N/A'),
          purchase_date: formData.purchase_date || null,
          ram_capacity: isComputer() ? formData.ram_capacity : null,
          hard_drive: isComputer() ? formData.hard_drive : null,
          processor: isComputer() ? formData.processor : null,
          model: formData.model || null,
          gen: isPeripheral() ? null : (formData.gen || null),
          warranty_period_months: formData.warranty_period_months
            ? parseInt(formData.warranty_period_months)
            : null,
          status: formData.status
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // ✅ Duplicate serial error
        if (result.message && result.message.includes('serial')) {
          setValidationErrors(prev => ({
            ...prev,
            serial_no: 'Serial number already exists'
          }));
        }
        throw new Error(result.message || 'Failed to add asset');
      }

      setMessage('Asset added successfully!');
      handleReset();

    } catch (err) {
      setError(err.message || 'Error occurred');
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
      <h2>Add New Asset</h2>

      <div className="form-wrapper">
        <div className="form-container">
          <form onSubmit={handleSubmit}>

            <div className="form-para">
              <p>Fill in the details below to add a new asset</p>
            </div>

            {message && <div className="message success">{message}</div>}
            {error && <div className="message error">{error}</div>}

            {/* Row 1 */}
            <div className="form-row">
              <div className="form-group">
                <label>Asset Type *</label>
                <select name="asset_type" value={formData.asset_type} onChange={handleChange} className="form-control">
                  <option value="">Select Type</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop PC">Desktop PC</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Printer">Printer</option>
                </select>
                {validationErrors.asset_type && <span className="error-text">{validationErrors.asset_type}</span>}
              </div>

              <div className="form-group">
                <label>Serial Number *</label>
                <input
                  type="text"
                  name="serial_no"
                  value={formData.serial_no}
                  onChange={handleChange}
                  className="form-control"
                />
                {validationErrors.serial_no && <span className="error-text">{validationErrors.serial_no}</span>}
              </div>
            </div>

            {/* Row 2 */}
            <div className="form-row">
              <div className="form-group">
                <label>Brand</label>
                <select name="brand" value={formData.brand} onChange={handleChange} className="form-control">
                  {brandOptions.map((b, i) => (
                    <option key={i} value={b}>{b || 'Select Brand'}</option>
                  ))}
                </select>
              </div>

              {!isPeripheral() && (
                <div className="form-group">
                  <label>Operating System</label>
                  <select name="os" value={formData.os} onChange={handleChange} className="form-control">
                    {osOptions.map((o, i) => (
                      <option key={i} value={o}>{o || 'Select OS'}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Row 3 */}
            <div className="form-row">
              <div className="form-group">
                <label>Model</label>
                <input name="model" value={formData.model} onChange={handleChange} className="form-control" />
              </div>

              {!isPeripheral() && (
                <div className="form-group">
                  <label>Generation</label>
                  <input name="gen" value={formData.gen} onChange={handleChange} className="form-control" />
                </div>
              )}
            </div>

            {/* Row 4 */}
            <div className="form-row">
              <div className="form-group">
                <label>Purchase Date</label>
                <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleChange} className="form-control" />
              </div>

              <div className="form-group">
                <label>Warranty (Months)</label>
                <input type="number" name="warranty_period_months" value={formData.warranty_period_months} onChange={handleChange} className="form-control" />
                {validationErrors.warranty_period_months && <span className="error-text">{validationErrors.warranty_period_months}</span>}
              </div>
            </div>

            {/* Specs */}
            {isComputer() && (
              <div className="specs-section">
                <div className="form-section-title">
                  <h4>Hardware Specifications</h4>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>RAM *</label>
                    <input name="ram_capacity" value={formData.ram_capacity} onChange={handleChange} className="form-control" />
                    {validationErrors.ram_capacity && <span className="error-text">{validationErrors.ram_capacity}</span>}
                  </div>

                  <div className="form-group">
                    <label>Hard Drive *</label>
                    <input name="hard_drive" value={formData.hard_drive} onChange={handleChange} className="form-control" />
                    {validationErrors.hard_drive && <span className="error-text">{validationErrors.hard_drive}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Processor *</label>
                  <input name="processor" value={formData.processor} onChange={handleChange} className="form-control" />
                  {validationErrors.processor && <span className="error-text">{validationErrors.processor}</span>}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Adding...' : 'Add Asset'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                Clear
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetForm;