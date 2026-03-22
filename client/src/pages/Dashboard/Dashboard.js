import React from "react";

const Dashboard = () => {
  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome to your system dashboard.</p>

      <div style={{ display: "flex", gap: "20px" }}>
        <div style={{ border: "1px solid #ccc", padding: "20px" }}>
          <h3>Total Assets</h3>
          <p>100</p>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "20px" }}>
          <h3>Allocations</h3>
          <p>50</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;