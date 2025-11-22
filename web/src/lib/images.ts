import { supabase } from '@/integrations/supabase/client';

/**
 * Get the public URL for a candidate image
 * Handles both Supabase Storage URLs and local paths
 */
export function getCandidateImageUrl(imagePath: string): string {
  // If it's already a full URL (http/https), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If it starts with '/', it's a local public path
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // Otherwise, assume it's a path in Supabase Storage bucket 'candidates'
  const { data } = supabase.storage
    .from('candidates')
    .getPublicUrl(imagePath);

  return data.publicUrl;
}

/**
 * Get candidate avatar URL with fallback
 */
export function getCandidateAvatar(imagePath: string | null | undefined): string {
  if (!imagePath) {
    // Default avatar placeholder
    return '/icon/image.png'; // Using app icon as fallback
  }

  return getCandidateImageUrl(imagePath);
}
