"use client";

import { useRouter } from "next/navigation";
import { AdminVehicleCategoriesTree } from "@/components/admin/vehicle-categories-tree";
import { AdminVehicleMakesTable } from "@/components/admin/vehicle-makes-table";
import { AdminVehicleModelsTable } from "@/components/admin/vehicle-models-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  vehicleDataHref,
  type AdminVehicleCatalog,
  type VehicleDataTab,
} from "@/lib/admin-vehicle-data";
import { formatNumber } from "@/lib/currency";

export function AdminVehicleDataTabs({
  tab,
  catalog,
}: {
  tab: VehicleDataTab;
  catalog: AdminVehicleCatalog;
}) {
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={200}>
      <Tabs
        value={tab}
        onValueChange={(value) => {
          router.replace(vehicleDataHref(value as VehicleDataTab, catalog.selectedMakeId));
        }}
      >
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="makes">Makes</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <Card className="shadow-none">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Category tree</CardTitle>
              <CardDescription>
                {formatNumber(catalog.categories.length)} top-level categor
                {catalog.categories.length === 1 ? "y" : "ies"}. Muting hides a
                category from public search without touching existing listings.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AdminVehicleCategoriesTree categories={catalog.categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="makes">
          <Card className="shadow-none">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Makes</CardTitle>
              <CardDescription>
                {formatNumber(catalog.makes.length)} make
                {catalog.makes.length === 1 ? "" : "s"} in the catalog used by search
                and the sell form.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AdminVehicleMakesTable makes={catalog.makes} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models">
          <Card className="shadow-none">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-[13px] font-medium">Models</CardTitle>
              <CardDescription>
                Filter by make, then add models or manage variants for that make.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <AdminVehicleModelsTable
                makeOptions={catalog.makeOptions}
                selectedMakeId={catalog.selectedMakeId}
                models={catalog.models}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  );
}
