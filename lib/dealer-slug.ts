import { prisma } from "@/lib/prisma";

export function slugifyDealerName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || "dealer";
}

export async function uniqueDealerSlug(name: string, excludeId?: string) {
  const base = slugifyDealerName(name);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.dealer.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}
