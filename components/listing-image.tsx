"use client";

import { useState } from "react";
import Image from "next/image";

function shouldSkipOptimizer(src: string) {
  try {
    return new URL(src).hostname === "images.unsplash.com";
  } catch {
    return false;
  }
}

export function ListingImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className={className}
      sizes={sizes}
      priority={priority}
      quality={70}
      unoptimized={shouldSkipOptimizer(src)}
      onError={() => setFailed(true)}
    />
  );
}
