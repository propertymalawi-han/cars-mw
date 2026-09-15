"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

export function ListingGallery({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] overflow-hidden rounded-lg border bg-muted sm:aspect-[16/10]" />
    );
  }

  return (
    <div className="space-y-3">
      <Carousel setApi={setApi} className="overflow-hidden rounded-lg border bg-muted">
        <CarouselContent className="-ml-0">
          {images.map((src, index) => (
            <CarouselItem key={`${src}-${index}`} className="pl-0">
              <div className="relative aspect-[16/9] bg-muted sm:aspect-[16/10]">
                <Image
                  src={src}
                  alt={`${title} — photo ${index + 1}`}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 ? (
          <>
            <CarouselPrevious className="left-3 h-11 w-11 border-0 bg-card/90 shadow-sm disabled:opacity-40" />
            <CarouselNext className="right-3 h-11 w-11 border-0 bg-card/90 shadow-sm disabled:opacity-40" />
          </>
        ) : null}
      </Carousel>
      {images.length > 1 ? (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((src, index) => (
            <button
              key={`${src}-thumb-${index}`}
              type="button"
              onClick={() => api?.scrollTo(index)}
              aria-label={`Show photo ${index + 1}`}
              aria-current={current === index ? true : undefined}
              className={cn(
                "relative h-16 w-[5.5rem] shrink-0 overflow-hidden rounded-md border bg-muted",
                current === index
                  ? "border-foreground ring-1 ring-foreground"
                  : "opacity-80 hover:opacity-100",
              )}
            >
              <Image
                src={src}
                alt=""
                fill
                className="object-cover"
                sizes="88px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
