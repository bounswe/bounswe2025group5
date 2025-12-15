import {
  getBadgeImageSource,
  normalizeBadgeSlug,
  normalizeBadgeTranslationKey,
  sortBadgeNamesByPriority,
  sortBadgesByPriority,
} from "../utils/badgeUtils";

describe("badgeUtils", () => {
  describe("normalizeBadgeTranslationKey", () => {
    it("converts mixed separators and casing into camelCase starting lowercase", () => {
      expect(normalizeBadgeTranslationKey("PlasticSaver")).toBe("plasticSaver");
      expect(normalizeBadgeTranslationKey("plastic_saver")).toBe("plasticSaver");
      expect(normalizeBadgeTranslationKey("glass-legend")).toBe("glassLegend");
      expect(normalizeBadgeTranslationKey("  top challenger ")).toBe("topChallenger");
      expect(normalizeBadgeTranslationKey("")).toBe("");
    });
  });

  describe("normalizeBadgeSlug", () => {
    it("creates predictable kebab-case slugs from various inputs", () => {
      expect(normalizeBadgeSlug("PlasticSaver")).toBe("plastic-saver");
      expect(normalizeBadgeSlug("paper_saver")).toBe("paper-saver");
      expect(normalizeBadgeSlug("Glass Legend")).toBe("glass-legend");
      expect(normalizeBadgeSlug("  top-challenger ")).toBe("top-challenger");
      expect(normalizeBadgeSlug("")).toBe("");
    });
  });

  describe("getBadgeImageSource", () => {
    it("returns an image source for known badges and undefined otherwise", () => {
      expect(getBadgeImageSource("plastic-saver")).toBeTruthy();
      expect(getBadgeImageSource("Plastic Saver")).toBeTruthy();
      expect(getBadgeImageSource("unknown-badge")).toBeUndefined();
    });
  });

  describe("priority sorting", () => {
    it("sorts badge names by configured priority and keeps unknowns stable", () => {
      const names = [
        "paper-hero",
        "top-challenger",
        "unknown-one",
        "plastic-legend",
        "unknown-two",
      ];
      const sorted = sortBadgeNamesByPriority(names);

      expect(sorted.slice(0, 3)).toEqual([
        "top-challenger", // highest priority
        "plastic-legend", // next highest
        "paper-hero", // then hero tier
      ]);
      expect(sorted.slice(3)).toEqual([
        "unknown-one", // unknowns keep original order
        "unknown-two",
      ]);
    });

    it("sorts badge objects by priority while preserving stability", () => {
      const list = [
        { badgeName: "glass-saver", id: 1 },
        { badgeName: "paper-legend", id: 2 },
        { badgeName: "glass-saver", id: 3 },
      ];

      const sorted = sortBadgesByPriority(list);

      expect(sorted.map((b) => b.badgeName)).toEqual([
        "paper-legend", // higher priority
        "glass-saver",
        "glass-saver", // stable order for equal priority
      ]);
      expect(sorted.map((b) => b.id)).toEqual([2, 1, 3]);
    });
  });
});
