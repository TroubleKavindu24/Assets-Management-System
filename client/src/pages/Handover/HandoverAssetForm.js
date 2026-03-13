// src/components/HandoverAssetForm.jsx
import React, { useState } from 'react';
import './HandoverAssetForm.css'; // optional styling

const HandoverAssetForm = () => {
  const [formData, setFormData] = useState({
    asset_id: '',
    department_id: '',
    condition_note: '',
    handover_date: new Date().toISOString().split('T')[0], // today by default
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = ['IT', 'HR', 'FINANCE', 'OPERATIONS', 'ADMIN'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    // Basic client-side validation
    if (!formData.asset_id || !formData.department_id) {
      setError('Asset ID and Department are required');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5005/api/assets/handover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Handover failed');
      }

      setMessage('Asset handed over successfully! Status changed to AVAILABLE.');
      
      // Reset form
      setFormData({
        asset_id: '',
        department_id: '',
        condition_note: '',
        handover_date: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="handover-container">
      <h2>Handover / Return Asset</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="handover-form">
        <div className="form-group">
          <label>Serial Number *</label>
          <input
            type="text"
            name="serial_no"
            value={formData.serial_no}
            onChange={handleChange}
            placeholder="e.g. 5, 42, 1001"
            required
          />
          <small>Enter the numeric ID of the currently allocated asset</small>
        </div>

        <div className="form-group">
          <label>Department *</label>
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Department --</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          <small>Department the asset was allocated to</small>
        </div>

        <div className="form-group">
          <label>Handover Date</label>
          <input
            type="date"
            name="handover_date"
            value={formData.handover_date}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Condition Note</label>
          <textarea
            name="condition_note"
            value={formData.condition_note}
            onChange={handleChange}
            placeholder="e.g. Minor scratches on lid, fully functional, charger included..."
            rows={3}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Processing...' : 'Handover Asset'}
        </button>
      </form>
    </div>
  );
};

export default HandoverAssetForm;