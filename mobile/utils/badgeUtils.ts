import { ImageSourcePropType } from "react-native";

const splitBadgeName = (badgeName: string): string[] => {
  if (!badgeName) return [];
  return badgeName
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase like plasticSaver -> plastic Saver
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
};

export const normalizeBadgeTranslationKey = (badgeName: string): string => {
  const words = splitBadgeName(badgeName);
  if (words.length === 0) return "";

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");
};

export const normalizeBadgeSlug = (badgeName: string): string => {
  const words = splitBadgeName(badgeName);
  return words.map((word) => word.toLowerCase()).join("-");
};

const badgeImageMap: Record<string, ImageSourcePropType> = {
  "plastic-saver": require("@/assets/images/plastic-saver.png"),
  "plastic-hero": require("@/assets/images/plastic-hero.png"),
  "plastic-legend": require("@/assets/images/plastic-legend.png"),
  "paper-saver": require("@/assets/images/paper-saver.png"),
  "paper-hero": require("@/assets/images/paper-hero.png"),
  "paper-legend": require("@/assets/images/paper-legend.png"),
  "glass-saver": require("@/assets/images/glass-saver.png"),
  "glass-hero": require("@/assets/images/glass-hero.png"),
  "glass-legend": require("@/assets/images/glass-legend.png"),
  "metal-saver": require("@/assets/images/metal-saver.png"),
  "metal-hero": require("@/assets/images/metal-hero.png"),
  "metal-legend": require("@/assets/images/metal-legend.png"),
  "organic-saver": require("@/assets/images/organic-saver.png"),
  "organic-hero": require("@/assets/images/organic-hero.png"),
  "organic-legend": require("@/assets/images/organic-legend.png"),
  "top-challenger": require("@/assets/images/top-challenger.png"),
};

export const getBadgeImageSource = (
  badgeName: string
): ImageSourcePropType | undefined => {
  const slug = normalizeBadgeSlug(badgeName);
  return badgeImageMap[slug];
};

export const knownBadgeSlugs = Object.keys(badgeImageMap);
