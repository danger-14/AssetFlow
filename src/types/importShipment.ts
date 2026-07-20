export type ShipmentSource = "pdf" | "manual";

export type ShipmentDevice = {
  id: string;
  model: string;
  serial: string;
  selected: boolean;
  source: ShipmentSource;
};
