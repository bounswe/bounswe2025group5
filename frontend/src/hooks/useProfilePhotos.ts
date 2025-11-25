import { useState, useEffect } from 'react';
import { UsersApi } from '@/lib/api/users';

// Global cache to avoid re-fetching the same profile photos
const profilePhotoCache = new Map<string, string | null>();

/**
 * Hook to fetch profile photos for a list of usernames
 * Returns a map of username -> photoUrl
 */
export function useProfilePhotos(usernames: string[]) {
  const [photoMap, setPhotoMap] = useState<Map<string, string | null>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (usernames.length === 0) return;

      // Filter out usernames we already have in cache
      const uncachedUsernames = usernames.filter(username => !profilePhotoCache.has(username));
      
      if (uncachedUsernames.length === 0) {
        // All usernames are cached, just update state
        const cached = new Map<string, string | null>();
        usernames.forEach(username => {
          cached.set(username, profilePhotoCache.get(username) || null);
        });
        setPhotoMap(cached);
        return;
      }

      setIsLoading(true);

      // Fetch profiles in parallel for uncached usernames
      const fetchPromises = uncachedUsernames.map(async (username) => {
        try {
          const profile = await UsersApi.getProfile(username);
          const photoUrl = profile.photoUrl || null;
          profilePhotoCache.set(username, photoUrl);
          return { username, photoUrl };
        } catch (error) {
          console.error(`Error fetching profile for ${username}:`, error);
          profilePhotoCache.set(username, null);
          return { username, photoUrl: null };
        }
      });

      await Promise.all(fetchPromises);

      // Update state with all usernames (cached + newly fetched)
      const newMap = new Map<string, string | null>();
      usernames.forEach(username => {
        newMap.set(username, profilePhotoCache.get(username) || null);
      });
      setPhotoMap(newMap);
      setIsLoading(false);
    };

    fetchPhotos();
  }, [JSON.stringify(usernames.sort())]); // Sort to avoid re-fetching on order changes

  return { photoMap, isLoading };
}

/**
 * Hook to fetch a single user's profile photo
 */
export function useProfilePhoto(username: string | null | undefined) {
  const usernames = username ? [username] : [];
  const { photoMap, isLoading } = useProfilePhotos(usernames);
  
  return {
    photoUrl: username ? photoMap.get(username) || null : null,
    isLoading,
  };
}

/**
 * Clear the profile photo cache (useful for logout or profile updates)
 */
export function clearProfilePhotoCache(username?: string) {
  if (username) {
    profilePhotoCache.delete(username);
  } else {
    profilePhotoCache.clear();
  }
}
