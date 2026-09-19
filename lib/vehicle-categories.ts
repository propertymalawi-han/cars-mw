import {
  CATEGORY_GROUPS,
  categoryDisplayName,
  type VehicleCategory,
} from "@/lib/vehicle-search";

export type DefaultCategoryNode = {
  name: string;
  slug: string;
  sortOrder: number;
  children?: DefaultCategoryNode[];
};

export const DEFAULT_VEHICLE_CATEGORY_TREE: DefaultCategoryNode[] = [
  { name: "Cars", slug: "cars", sortOrder: 1 },
  { name: "Bikes", slug: "bikes", sortOrder: 2 },
  {
    name: "Leisure",
    slug: "leisure",
    sortOrder: 3,
    children: [
      { name: "Boats", slug: "boats", sortOrder: 1 },
      { name: "Caravans", slug: "caravans", sortOrder: 2 },
    ],
  },
  {
    name: "Commercial",
    slug: "commercial",
    sortOrder: 4,
    children: [
      { name: "Trucks", slug: "trucks", sortOrder: 1 },
      { name: "Buses", slug: "buses", sortOrder: 2 },
      { name: "Trailers", slug: "trailers", sortOrder: 3 },
      { name: "Attachments", slug: "attachments", sortOrder: 4 },
    ],
  },
];

export type PublicCategoryItem = {
  slug: VehicleCategory;
  name: string;
};

export type PublicCategoryGroup = {
  id: string;
  label: string | null;
  items: PublicCategoryItem[];
};

export type CatalogCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  status: "active" | "muted";
  sortOrder: number;
};

export function fallbackPublicCategoryGroups(): PublicCategoryGroup[] {
  return CATEGORY_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items.map((slug) => ({
      slug,
      name: categoryDisplayName(slug),
    })),
  }));
}

function isMutedInTree(
  row: CatalogCategoryRecord,
  byId: Map<string, CatalogCategoryRecord>,
): boolean {
  let current: CatalogCategoryRecord | undefined = row;
  while (current) {
    if (current.status === "muted") return true;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return false;
}

export function buildPublicCategoryGroups(
  rows: CatalogCategoryRecord[],
): PublicCategoryGroup[] {
  if (rows.length === 0) return fallbackPublicCategoryGroups();

  const byId = new Map(rows.map((row) => [row.id, row]));
  const childrenOf = new Map<string | null, CatalogCategoryRecord[]>();
  for (const row of rows) {
    const key = row.parentId;
    const list = childrenOf.get(key) ?? [];
    list.push(row);
    childrenOf.set(key, list);
  }
  for (const list of Array.from(childrenOf.values())) {
    list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }

  const groups: PublicCategoryGroup[] = [];
  const pendingLeaves: PublicCategoryItem[] = [];
  const pendingId = { current: "top" };

  function flushLeaves() {
    if (pendingLeaves.length === 0) return;
    groups.push({
      id: pendingId.current,
      label: null,
      items: pendingLeaves.splice(0, pendingLeaves.length),
    });
  }

  const roots = childrenOf.get(null) ?? [];
  for (const root of roots) {
    if (isMutedInTree(root, byId)) continue;
    const children = (childrenOf.get(root.id) ?? []).filter(
      (child) => !isMutedInTree(child, byId),
    );
    if (children.length > 0) {
      flushLeaves();
      groups.push({
        id: root.id,
        label: root.name,
        items: children.map((child) => ({
          slug: child.slug,
          name: child.name,
        })),
      });
      continue;
    }
    if (pendingLeaves.length === 0) pendingId.current = root.id;
    pendingLeaves.push({ slug: root.slug, name: root.name });
  }
  flushLeaves();

  return groups.length > 0 ? groups : fallbackPublicCategoryGroups();
}
