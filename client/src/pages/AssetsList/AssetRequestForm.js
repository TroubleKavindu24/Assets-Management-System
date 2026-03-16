import React, { useState } from "react";
import axios from "axios";

// Departments & Asset Types should match your backend constants
const DEPARTMENTS = ["IT", "HR", "FINANCE", "OPERATIONS", "ADMIN"];
const ASSET_TYPES = ["Laptop", "Machine", "Printer", "Other"];

function AssetRequestForm() {
  const [formData, setFormData] = useState({
    department_id: "",
    requested_by: "",
    asset_type: "",
    quantity: 1,
    request_type: "",
    budget_type: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5005/api/assets/createRequest",
        formData
      );
      setMessage(res.data.message);

      // Clear form
      setFormData({
        department_id: "",
        requested_by: "",
        asset_type: "",
        quantity: 1,
        request_type: "",
        budget_type: ""
      });

    } catch (error) {
      setMessage(
        error.response?.data?.message || "Error submitting request"
      );
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "500px" }}>
      <h2>Submit Asset Request</h2>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Department</label>
          <select
            name="department_id"
            value={formData.department_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Requested By</label>
          <input
            type="text"
            name="requested_by"
            value={formData.requested_by}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Asset Type</label>
          <select
            name="asset_type"
            value={formData.asset_type}
            onChange={handleChange}
            required
          >
            <option value="">Select Asset Type</option>
            {ASSET_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Request Type</label>
          <input
            type="text"
            name="request_type"
            value={formData.request_type}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Budget Type</label>
          <input
            type="text"
            name="budget_type"
            value={formData.budget_type}
            onChange={handleChange}
          />
        </div>

        <br />

        <button type="submit">Submit Request</button>

      </form>

      {message && (
        <p style={{ marginTop: "20px", color: "green" }}>{message}</p>
      )}
    </div>
  );
}

export default AssetRequestForm;