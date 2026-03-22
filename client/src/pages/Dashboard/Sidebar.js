import React from "react";

const Sidebar = ({ setPage }) => {
  return (
    <div
      style={{
        width: "200px",
        backgroundColor: "#f4f4f4",
        height: "100vh",
        paddingTop: "20px",
        boxShadow: "2px 0px 5px rgba(0,0,0,0.1)"
      }}
    >
      <ul style={{ listStyle: "none", padding: 0 }}>
        <li style={{ padding: "10px", cursor: "pointer" }} onClick={() => setPage("dashboard")}>Dashboard</li>
        <li style={{ padding: "10px", cursor: "pointer" }} onClick={() => setPage("assetRequest")}>Asset Requests</li>
        <li style={{ padding: "10px", cursor: "pointer" }} onClick={() => setPage("assetAllocation")}>Asset Allocation</li>
        <li style={{ padding: "10px", cursor: "pointer" }} onClick={() => setPage("assetHandover")}>Asset Handover</li>
      </ul>
    </div>
  );
};

export default Sidebar;