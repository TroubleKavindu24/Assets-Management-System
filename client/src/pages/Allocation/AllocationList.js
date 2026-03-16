import React, { useEffect, useState } from "react";
import axios from "axios";

function AllocationTable() {

  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const getAllocations = async () => {
    try {
      const res = await axios.get("http://localhost:5005/api/assets/getAllAllocations");
      setAllocations(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllocations();
  }, []);

  if (loading) {
    return <h3>Loading allocations...</h3>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h2>Asset Allocations</h2>

      <table border="1" cellPadding="10" style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th>Allocation ID</th>
            <th>Asset ID</th>
            <th>Request ID</th>
            <th>IP Address</th>
            <th>Department</th>
            <th>Allocated By</th>
            <th>Allocated Date</th>
            <th>Return Date</th>
          </tr>
        </thead>

        <tbody>
          {allocations.map((item) => (
            <tr key={item.allocation_id}>
              <td>{item.allocation_id}</td>
              <td>{item.asset_id}</td>
              <td>{item.req_id}</td>
              <td>{item.ip_address}</td>
              <td>{item.department_id}</td>
              <td>{item.allocated_by}</td>
              <td>{new Date(item.allocated_date).toLocaleDateString()}</td>
              <td>
                {item.return_date
                  ? new Date(item.return_date).toLocaleDateString()
                  : "N/A"}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default AllocationTable;