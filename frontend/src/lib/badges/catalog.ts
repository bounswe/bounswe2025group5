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

export type BadgeCatalogItem = {
  key: string;
  descriptionKey: string;
  category: string;
  iconUrl?: string;
};

export const badgeCatalog: BadgeCatalogItem[] = [
  { key: 'badges.badgeNames.plasticSaver', descriptionKey: 'badges.badgeDescriptions.plasticSaver', category: 'waste', iconUrl: plasticSaverIcon },
  { key: 'badges.badgeNames.plasticHero', descriptionKey: 'badges.badgeDescriptions.plasticHero', category: 'waste', iconUrl: plasticHeroIcon },
  { key: 'badges.badgeNames.plasticLegend', descriptionKey: 'badges.badgeDescriptions.plasticLegend', category: 'waste', iconUrl: plasticLegendIcon },
  { key: 'badges.badgeNames.paperSaver', descriptionKey: 'badges.badgeDescriptions.paperSaver', category: 'waste', iconUrl: paperSaverIcon },
  { key: 'badges.badgeNames.paperHero', descriptionKey: 'badges.badgeDescriptions.paperHero', category: 'waste', iconUrl: paperHeroIcon },
  { key: 'badges.badgeNames.paperLegend', descriptionKey: 'badges.badgeDescriptions.paperLegend', category: 'waste', iconUrl: paperLegendIcon },
  { key: 'badges.badgeNames.glassSaver', descriptionKey: 'badges.badgeDescriptions.glassSaver', category: 'waste', iconUrl: glassSaverIcon },
  { key: 'badges.badgeNames.glassHero', descriptionKey: 'badges.badgeDescriptions.glassHero', category: 'waste', iconUrl: glassHeroIcon },
  { key: 'badges.badgeNames.glassLegend', descriptionKey: 'badges.badgeDescriptions.glassLegend', category: 'waste', iconUrl: glassLegendIcon },
  { key: 'badges.badgeNames.metalSaver', descriptionKey: 'badges.badgeDescriptions.metalSaver', category: 'waste', iconUrl: metalSaverIcon },
  { key: 'badges.badgeNames.metalHero', descriptionKey: 'badges.badgeDescriptions.metalHero', category: 'waste', iconUrl: metalHeroIcon },
  { key: 'badges.badgeNames.metalLegend', descriptionKey: 'badges.badgeDescriptions.metalLegend', category: 'waste', iconUrl: metalLegendIcon },
  { key: 'badges.badgeNames.organicSaver', descriptionKey: 'badges.badgeDescriptions.organicSaver', category: 'waste', iconUrl: organicSaverIcon },
  { key: 'badges.badgeNames.organicHero', descriptionKey: 'badges.badgeDescriptions.organicHero', category: 'waste', iconUrl: organicHeroIcon },
  { key: 'badges.badgeNames.organicLegend', descriptionKey: 'badges.badgeDescriptions.organicLegend', category: 'waste', iconUrl: organicLegendIcon },
  { key: 'badges.badgeNames.topChallenger', descriptionKey: 'badges.badgeDescriptions.topChallenger', category: 'challenge', iconUrl: topChallengerIcon },
];
