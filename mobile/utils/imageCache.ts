// utils/imageCache.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${FileSystem.cacheDirectory}image-cache/`;
const CACHE_METADATA_KEY = '@image_cache_metadata';
const CACHE_DURATION_MS = 21 * 24 * 60 * 60 * 1000; // 3 weeks in milliseconds

interface CacheMetadata {
  [url: string]: {
    localPath: string;
    cachedAt: number;
    expiresAt: number;
  };
}

/**
 * Initialize the cache directory
 */
async function ensureCacheDirectory(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

/**
 * Get cache metadata from AsyncStorage
 */
async function getCacheMetadata(): Promise<CacheMetadata> {
  try {
    const metadata = await AsyncStorage.getItem(CACHE_METADATA_KEY);
    return metadata ? JSON.parse(metadata) : {};
  } catch (error) {
    console.warn('Failed to read cache metadata:', error);
    return {};
  }
}

/**
 * Save cache metadata to AsyncStorage
 */
async function saveCacheMetadata(metadata: CacheMetadata): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_METADATA_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.warn('Failed to save cache metadata:', error);
  }
}

/**
 * Generate a safe filename from a URL
 */
function urlToFilename(url: string): string {
  // Create a hash-like filename from the URL
  const base64 = Buffer.from(url).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  // Extract extension from URL if possible
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? match[1] : 'jpg';
  
  return `${base64.substring(0, 100)}.${ext}`;
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const metadata = await getCacheMetadata();
    const now = Date.now();
    const updatedMetadata: CacheMetadata = {};
    let hasChanges = false;

    for (const [url, data] of Object.entries(metadata)) {
      if (now < data.expiresAt) {
        // Keep valid entries
        updatedMetadata[url] = data;
      } else {
        // Delete expired file
        hasChanges = true;
        try {
          const fileInfo = await FileSystem.getInfoAsync(data.localPath);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(data.localPath, { idempotent: true });
          }
        } catch (error) {
          console.warn('Failed to delete expired cache file:', error);
        }
      }
    }

    if (hasChanges) {
      await saveCacheMetadata(updatedMetadata);
    }
  } catch (error) {
    console.warn('Failed to clean expired cache:', error);
  }
}

/**
 * Get cached image URI or download and cache it
 */
export async function getCachedImageUri(imageUrl: string | null | undefined): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') {
    return null;
  }

  // If it's not a remote URL, return as is
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  try {
    await ensureCacheDirectory();
    
    const metadata = await getCacheMetadata();
    const now = Date.now();
    
    // Check if we have a valid cached version
    const cached = metadata[imageUrl];
    if (cached && now < cached.expiresAt) {
      const fileInfo = await FileSystem.getInfoAsync(cached.localPath);
      if (fileInfo.exists) {
        return cached.localPath;
      }
      // File doesn't exist but metadata does - clean up metadata
      delete metadata[imageUrl];
      await saveCacheMetadata(metadata);
    }

    // Download and cache the image
    const filename = urlToFilename(imageUrl);
    const localPath = `${CACHE_DIR}${filename}`;
    
    // Download the image
    const downloadResult = await FileSystem.downloadAsync(imageUrl, localPath);
    
    if (downloadResult.status === 200) {
      // Save metadata
      metadata[imageUrl] = {
        localPath: downloadResult.uri,
        cachedAt: now,
        expiresAt: now + CACHE_DURATION_MS,
      };
      await saveCacheMetadata(metadata);
      
      return downloadResult.uri;
    }
    
    // Download failed, return original URL
    return imageUrl;
  } catch (error) {
    console.warn('Failed to cache image:', imageUrl, error);
    // Return original URL on error
    return imageUrl;
  }
}

/**
 * Preload multiple images into cache
 */
export async function preloadImages(imageUrls: (string | null | undefined)[]): Promise<void> {
  const validUrls = imageUrls.filter((url): url is string => 
    Boolean(url && typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://')))
  );
  
  if (validUrls.length === 0) {
    return;
  }

  // Process in batches to avoid overwhelming the system
  const batchSize = 5;
  for (let i = 0; i < validUrls.length; i += batchSize) {
    const batch = validUrls.slice(i, i + batchSize);
    await Promise.all(batch.map(url => getCachedImageUri(url)));
  }
}

/**
 * Clear all cached images
 */
export async function clearImageCache(): Promise<void> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    }
    await AsyncStorage.removeItem(CACHE_METADATA_KEY);
  } catch (error) {
    console.warn('Failed to clear image cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalFiles: number;
  totalSize: number;
  oldestEntry: number | null;
}> {
  try {
    const metadata = await getCacheMetadata();
    const entries = Object.values(metadata);
    
    let totalSize = 0;
    let oldestEntry: number | null = null;
    
    for (const entry of entries) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
        if (fileInfo.exists && 'size' in fileInfo) {
          totalSize += fileInfo.size || 0;
        }
        if (oldestEntry === null || entry.cachedAt < oldestEntry) {
          oldestEntry = entry.cachedAt;
        }
      } catch (error) {
        // Ignore errors for individual files
      }
    }
    
    return {
      totalFiles: entries.length,
      totalSize,
      oldestEntry,
    };
  } catch (error) {
    console.warn('Failed to get cache stats:', error);
    return { totalFiles: 0, totalSize: 0, oldestEntry: null };
  }
}
