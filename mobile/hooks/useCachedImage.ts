// hooks/useCachedImage.ts
import { useEffect, useState } from 'react';
import { getCachedImageUri } from '../utils/imageCache';

/**
 * Hook to get a cached image URI
 */
export function useCachedImage(imageUrl: string | null | undefined) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (!imageUrl) {
        setCachedUri(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const cached = await getCachedImageUri(imageUrl);
        if (isMounted) {
          setCachedUri(cached);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load image'));
          setCachedUri(imageUrl); // Fallback to original URI
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [imageUrl]);

  return { cachedUri, loading, error };
}
