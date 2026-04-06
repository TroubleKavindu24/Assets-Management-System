// constants/permissions.constants.js
module.exports = {
  // Permission types
  PERMISSIONS: {
    ADD_ASSET: {
      id: "ADD_ASSET",
      label: "Add Asset",
      description: "Can add new assets to the system",
      category: "Asset Management"
    },
    VIEW_ASSETS_LIST: {
      id: "VIEW_ASSETS_LIST",
      label: "View Assets List",
      description: "Can view all assets in the system",
      category: "Asset Management"
    },
    ALLOCATE_ASSET: {
      id: "ALLOCATE_ASSET",
      label: "Allocate Asset",
      description: "Can allocate assets to departments",
      category: "Asset Management"
    },
    VIEW_ALLOCATIONS_LIST: {
      id: "VIEW_ALLOCATIONS_LIST",
      label: "View Allocations List",
      description: "Can view all asset allocations",
      category: "Asset Management"
    },
    MANAGE_HANDOVER: {
      id: "MANAGE_HANDOVER",
      label: "Manage Handover",
      description: "Can manage asset handovers",
      category: "Asset Management"
    },
    DISPOSE_ASSET: {
      id: "DISPOSE_ASSET",
      label: "Dispose Asset",
      description: "Can dispose assets",
      category: "Asset Management"
    },
    VIEW_DISPOSED_LIST: {
      id: "VIEW_DISPOSED_LIST",
      label: "View Disposed List",
      description: "Can view disposed assets list",
      category: "Asset Management"
    }
  },

  // Role default permissions
  ROLE_DEFAULT_PERMISSIONS: {
    SUPER_ADMIN: [
      "ADD_ASSET",
      "VIEW_ASSETS_LIST",
      "ALLOCATE_ASSET",
      "VIEW_ALLOCATIONS_LIST",
      "MANAGE_HANDOVER",
      "DISPOSE_ASSET",
      "VIEW_DISPOSED_LIST"
    ],
    ADMIN: [
      "ADD_ASSET",
      "VIEW_ASSETS_LIST",
      "ALLOCATE_ASSET",
      "VIEW_ALLOCATIONS_LIST",
      "MANAGE_HANDOVER",
      "DISPOSE_ASSET",
      "VIEW_DISPOSED_LIST"
    ],
    STAFF: []  // STAFF gets permissions individually assigned by SUPER_ADMIN
  },

  // All available permissions
  ALL_PERMISSIONS: [
    { id: "ADD_ASSET", label: "Add Asset", description: "Can add new assets to the system" },
    { id: "VIEW_ASSETS_LIST", label: "View Assets List", description: "Can view all assets" },
    { id: "ALLOCATE_ASSET", label: "Allocate Asset", description: "Can allocate assets to departments" },
    { id: "VIEW_ALLOCATIONS_LIST", label: "View Allocations List", description: "Can view all asset allocations" },
    { id: "MANAGE_HANDOVER", label: "Manage Handover", description: "Can manage asset handovers" },
    { id: "DISPOSE_ASSET", label: "Dispose Asset", description: "Can dispose assets" },
    { id: "VIEW_DISPOSED_LIST", label: "View Disposed List", description: "Can view disposed assets list" }
  ]
};