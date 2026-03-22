import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/NavBar";
import Dashboard from "./pages/Dashboard/Dashboard";
import AddAssetForm from "./pages/AddAssets/AddAssetForm";
import AllocateAssetForm from "./pages/Allocation/AllocateAssetForm";
import AllocateList from "./pages/Allocation/AllocationList";
import AssetRequest from "./pages/AssetsList/AssetRequestForm";
import AssetsList from "./pages/AssetsList/AssetsList";


const App = () => {
  return (
    <Router>
      <Navbar />
      <div style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assetForm" element={<AddAssetForm />} />
          <Route path="/allocate-form" element={<AllocateAssetForm />} />
          <Route path="/allocate-list" element={<AllocateList />} />


          <Route path="/req-asset" element={<AssetRequest />} />
          <Route path="/assets-list" element={<AssetsList />} />
        </Routes>
      </div>
    </Router>
   );
};

export default App;