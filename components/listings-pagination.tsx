import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { listingsHref, type ListingFilters } from "@/lib/listing-filters";

type ListingsPaginationProps = {
  filters: ListingFilters;
  totalPages: number;
};

export function ListingsPagination({
  filters,
  totalPages,
}: ListingsPaginationProps) {
  if (totalPages <= 1) return null;

  const page = Math.min(Math.max(filters.page, 1), totalPages);
  const pages = visiblePages(page, totalPages);

  return (
    <Pagination>
      <PaginationContent className="max-w-full flex-wrap justify-center gap-1">
        <PaginationItem>
          <PaginationPrevious
            href={listingsHref({ ...filters, page: Math.max(1, page - 1) })}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
            className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pages.map((item, index) =>
          item === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={item}>
              <PaginationLink
                href={listingsHref({ ...filters, page: item })}
                isActive={item === page}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href={listingsHref({
              ...filters,
              page: Math.min(totalPages, page + 1),
            })}
            aria-disabled={page >= totalPages}
            tabIndex={page >= totalPages ? -1 : undefined}
            className={
              page >= totalPages ? "pointer-events-none opacity-50" : undefined
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function visiblePages(
  page: number,
  totalPages: number,
): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) items.push("ellipsis");
  for (let value = start; value <= end; value += 1) items.push(value);
  if (end < totalPages - 1) items.push("ellipsis");
  items.push(totalPages);
  return items;
}
