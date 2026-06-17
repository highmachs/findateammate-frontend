import { v2 as cloudinary } from "cloudinary";
import { logger } from "./logger";

// Supports either a single CLOUDINARY_URL env var (recommended — Cloudinary dashboard "API environment variable")
// or the three individual vars CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET.
// The SDK reads CLOUDINARY_URL automatically when individual vars are absent.
if (process.env.CLOUDINARY_URL) {
  // SDK parses cloudinary://API_KEY:API_SECRET@CLOUD_NAME automatically
  cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL, secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export type UploadFolder = "findateammate/avatars" | "findateammate/events";

/**
 * Upload a buffer directly to Cloudinary via upload_stream.
 * Returns the secure HTTPS URL — permanent, CDN-backed, survives Render restarts.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: UploadFolder,
  publicIdPrefix?: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const options: Record<string, any> = {
      folder,
      resource_type: "auto",
      overwrite: false,
    };

    if (publicIdPrefix) {
      options.public_id = `${publicIdPrefix}-${Date.now()}`;
    }

    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error || !result) {
        logger.error("Cloudinary upload failed", error);
        return reject(error || new Error("Cloudinary upload returned no result"));
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });

    stream.end(buffer);
  });
}

/**
 * Delete an asset from Cloudinary by its public_id.
 * Safe to call even if the asset doesn't exist.
 */
export async function deleteFromCloudinary(publicIdOrUrl: string): Promise<void> {
  try {
    // If it's a full Cloudinary URL, extract the public_id
    // e.g. https://res.cloudinary.com/demo/image/upload/v123/findateammate/avatars/user-abc.jpg
    // public_id = findateammate/avatars/user-abc  (no extension)
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith("https://res.cloudinary.com/")) {
      // Strip query params, strip extension, strip /upload/vXXX/ prefix
      const parts = publicIdOrUrl.split("/upload/");
      if (parts.length === 2) {
        const afterUpload = parts[1].replace(/^v\d+\//, ""); // remove version
        publicId = afterUpload.replace(/\.[^.]+$/, "");      // remove extension
      }
    }
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    // Non-fatal — log and move on
    logger.error("Cloudinary delete failed", err);
  }
}

export { cloudinary };
