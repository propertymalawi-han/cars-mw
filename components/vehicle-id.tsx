import { cn } from "@/lib/utils";
import { formatVehicleId } from "@/lib/vehicle-id";

export function VehicleId({
  vehicleNumber,
  className,
}: {
  vehicleNumber: number;
  className?: string;
}) {
  return (
    <span className={cn("font-mono tabular-nums tracking-wide", className)}>
      {formatVehicleId(vehicleNumber)}
    </span>
  );
}
