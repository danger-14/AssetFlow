export type AssetType = "Laptop" | "Mobile" | "Desktop" | "Accessory";

export type DeviceCatalogItem = {
  id: string;
  product: string;
  assetType: AssetType;
  memory: string;
  cost: number;
  eolYears: number;
  location: string;
  managedByGroup: string;
  defaultAssetState: "Stock";
};
