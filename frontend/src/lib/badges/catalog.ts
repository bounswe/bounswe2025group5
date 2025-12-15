import plasticSaverIcon from '@/assets/badges/plastic-saver.png';
import plasticHeroIcon from '@/assets/badges/plastic-hero.png';
import plasticLegendIcon from '@/assets/badges/plastic-legend.png';
import paperSaverIcon from '@/assets/badges/paper-saver.png';
import paperHeroIcon from '@/assets/badges/paper-hero.png';
import paperLegendIcon from '@/assets/badges/paper-legend.png';
import glassSaverIcon from '@/assets/badges/glass-saver.png';
import glassHeroIcon from '@/assets/badges/glass-hero.png';
import glassLegendIcon from '@/assets/badges/glass-legend.png';
import metalSaverIcon from '@/assets/badges/metal-saver.png';
import metalHeroIcon from '@/assets/badges/metal-hero.png';
import metalLegendIcon from '@/assets/badges/metal-legend.png';
import organicSaverIcon from '@/assets/badges/organic-saver.png';
import organicHeroIcon from '@/assets/badges/organic-hero.png';
import organicLegendIcon from '@/assets/badges/organic-legend.png';
import topChallengerIcon from '@/assets/badges/top-challenger.png';
import firstLikeIcon from '@/assets/badges/first-like.png';
import firstCommentIcon from '@/assets/badges/first-comment.png';

export type BadgeCatalogItem = {
  key: string;
  descriptionKey: string;
  category: string;
  priority: number;
  iconUrl?: string;
};

export const badgeCatalog: BadgeCatalogItem[] = [
  { key: 'badges.badgeNames.plasticSaver', descriptionKey: 'badges.badgeDescriptions.plasticSaver', category: 'waste', priority: 12, iconUrl: plasticSaverIcon },
  { key: 'badges.badgeNames.plasticHero', descriptionKey: 'badges.badgeDescriptions.plasticHero', category: 'waste', priority: 7, iconUrl: plasticHeroIcon },
  { key: 'badges.badgeNames.plasticLegend', descriptionKey: 'badges.badgeDescriptions.plasticLegend', category: 'waste', priority: 1, iconUrl: plasticLegendIcon },
  { key: 'badges.badgeNames.paperSaver', descriptionKey: 'badges.badgeDescriptions.paperSaver', category: 'waste', priority: 13, iconUrl: paperSaverIcon },
  { key: 'badges.badgeNames.paperHero', descriptionKey: 'badges.badgeDescriptions.paperHero', category: 'waste', priority: 8, iconUrl: paperHeroIcon },
  { key: 'badges.badgeNames.paperLegend', descriptionKey: 'badges.badgeDescriptions.paperLegend', category: 'waste', priority: 2, iconUrl: paperLegendIcon },
  { key: 'badges.badgeNames.glassSaver', descriptionKey: 'badges.badgeDescriptions.glassSaver', category: 'waste', priority: 14, iconUrl: glassSaverIcon },
  { key: 'badges.badgeNames.glassHero', descriptionKey: 'badges.badgeDescriptions.glassHero', category: 'waste', priority: 9, iconUrl: glassHeroIcon },
  { key: 'badges.badgeNames.glassLegend', descriptionKey: 'badges.badgeDescriptions.glassLegend', category: 'waste', priority: 3, iconUrl: glassLegendIcon },
  { key: 'badges.badgeNames.metalSaver', descriptionKey: 'badges.badgeDescriptions.metalSaver', category: 'waste', priority: 15, iconUrl: metalSaverIcon },
  { key: 'badges.badgeNames.metalHero', descriptionKey: 'badges.badgeDescriptions.metalHero', category: 'waste', priority: 10, iconUrl: metalHeroIcon },
  { key: 'badges.badgeNames.metalLegend', descriptionKey: 'badges.badgeDescriptions.metalLegend', category: 'waste', priority: 4, iconUrl: metalLegendIcon },
  { key: 'badges.badgeNames.organicSaver', descriptionKey: 'badges.badgeDescriptions.organicSaver', category: 'waste', priority: 16, iconUrl: organicSaverIcon },
  { key: 'badges.badgeNames.organicHero', descriptionKey: 'badges.badgeDescriptions.organicHero', category: 'waste', priority: 11, iconUrl: organicHeroIcon },
  { key: 'badges.badgeNames.organicLegend', descriptionKey: 'badges.badgeDescriptions.organicLegend', category: 'waste', priority: 5, iconUrl: organicLegendIcon },
  { key: 'badges.badgeNames.topChallenger', descriptionKey: 'badges.badgeDescriptions.topChallenger', category: 'challenge', priority: 6, iconUrl: topChallengerIcon },
  { key: 'badges.badgeNames.firstLike', descriptionKey: 'badges.badgeDescriptions.firstLike', category: 'social', priority: 17, iconUrl: firstLikeIcon },
  { key: 'badges.badgeNames.firstComment', descriptionKey: 'badges.badgeDescriptions.firstComment', category: 'social', priority: 18, iconUrl: firstCommentIcon },
];
