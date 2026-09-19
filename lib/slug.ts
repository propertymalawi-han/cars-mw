export function slugify(value: string, fallback = "item"): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || fallback;
}

export function uniqueSlug(
  value: string,
  taken: Iterable<string>,
  fallback = "item",
): string {
  const used = new Set(
    Array.from(taken, (item) => item.trim().toLowerCase()).filter(Boolean),
  );
  const base = slugify(value, fallback);
  if (!used.has(base)) return base;
  for (let index = 2; index < 100; index += 1) {
    const next = `${base}-${index}`.slice(0, 48);
    if (!used.has(next)) return next;
  }
  return `${base}-${Date.now().toString(36)}`.slice(0, 48);
}
