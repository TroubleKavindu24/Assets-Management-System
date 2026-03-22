import React, { useState } from "react";
import axios from "axios";
import "./AllocateAssetForm.css";

const AllocateAssetForm = () => {
  const [formData, setFormData] = useState({
    asset_type: "",
    serial_no: "",
    ip_address: "",
    department_id: "",
    allocated_by: "",
    allocated_date: new Date().toISOString().split("T")[0],
    return_date: "",
  });

  const [availableAssets, setAvailableAssets] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const assetTypes = ["Laptop", "Machine", "Printer", "Other"];
  const departments = ["IT", "HR", "FINANCE", "OPERATIONS", "ADMIN"];

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 🔥 When asset_type changes → fetch available assets
    if (name === "asset_type") {
      fetchAvailableAssets(value);
      setFormData((prev) => ({
        ...prev,
        asset_type: value,
        serial_no: "" // reset serial_no
      }));
    }
  };

  // Fetch AVAILABLE assets by type
  const fetchAvailableAssets = async (type) => {
    if (!type) return;

    try {
      setLoadingAssets(true);
      const res = await axios.get(
        `http://localhost:5005/api/assets/available-by-type/${type}`
      );
      setAvailableAssets(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load available assets");
    } finally {
      setLoadingAssets(false);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    if (
      !formData.serial_no ||
      !formData.ip_address ||
      !formData.department_id ||
      !formData.allocated_by
    ) {
      setError("Please fill all required fields");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:5005/api/assets/allocate",
        formData
      );

      setMessage("Asset allocated successfully!");

      // Reset form
      setFormData({
        asset_type: "",
        serial_no: "",
        ip_address: "",
        department_id: "",
        allocated_by: "",
        allocated_date: new Date().toISOString().split("T")[0],
        return_date: "",
      });

      setAvailableAssets([]);

    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Allocation failed");
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

        {/* Asset Type */}
        <div className="form-group">
          <label>Asset Type *</label>
          <select
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Type --</option>
            {assetTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Serial No (Dynamic Dropdown) */}
        <div className="form-group">
          <label>Serial Number *</label>

          {loadingAssets ? (
            <p>Loading available assets...</p>
          ) : (
            <select
              name="serial_no"
              value={formData.serial_no}
              onChange={handleChange}
              required
              disabled={!availableAssets.length}
            >
              <option value="">
                {availableAssets.length
                  ? "-- Select Serial No --"
                  : "No available assets"}
              </option>

              {availableAssets.map((asset) => (
                <option key={asset.asset_id} value={asset.serial_no}>
                  {asset.serial_no} ({asset.brand || "N/A"})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* IP Address */}
        <div className="form-group">
          <label>IP Address *</label>
          <input
            type="text"
            name="ip_address"
            value={formData.ip_address}
            onChange={handleChange}
            required
            placeholder="192.168.1.10"
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
            required
            placeholder="Admin / Kavindu"
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
          <label>Return Date</label>
          <input
            type="date"
            name="return_date"
            value={formData.return_date}
            onChange={handleChange}
            min={formData.allocated_date}
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}>
          {loading ? "Allocating..." : "Allocate Asset"}
        </button>

      </form>
    </div>
  );
};

export default AllocateAssetForm;