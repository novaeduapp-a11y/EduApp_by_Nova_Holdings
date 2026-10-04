import { v2 as cloudinary } from "cloudinary";

function configured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function isCloudinaryConfigured() {
  return configured();
}

function ensureCloudinary() {
  if (!configured()) {
    throw new Error("Cloudinary n’est pas configuré (CLOUDINARY_*)");
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

export type UploadFolder = "avatars" | "eleves" | "documents" | "bulletins" | "misc";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const MAX_BYTES = 8 * 1024 * 1024; // 8 Mo

export async function uploadBuffer(params: {
  buffer: Buffer;
  mimeType: string;
  folder?: UploadFolder;
  publicId?: string;
  filename?: string;
}) {
  ensureCloudinary();
  if (!ALLOWED_MIME.has(params.mimeType)) {
    throw new Error("Type de fichier non autorisé (images ou PDF uniquement)");
  }
  if (params.buffer.byteLength > MAX_BYTES) {
    throw new Error("Fichier trop volumineux (max 8 Mo)");
  }

  const folder = `eduapps/${params.folder ?? "misc"}`;
  const resourceType = params.mimeType === "application/pdf" ? "raw" : "image";

  return new Promise<{
    url: string;
    secureUrl: string;
    publicId: string;
    bytes: number;
    format?: string;
    resourceType: string;
  }>((resolve, reject) => {
    const stream = ensureCloudinary().uploader.upload_stream(
      {
        folder,
        public_id: params.publicId,
        resource_type: resourceType,
        overwrite: Boolean(params.publicId),
        unique_filename: !params.publicId,
        use_filename: Boolean(params.filename),
        filename_override: params.filename,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Échec upload Cloudinary"));
          return;
        }
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          bytes: result.bytes,
          format: result.format,
          resourceType: result.resource_type,
        });
      }
    );
    stream.end(params.buffer);
  });
}

export async function destroyUpload(publicId: string, resourceType: "image" | "raw" = "image") {
  ensureCloudinary();
  return ensureCloudinary().uploader.destroy(publicId, { resource_type: resourceType });
}
