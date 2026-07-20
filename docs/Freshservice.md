# Freshservice Integration

## Purpose

AssetFlow integrates with Freshservice for asset management only.

---

## Allowed Operations

### Create Asset

AssetFlow may create a new asset if the serial number does not already exist.

---

### Update Asset

AssetFlow may update only the following fields:

- Display Name
- Used By
- Department
- Asset State

---

## Prohibited Operations

AssetFlow must never:

- Delete assets
- Modify Product
- Modify Serial Number
- Modify Cost
- Modify Storage Capacity
- Modify Asset Type
- Modify unrelated Freshservice records
- Modify Tickets
- Modify Users

---

## Duplicate Protection

Before creating an asset:

1. Search Freshservice using the serial number.
2. If the asset already exists:
   - Stop the process.
   - Display:
     "Asset already exists."
3. Do not create a duplicate asset.
