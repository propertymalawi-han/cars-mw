import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminVehicleDataTabs } from "@/components/admin/vehicle-data-tabs";
import {
  getAdminVehicleCatalog,
  parseSelectedMakeId,
  parseVehicleDataTab,
} from "@/lib/admin-vehicle-data";

export const metadata: Metadata = {
  title: "Vehicle Data",
};

export default async function AdminVehicleDataPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const tab = parseVehicleDataTab(searchParams?.tab);
  const catalog = await getAdminVehicleCatalog(parseSelectedMakeId(searchParams?.makeId));

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Vehicle Data"
        description="Manage marketplace categories and the make, model, and variant catalog used by search and listing forms."
      />
      <AdminVehicleDataTabs tab={tab} catalog={catalog} />
    </div>
  );
}
