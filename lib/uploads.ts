import { createHash } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSupabase } from "@/lib/supabase/server";
import {
  LISTING_PHOTO_BUCKET,
  MAX_LISTING_PHOTO_BYTES,
} from "@/lib/upload-limits";

export {
  LISTING_PHOTO_BUCKET,
  MAX_LISTING_PHOTO_BYTES,
  MAX_LISTING_PHOTOS,
} from "@/lib/upload-limits";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
};

export class UploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

function extensionFor(file: File) {
  const fromType = EXT_BY_TYPE[file.type];
  if (fromType) return fromType;
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  return "jpg";
}

function objectKey(file: File) {
  return `${crypto.randomUUID()}.${extensionFor(file)}`;
}

export function assertListingPhoto(file: File) {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Use a JPG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_LISTING_PHOTO_BYTES) {
    throw new UploadError("Each photo must be 8 MB or smaller.");
  }
}

function cloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName) return null;
  if (preset) return { cloudName, preset, apiKey, apiSecret, mode: "unsigned" as const };
  if (apiKey && apiSecret) {
    return { cloudName, preset, apiKey, apiSecret, mode: "signed" as const };
  }
  return null;
}

function s3Config() {
  const bucket = process.env.AWS_S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!bucket || !region || !accessKeyId || !secretAccessKey) return null;
  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    publicUrl: process.env.AWS_S3_PUBLIC_URL,
  };
}

async function uploadToCloudinary(file: File) {
  const config = cloudinaryConfig();
  if (!config) return null;

  const body = new FormData();
  body.append("file", file);
  body.append("folder", "cars-mw/listings");

  if (config.mode === "unsigned" && config.preset) {
    body.append("upload_preset", config.preset);
  } else if (config.mode === "signed" && config.apiKey && config.apiSecret) {
    const timestamp = Math.round(Date.now() / 1000);
    const toSign = `folder=cars-mw/listings&timestamp=${timestamp}${config.apiSecret}`;
    const signature = createHash("sha1").update(toSign).digest("hex");
    body.append("api_key", config.apiKey);
    body.append("timestamp", String(timestamp));
    body.append("signature", signature);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: "POST", body },
  );
  const json = (await response.json()) as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !json.secure_url) {
    throw new UploadError(json.error?.message ?? "Cloudinary upload failed.", 502);
  }
  return json.secure_url;
}

async function uploadToS3(file: File) {
  const config = s3Config();
  if (!config) return null;

  const key = `listings/${objectKey(file)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  if (config.publicUrl) {
    return `${config.publicUrl.replace(/\/$/, "")}/${key}`;
  }
  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
}

async function uploadToSupabase(file: File) {
  const path = objectKey(file);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await getSupabase()
    .storage.from(LISTING_PHOTO_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new UploadError(error.message, 502);
  }

  const { data } = getSupabase().storage.from(LISTING_PHOTO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadListingPhoto(file: File) {
  assertListingPhoto(file);

  const cloudinaryUrl = await uploadToCloudinary(file);
  if (cloudinaryUrl) return { url: cloudinaryUrl, provider: "cloudinary" as const };

  const s3Url = await uploadToS3(file);
  if (s3Url) return { url: s3Url, provider: "s3" as const };

  const supabaseUrl = await uploadToSupabase(file);
  return { url: supabaseUrl, provider: "supabase" as const };
}
