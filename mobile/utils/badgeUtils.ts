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

const getBadgePriority = (badgeName: string): number => {
  const lower = badgeName.toLowerCase();
  if (lower.includes("legend")) return 0;
  if (lower.includes("hero")) return 1;
  if (lower.includes("saver")) return 2;
  return 3;
};

export const sortBadgesByPriority = <T extends { badgeName: string }>(
  list: T[]
): T[] => {
  return [...list]
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const pa = getBadgePriority(a.item.badgeName);
      const pb = getBadgePriority(b.item.badgeName);
      if (pa !== pb) return pa - pb;
      return a.index - b.index;
    })
    .map(({ item }) => item);
};

export const sortBadgeNamesByPriority = (names: string[]): string[] => {
  return names
    .map((name, index) => ({ name, index }))
    .sort((a, b) => {
      const pa = getBadgePriority(a.name);
      const pb = getBadgePriority(b.name);
      if (pa !== pb) return pa - pb;
      return a.index - b.index;
    })
    .map(({ name }) => name);
};
