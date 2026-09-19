import type { PrismaClient } from "@prisma/client";
import {
  DEFAULT_VEHICLE_CATEGORY_TREE,
  type DefaultCategoryNode,
} from "../lib/vehicle-categories";

async function upsertNode(
  prisma: PrismaClient,
  node: DefaultCategoryNode,
  parentId: string | null,
) {
  const existing = await prisma.vehicleCategory.findUnique({
    where: { slug: node.slug },
    select: { id: true },
  });
  const row = existing
    ? await prisma.vehicleCategory.update({
        where: { id: existing.id },
        data: {
          name: node.name,
          parentId,
          sortOrder: node.sortOrder,
        },
      })
    : await prisma.vehicleCategory.create({
        data: {
          name: node.name,
          slug: node.slug,
          parentId,
          sortOrder: node.sortOrder,
        },
      });

  for (const child of node.children ?? []) {
    await upsertNode(prisma, child, row.id);
  }
  return row;
}

export async function seedVehicleCategories(prisma: PrismaClient) {
  for (const node of DEFAULT_VEHICLE_CATEGORY_TREE) {
    await upsertNode(prisma, node, null);
  }
  return prisma.vehicleCategory.count();
}
