import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export function slugifyDealerName(name: string) {
  return slugify(name, "dealer");
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
