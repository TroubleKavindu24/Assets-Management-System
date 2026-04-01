// // src/components/AllocateAsset.jsx
// import React, { useState, useEffect } from 'react';
// import './AllocateAssetForm.css';

// const AllocateAsset = () => {
//   const [formData, setFormData] = useState({
//     serial_no: '',
//     ip_address: '',
//     department_id: '',
//     allocated_by: '',
//     allocated_date: new Date().toISOString().split('T')[0],
//     return_date: '',
//   });

//   const [availableAssets, setAvailableAssets] = useState([]);
//   const [message, setMessage] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     fetchAvailableAssets();
//   }, []);

//   const fetchAvailableAssets = async () => {
//     try {
//       const response = await fetch('http://localhost:5005/api/assets/asset-available/Laptop');
//       const data = await response.json();
//       if (response.ok) {
//         setAvailableAssets(data.data || []);
//       }
//     } catch (err) {
//       console.error('Error fetching assets:', err);
//     }
//   };

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage('');
//     setError('');
//     setLoading(true);

//     try {
//       const response = await fetch('http://localhost:5005/api/assets/asset-allocation', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.message || 'Allocation failed');
//       }

//       setMessage('✅ Asset allocated successfully!');
//       setFormData({
//         serial_no: '',
//         ip_address: '',
//         department_id: '',
//         allocated_by: '',
//         allocated_date: new Date().toISOString().split('T')[0],
//         return_date: '',
//       });
//       fetchAvailableAssets();
//       setTimeout(() => setMessage(''), 3000);
//     } catch (err) {
//       setError(err.message);
//       setTimeout(() => setError(''), 3000);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="allocate-container">
//       <div className="form-header">
//         <h2>Allocate Asset</h2>
//         <p>Assign an asset to a department</p>
//       </div>

//       {message && <div className="success-message">{message}</div>}
//       {error && <div className="error-message">{error}</div>}

//       <form onSubmit={handleSubmit} className="allocate-form">
//         <div className="form-row">
//           <div className="form-group">
//             <label>Serial Number *</label>
//             <input
//               type="text"
//               name="serial_no"
//               value={formData.serial_no}
//               onChange={handleChange}
//               required
//               placeholder="Enter serial number"
//               className="form-control"
//               list="assets-list"
//             />
//             <datalist id="assets-list">
//               {availableAssets.map(asset => (
//                 <option key={asset.serial_no} value={asset.serial_no} />
//               ))}
//             </datalist>
//           </div>

//           <div className="form-group">
//             <label>IP Address *</label>
//             <input
//               type="text"
//               name="ip_address"
//               value={formData.ip_address}
//               onChange={handleChange}
//               required
//               placeholder="e.g., 192.168.1.100"
//               className="form-control"
//             />
//           </div>
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>Department ID *</label>
//             <input
//               type="number"
//               name="department_id"
//               value={formData.department_id}
//               onChange={handleChange}
//               required
//               placeholder="Enter department ID"
//               className="form-control"
//             />
//           </div>

//           <div className="form-group">
//             <label>Allocated By *</label>
//             <input
//               type="text"
//               name="allocated_by"
//               value={formData.allocated_by}
//               onChange={handleChange}
//               required
//               placeholder="Name of person allocating"
//               className="form-control"
//             />
//           </div>
//         </div>

//         <div className="form-row">
//           <div className="form-group">
//             <label>Allocated Date</label>
//             <input
//               type="date"
//               name="allocated_date"
//               value={formData.allocated_date}
//               onChange={handleChange}
//               className="form-control"
//             />
//           </div>

//           <div className="form-group">
//             <label>Return Date (Expected)</label>
//             <input
//               type="date"
//               name="return_date"
//               value={formData.return_date}
//               onChange={handleChange}
//               className="form-control"
//             />
//           </div>
//         </div>

//         <div className="form-actions">
//           <button type="submit" disabled={loading} className="submit-btn">
//             {loading ? 'Allocating...' : 'Allocate Asset'}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default AllocateAsset;