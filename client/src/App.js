import React from "react";

import AddAssetForm from "./pages/AddAssets/AddAssetForm";
import AllocateAssetForm from "./pages/Allocation/AllocateAssetForm"
import HandoverAssetForm from "./pages/Handover/HandoverAssetForm";
import AssetsList from "./pages/AssetsList/AssetsList";
import AllocationTable from "./pages/Allocation/AllocationList";
import AssetRequestForm from "./pages/AssetsList/AssetRequestForm";

const App = () => {
    return (
    <div>
      {/* <AddAssetForm /> */}
      {/* <AllocateAssetForm /> */}
      {/* <HandoverAssetForm /> */}
      {/* <AssetsList /> */}
      {/* <AllocationTable/> */}
      <AssetRequestForm/>
    </div>
    )
};

export default App;
