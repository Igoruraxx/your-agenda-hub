import { supabase } from './supabase';

const BUCKETS = [
  { name: 'evolution-photos', public: true },
  { name: 'bioimpedance-images', public: true },
];

let bucketsChecked = false;

export async function ensureStorageBuckets(): Promise<void> {
  if (bucketsChecked) return;
  bucketsChecked = true;

  for (const bucket of BUCKETS) {
    try {
      const { error } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
        fileSizeLimit: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
      });
      if (error) {
        const expected = error.message.includes('already exists')
          || error.message.includes('Duplicate')
          || error.message.includes('row-level security');
        if (!expected) {
          console.warn(`[Storage] Bucket "${bucket.name}":`, error.message);
        }
      }
    } catch {
      // Silencioso
    }
  }
}
