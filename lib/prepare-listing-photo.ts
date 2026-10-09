const MAX_EDGE = 1600;
const START_QUALITY = 0.8;
const TARGET_MAX_BYTES = 600 * 1024;

function canvasSupports(type: string) {
  const canvas = document.createElement("canvas");
  return canvas.toDataURL(type).startsWith(`data:${type}`);
}

function outputType() {
  return canvasSupports("image/webp") ? "image/webp" : "image/jpeg";
}

function renderBitmap(
  bitmap: ImageBitmap,
  scale: number,
  type: string,
  quality: number,
) {
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare this photo on this phone.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not prepare this photo."));
      },
      type,
      quality,
    );
  });
}

/**
 * Downscale a gallery photo in the browser before upload.
 * Long edge is capped at 1600px and the file is re-encoded as WebP or JPEG
 * near 0.8 quality, aiming for under 600 KB.
 */
export async function prepareListingPhoto(file: File): Promise<File> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Could not read this photo. Choose a JPG or PNG from your gallery.");
  }

  try {
    if (bitmap.width < 1 || bitmap.height < 1) {
      throw new Error("Could not read this photo.");
    }

    const longest = Math.max(bitmap.width, bitmap.height);
    let scale = longest > MAX_EDGE ? MAX_EDGE / longest : 1;
    const type = outputType();
    let quality = START_QUALITY;
    let blob = await renderBitmap(bitmap, scale, type, quality);

    while (blob.size > TARGET_MAX_BYTES && quality > 0.5) {
      quality = Math.round((quality - 0.1) * 10) / 10;
      blob = await renderBitmap(bitmap, scale, type, quality);
    }

    while (blob.size > TARGET_MAX_BYTES && scale > 0.35) {
      scale *= 0.85;
      blob = await renderBitmap(bitmap, scale, type, quality);
    }

    const extension = type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.${extension}`, {
      type,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
