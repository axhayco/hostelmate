import { supabase } from "@/integrations/supabase/client";

const BUCKET = "hostel_images";

/**
 * Uploads a hostel image to Supabase Storage.
 * Validation: Strict checks for allowed file types (JPEG, PNG, WEBP)
 * Validation: Size limit of 5MB
 * Sanitization: Only trust hardcoded extension mappings.
 * Returns the public URL of the uploaded file.
 * Throws an error if the upload fails.
 */
export async function uploadHostelImage(file: File): Promise<string> {
  // SECURITY: Validate mime type strictly against whitelist
  const allowedTypes: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };

  if (!allowedTypes[file.type]) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
  }

  // SECURITY: Validate file size (max 5 MB)
  const MAX_SIZE_MB = 5;
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`File is too large. Maximum allowed size is ${MAX_SIZE_MB}MB.`);
  }

  // SECURITY: Sanitize extension by using the mapped safe extension
  const ext = allowedTypes[file.type];
  const path = `hostels/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
