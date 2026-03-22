import React, { useEffect, useState } from "react";
import axios from "axios";

const Allocation = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5005/api/assets/getAllAllocations")
      .then((res) => setData(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div>
      <h1>Asset Allocations</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>ID</th>
            <th>Asset ID</th>
            <th>Department</th>
            <th>Allocated By</th>
          </tr>
        </thead>

        <tbody>
          {data.map((item) => (
            <tr key={item.allocation_id}>
              <td>{item.allocation_id}</td>
              <td>{item.asset_id}</td>
              <td>{item.department_id}</td>
              <td>{item.allocated_by}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Allocation;