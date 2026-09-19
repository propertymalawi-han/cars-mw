"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const page = Math.min(Math.max(filters.page, 1), Math.max(totalPages, 1));
  const pages = visiblePages(page, totalPages);
  const previousHref = listingsHref({ ...filters, page: Math.max(1, page - 1) });
  const nextHref = listingsHref({
    ...filters,
    page: Math.min(Math.max(totalPages, 1), page + 1),
  });

  useEffect(() => {
    if (totalPages <= 1) return;
    if (page > 1) router.prefetch(previousHref);
    if (page < totalPages) router.prefetch(nextHref);
  }, [nextHref, page, previousHref, router, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent className="max-w-full flex-wrap justify-center gap-1">
        <PaginationItem>
          <PaginationPrevious
            href={previousHref}
            prefetch
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
                prefetch={item === page + 1 || item === page - 1}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href={nextHref}
            prefetch
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
