# AssetFlow Workflow

## Overview

AssetFlow has two primary workflows:

1. Import Shipment
2. Assign Device

---

## Workflow 1 - Import Shipment

Purpose:
Import newly received devices into Freshservice.

Steps:

1. Upload an invoice.
2. Read the model and serial number from the invoice.
3. Check if the serial number already exists in Freshservice.
4. If the asset exists:
   - Skip the asset.
   - Display "Asset already exists."
5. If the asset does not exist:
   - Create the asset.
   - Asset State = Stock.
   - Display Name = Product Model.
   - Used By = Empty.

---

## Workflow 2 - Assign Device

Purpose:
Assign an existing stock asset to a user.

Steps:

1. Search for an existing asset.
2. Select the user.
3. Update:
   - Display Name = Product Model + User Name
   - Used By
   - Department
   - Asset State = In Use

Only the approved fields may be updated.

No delete operations are permitted.
No modification of product, serial number, cost, or storage is permitted.
