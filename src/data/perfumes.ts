import heroAmberImg from '../assets/images/hero_amber_perfume_1794911992903.jpg';
import cedarBottleImg from '../assets/images/cedar_perfume_bottle_1794911994270.jpg';
import jasmineBottleImg from '../assets/images/jasmine_perfume_bottle_1794911994445.jpg';
import figBottleImg from '../assets/images/fig_perfume_bottle_1794911993934.jpg';
import campaignFilmImg from '../assets/images/perfume_campaign_film_1794912003115.jpg';

export type PerfumeId = 'figue-sage' | 'aura-ambree' | 'aethel-cedre' | 'jardin-blanc';
export type TierFilter = 'All' | 'Everyday' | 'Signature' | 'Prestige';
export type MoodTag = 'Comfort' | 'Confidence' | 'Fresh' | 'Celebration';
export type EditionId = 'crystal' | 'smoked' | 'gilded';
export type VolumeLabel = '10 ml Oil' | '30 ml' | '50 ml' | '100 ml';

export interface PerfumeProduct {
  id: PerfumeId;
  name: string;
  subtitle: string;
  tier: Exclude<TierFilter, 'All'>;
  mood: MoodTag;
  occasion: string;
  concentration: string;
  longevityHours: number;
  origin: string;
  description: string;
  notes: {
    top: string[];
    heart: string[];
    base: string[];
  };
  prices: Record<VolumeLabel, number>;
  image: string;
  alt: string;
}

export interface BagItem {
  perfumeId: PerfumeId;
  edition: EditionId;
  volume: VolumeLabel;
  engraving: string;
  unitPrice: number;
  qty: number;
}

export interface MotionFilm {
  id: string;
  chapter: string;
  title: string;
  subtitle: string;
  durationSec: number;
  perfumeId: PerfumeId;
  image: string;
  grade: 'amber' | 'cedar' | 'jasmine';
  notesCaption: string;
}

export const CAMPAIGN_FILM_IMAGE = campaignFilmImg;

export const EDITION_META: Record<
  EditionId,
  { name: string; dot: string; upcharge: number; glassNote: string }
> = {
  crystal: {
    name: 'Ivory Crystal',
    dot: '#F8F5EF',
    upcharge: 0,
    glassNote: 'Classic clear apothecary flint glass',
  },
  smoked: {
    name: 'Espresso Smoked',
    dot: '#47392F',
    upcharge: 2500,
    glassNote: 'Deep espresso UV-shielded flacon',
  },
  gilded: {
    name: 'Crimson & Champagne',
    dot: '#821D30',
    upcharge: 4000,
    glassNote: 'Collector champagne collar & crimson seal',
  },
};

export const VOLUME_OPTIONS: {
  volume: VolumeLabel;
  scale: number;
  formatLabel: string;
}[] = [
  { volume: '10 ml Oil', scale: 0.84, formatLabel: 'Roll-on oil' },
  { volume: '30 ml', scale: 0.92, formatLabel: 'Travel spray' },
  { volume: '50 ml', scale: 1.0, formatLabel: 'Signature bottle' },
  { volume: '100 ml', scale: 1.08, formatLabel: 'Atelier flacon' },
];

export const PERFUMES: PerfumeProduct[] = [
  {
    id: 'figue-sage',
    name: 'Figue & Sage',
    subtitle: 'Wild Fig Leaf · Clary Sage · Morning Dew',
    tier: 'Everyday',
    mood: 'Fresh',
    occasion: 'Office, errands & warm afternoons',
    concentration: 'Everyday Oil & Mist',
    longevityHours: 10,
    origin: 'Nostelle Everyday',
    description:
      'Crisp torn fig foliage steeped in aromatic clary sage and sunlit driftwood. Crafted for daily wear—starting from our accessible ₦3,000 concentrated roll-on oil.',
    notes: {
      top: ['Crushed Fig Leaf', 'Clary Sage', 'Green Mandarin'],
      heart: ['Milky Fig Pulp', 'Sea Salt Spray', 'Cypress Needle'],
      base: ['White Cedar', 'Mineral Musk', 'Sunlit Driftwood'],
    },
    prices: {
      '10 ml Oil': 3000,
      '30 ml': 11000,
      '50 ml': 16500,
      '100 ml': 24500,
    },
    image: figBottleImg,
    alt: 'Figue and Sage pale green glass perfume bottle with travertine cap and dewy fig leaf',
  },
  {
    id: 'aura-ambree',
    name: 'Aura Ambrée',
    subtitle: 'Golden Labdanum · Roasted Tonka · Bergamot',
    tier: 'Signature',
    mood: 'Comfort',
    occasion: 'Sunday church, dinners & close evenings',
    concentration: '30% Extrait',
    longevityHours: 16,
    origin: 'Nostelle Signature',
    description:
      'Sun-warmed labdanum resin and roasted tonka bean suspended in bright Calabrian bergamot and sweet benzoin tears—warm, familiar, and impossible to forget.',
    notes: {
      top: ['Calabrian Bergamot', 'Bitter Orange Peel', 'Pink Pepper'],
      heart: ['Cistus Labdanum', 'Spiced Benzoin', 'Saffron Thread'],
      base: ['Roasted Tonka', 'Ambergris Accord', 'Madagascar Vanilla'],
    },
    prices: {
      '10 ml Oil': 5500,
      '30 ml': 18000,
      '50 ml': 26000,
      '100 ml': 38500,
    },
    image: heroAmberImg,
    alt: 'Aura Ambrée thick crystal perfume bottle filled with golden-amber parfum on travertine stone',
  },
  {
    id: 'aethel-cedre',
    name: 'Aethel Cèdre',
    subtitle: 'Atlas Cedar · Wet Slate · Black Pepper',
    tier: 'Signature',
    mood: 'Confidence',
    occasion: 'Boardrooms, date nights & late drives',
    concentration: '28% Extrait',
    longevityHours: 14,
    origin: 'Nostelle Signature',
    description:
      'Dry resinous Atlas cedarwood cut with rain-cooled basalt mineral accords, crushed black peppercorn, and meditative hinoki smoke.',
    notes: {
      top: ['Crushed Black Pepper', 'Juniper Berry', 'Cardamom Pod'],
      heart: ['Atlas Cedarwood', 'Kyoto Hinoki', 'Incense Smoke'],
      base: ['Haitian Vetiver', 'Wet Slate', 'Guaiac Wood'],
    },
    prices: {
      '10 ml Oil': 6000,
      '30 ml': 21000,
      '50 ml': 29500,
      '100 ml': 44000,
    },
    image: cedarBottleImg,
    alt: 'Aethel Atlas Cedarwood and Smoke perfume bottle on dark basalt stone beside cedar sprig',
  },
  {
    id: 'jardin-blanc',
    name: 'Jardin Blanc',
    subtitle: 'Night Jasmine · Orris Butter · White Suede',
    tier: 'Prestige',
    mood: 'Celebration',
    occasion: 'Owambe, weddings & Detty December',
    concentration: '32% Prestige Extrait',
    longevityHours: 18,
    origin: 'The Prestige Edit',
    description:
      'Hand-harvested night-blooming jasmine sambac layered over cool Florentine iris butter and supple suede—for the moments worth remembering.',
    notes: {
      top: ['Mandarin Blossom', 'White Pear', 'Ambrette Seed'],
      heart: ['Night Jasmine', 'Orris Butter', 'Orange Flower'],
      base: ['White Suede', 'Cashmeran', 'Sandalwood Milk'],
    },
    prices: {
      '10 ml Oil': 8500,
      '30 ml': 34000,
      '50 ml': 48000,
      '100 ml': 68000,
    },
    image: jasmineBottleImg,
    alt: 'Jardin Blanc frosted champagne-glass perfume flacon beside fresh white jasmine blossoms',
  },
];

export const SHOWCASE_CHAPTERS = [
  {
    src: campaignFilmImg,
    alt: 'Sunlit amber glass parfum flacon resting on raw linen and travertine stone beside citrus peel',
    title: 'Wear the memory.',
    sub: 'Warm-light maceration crafted so a single spritz stays on skin until morning',
  },
  {
    src: cedarBottleImg,
    alt: 'Smoked charcoal glass flacon on dark basalt beside Atlas cedarwood needles',
    title: 'Confidence in quiet smoke.',
    sub: 'Atlas cedarwood and crushed peppercorn balanced for presence without shouting',
  },
  {
    src: jasmineBottleImg,
    alt: 'Frosted champagne flacon with brass cap beside fresh night-blooming jasmine flowers',
    title: 'The Prestige Edit.',
    sub: 'For celebrations, milestones, and nights people notice before you speak',
  },
  {
    src: figBottleImg,
    alt: 'Botanical sage glass bottle with travertine stone cap beside dewy green fig leaf',
    title: 'Everyday finds, from ₦3,000.',
    sub: 'Fragrance for every mood and every budget—from pocket oils to collector flacons',
  },
];

export const MOTION_FILMS: MotionFilm[] = [
  {
    id: 'film-heure-doree',
    chapter: 'Film 01',
    title: 'Some Feelings Never Fade — Aura Ambrée',
    subtitle:
      'Golden-hour caustics sweep across aged labdanum resin and citrus peel in warm window light.',
    durationSec: 24,
    perfumeId: 'aura-ambree',
    image: campaignFilmImg,
    grade: 'amber',
    notesCaption: 'Signature Tier · Warm Amber · 24s Reel',
  },
  {
    id: 'film-bois-brume',
    chapter: 'Film 02',
    title: 'Wear What Stays With You — Aethel Cèdre',
    subtitle:
      'Slow-moving mist drifts across dark basalt slate as smoked cedarwood settles into glass.',
    durationSec: 24,
    perfumeId: 'aethel-cedre',
    image: cedarBottleImg,
    grade: 'cedar',
    notesCaption: 'Signature Tier · Confidence Mood · 24s Reel',
  },
  {
    id: 'film-jardin-nuit',
    chapter: 'Film 03',
    title: 'The Prestige Edit — Jardin Blanc',
    subtitle:
      'Filtered evening light illuminates frosted champagne glass and freshly cut jasmine petals.',
    durationSec: 24,
    perfumeId: 'jardin-blanc',
    image: jasmineBottleImg,
    grade: 'jasmine',
    notesCaption: 'Prestige Tier · Celebration · 24s Reel',
  },
];

export const COMPLIMENTARY_SAMPLES = [
  { id: 'sample-figue', name: 'Figue & Sage (2 ml Vial)', family: 'Fresh · Everyday' },
  { id: 'sample-aura', name: 'Aura Ambrée (2 ml Vial)', family: 'Comfort · Signature' },
  { id: 'sample-cedre', name: 'Aethel Cèdre (2 ml Vial)', family: 'Confidence · Signature' },
  { id: 'sample-jardin', name: 'Jardin Blanc (2 ml Vial)', family: 'Celebration · Prestige' },
];

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

export function computeUnitPrice(
  perfume: PerfumeProduct,
  volume: VolumeLabel,
  edition: EditionId
): number {
  const base = perfume.prices[volume] ?? perfume.prices['50 ml'];
  const edOpt = EDITION_META[edition];
  return base + (volume === '10 ml Oil' ? 0 : edOpt.upcharge);
}

export function getPerfumeById(id: PerfumeId): PerfumeProduct {
  return PERFUMES.find((p) => p.id === id) ?? PERFUMES[0];
}
