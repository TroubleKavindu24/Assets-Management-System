import React from "react";

import AddAssetForm from "./pages/AddAssets/AddAssetForm";
import AllocateAssetForm from "./pages/Allocation/AllocateAssetForm"
import HandoverAssetForm from "./pages/Handover/HandoverAssetForm";
import AssetsList from "./pages/AssetsList/AssetsList";


const App = () => {
    return (
    <div>
      {/* <AddAssetForm /> */}
      {/* <AllocateAssetForm /> */}
      {/* <HandoverAssetForm /> */}
      <AssetsList />
    </div>
    )
};

export default App;
