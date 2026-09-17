const VEHICLE_ID_PREFIX = "CMW";
const VEHICLE_NUMBER_START = 10001;

export function formatVehicleId(vehicleNumber: number) {
  const padded = String(Math.max(vehicleNumber, 0)).padStart(5, "0");
  return `${VEHICLE_ID_PREFIX}-${padded}`;
}

export function nextSeedVehicleNumber(index: number) {
  return VEHICLE_NUMBER_START + index;
}
