import { supabase } from './supabase';

export type BucketType = 'posts' | 'profiles' | 'stories' | 'marketplace' | 'messages';

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile(
  bucket: BucketType,
  file: File,
  userId: string
): Promise<{ url: string; path: string } | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { url: publicUrl, path: filePath };
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
}

/**
 * Delete a file from Supabase Storage
 */
export async function deleteFile(bucket: BucketType, path: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  bucket: BucketType,
  files: File[],
  userId: string
): Promise<Array<{ url: string; path: string }>> {
  const uploads = files.map(file => uploadFile(bucket, file, userId));
  const results = await Promise.all(uploads);
  return results.filter((result): result is { url: string; path: string } => result !== null);
}

/**
 * Validate file type and size
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase();
  if (!fileExt || !allowedTypes.includes(fileExt)) {
    return { valid: false, error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` };
  }

  return { valid: true };
}

/**
 * Get file extension
 */
export function getFileExtension(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() || '';
}

/**
 * Check if file is an image
 */
export function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is a video
 */
export function isVideo(file: File): boolean {
  return file.type.startsWith('video/');
}
