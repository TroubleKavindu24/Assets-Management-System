// src/components/AllocateAssetForm.jsx
import React, { useState } from "react";
import "./AllocateAssetForm.css";

const AllocateAssetForm = () => {
  const [formData, setFormData] = useState({
    asset_id: "",
    req_id: "",
    ip_address: "",
    department_id: "",
    allocated_by: "",
    allocated_date: new Date().toISOString().split("T")[0],
    return_date: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const departments = ["IT", "HR", "FINANCE", "OPERATIONS", "ADMIN"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    // Validation
    if (
      !formData.asset_id ||
      !formData.req_id ||
      !formData.ip_address ||
      !formData.department_id ||
      !formData.allocated_by
    ) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5005/api/assets/asset-allocation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Allocation failed");
      }

      setMessage("Asset allocated successfully!");

      // Reset form
      setFormData({
        asset_id: "",
        req_id: "",
        ip_address: "",
        department_id: "",
        allocated_by: "",
        allocated_date: new Date().toISOString().split("T")[0],
        return_date: "",
      });
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="allocate-asset-container">
      <h2>Allocate Asset</h2>

      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="allocate-form">
        {/* Asset ID */}
        <div className="form-group">
          <label>Asset ID *</label>
          <input
            type="text"
            name="asset_id"
            value={formData.asset_id}
            onChange={handleChange}
            placeholder="e.g. 1, 25"
            required
          />
        </div>

        {/* Request ID */}
        <div className="form-group">
          <label>Request ID *</label>
          <input
            type="text"
            name="req_id"
            value={formData.req_id}
            onChange={handleChange}
            placeholder="e.g. REQ-001"
            required
          />
        </div>

        {/* IP Address */}
        <div className="form-group">
          <label>IP Address *</label>
          <input
            type="text"
            name="ip_address"
            value={formData.ip_address}
            onChange={handleChange}
            placeholder="e.g. 192.168.1.10"
            required
          />
        </div>

        {/* Department */}
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
        </div>

        {/* Allocated By */}
        <div className="form-group">
          <label>Allocated By *</label>
          <input
            type="text"
            name="allocated_by"
            value={formData.allocated_by}
            onChange={handleChange}
            placeholder="e.g. Admin / Kavindu"
            required
          />
        </div>

        {/* Allocation Date */}
        <div className="form-group">
          <label>Allocation Date</label>
          <input
            type="date"
            name="allocated_date"
            value={formData.allocated_date}
            onChange={handleChange}
          />
        </div>

        {/* Return Date */}
        <div className="form-group">
          <label>Expected Return Date</label>
          <input
            type="date"
            name="return_date"
            value={formData.return_date}
            onChange={handleChange}
            min={formData.allocated_date || undefined}
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Allocating..." : "Allocate Asset"}
        </button>
      </form>
    </div>
  );
};

export default AllocateAssetForm;