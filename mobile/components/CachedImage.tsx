// components/CachedImage.tsx
import React, { useEffect, useState } from "react";
import {
  Image,
  ImageProps,
  ActivityIndicator,
  View,
  StyleSheet,
} from "react-native";
import { getCachedImageUri } from "../utils/imageCache";

interface CachedImageProps extends Omit<ImageProps, "source"> {
  source: { uri: string | null | undefined } | number;
  showLoader?: boolean;
  loaderSize?: "small" | "large";
  loaderColor?: string;
}

/**
 * CachedImage component that automatically caches remote images
 */
export default function CachedImage({
  source,
  showLoader = true,
  loaderSize = "small",
  loaderColor,
  style,
  ...props
}: CachedImageProps) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      // Handle local images (require())
      if (typeof source === "number") {
        setCachedUri(null);
        setLoading(false);
        return;
      }

      const uri = source.uri;

      if (!uri) {
        setCachedUri(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const cached = await getCachedImageUri(uri);
        if (isMounted) {
          setCachedUri(cached);
          setLoading(false);
        }
      } catch (error) {
        console.warn("CachedImage: Failed to load image", error);
        if (isMounted) {
          setCachedUri(uri); // Fallback to original URI
          setLoading(false);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [typeof source === "number" ? source : source.uri]);

  // For local images (require())
  if (typeof source === "number") {
    return <Image source={source} style={style} {...props} />;
  }

  // Show loader while caching
  if (loading && showLoader) {
    // Extract view-compatible style properties
    const flattenedStyle = StyleSheet.flatten(style);
    const viewStyle = flattenedStyle
      ? {
          width: flattenedStyle.width,
          height: flattenedStyle.height,
          backgroundColor: flattenedStyle.backgroundColor,
          borderRadius: flattenedStyle.borderRadius,
        }
      : {};
    return (
      <View style={[viewStyle, styles.loaderContainer]}>
        <ActivityIndicator size={loaderSize} color={loaderColor} />
      </View>
    );
  }

  // Show cached or fallback image
  if (cachedUri) {
    return <Image source={{ uri: cachedUri }} style={style} {...props} />;
  }

  // No image to show
  return null;
}

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
