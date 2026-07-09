/**
 * Public Facility type definitions and helper functions
 *
 * Data source: 板橋区 公共施設一覧 (デジタル庁 自治体標準オープンデータセット)
 */

import type { NgsiV2Entity as NgsiEntity, NgsiV2Attribute as NgsiAttribute } from '@geolonia/geonicdb-sdk/ngsi-v2';
import type { GeoJsonPoint } from '../lib/geo-types';

/**
 * Extract the value from an NgsiAttribute on an entity
 */
export function getAttrValue<T = unknown>(
  entity: NgsiEntity,
  attrName: string,
): T | undefined {
  const attr = entity[attrName];
  if (!attr || typeof attr === 'string') return undefined;
  return (attr as NgsiAttribute).value as T;
}

// ============================================================================
// Facility Category
// ============================================================================

export type FacilityCategory =
  | '図書館'
  | '体育館'
  | '公民館'
  | '区民事務所'
  | '児童館'
  | '集会所'
  | '福祉施設'
  | '子育て施設'
  | 'ホール'
  | '学校'
  | '公園'
  | 'その他';

// geolonia/custom-smartmap-sprite: sprite sheet for MapLibre symbol layers & card badges
export const SPRITE_URL = 'https://geolonia.github.io/custom-smartmap-sprite/sprite';
export const SPRITE_SHEET_URL = `${SPRITE_URL}.png`;

/** Sprite coordinates from sprite.json (all 75×90 px, pixelRatio 1) */
export const SPRITE_COORDS: Record<string, { x: number; y: number; w: number; h: number }> = {
  'library':              { x: 150, y: 651, w: 75, h: 90 },
  'sports':               { x: 375, y: 831, w: 75, h: 90 },
  'public-facility-navy': { x: 835, y: 0,   w: 75, h: 90 },
  'public-facility-red':  { x: 835, y: 90,  w: 75, h: 90 },
  'daycare':              { x: 535, y: 270, w: 75, h: 90 },
  'welfare-facility':     { x: 985, y: 630, w: 75, h: 90 },
  'baby':                 { x: 75,  y: 291, w: 75, h: 90 },
  'museums':              { x: 760, y: 180, w: 75, h: 90 },
  'preschool':            { x: 525, y: 741, w: 75, h: 90 },
  'park':                 { x: 760, y: 450, w: 75, h: 90 },
};

/** Category display colors and sprite icon for badges and markers */
export const FACILITY_CATEGORY_COLORS: Record<FacilityCategory, {
  /** CSS background-color value (not a Tailwind class) */
  bg: string;
  /** CSS color value (not a Tailwind class) */
  text: string;
  marker: string;
  /** Sprite icon name from geolonia/custom-smartmap-sprite */
  spriteIcon: string;
}> = {
  '図書館':    { bg: 'rgba(59,130,246,0.18)',   text: '#60a5fa',  marker: '#3b82f6',  spriteIcon: 'library' },
  '体育館':    { bg: 'rgba(34,197,94,0.18)',    text: '#4ade80',  marker: '#22c55e',  spriteIcon: 'sports' },
  '公民館':    { bg: 'rgba(168,85,247,0.18)',   text: '#c084fc',  marker: '#a855f7',  spriteIcon: 'public-facility-navy' },
  '区民事務所': { bg: 'rgba(239,68,68,0.18)',    text: '#f87171',  marker: '#ef4444',  spriteIcon: 'public-facility-red' },
  '児童館':    { bg: 'rgba(249,115,22,0.18)',   text: '#fb923c',  marker: '#f97316',  spriteIcon: 'daycare' },
  '集会所':    { bg: 'rgba(20,184,166,0.18)',   text: '#2dd4bf',  marker: '#14b8a6',  spriteIcon: 'public-facility-navy' },
  '福祉施設':  { bg: 'rgba(236,72,153,0.18)',   text: '#f472b6',  marker: '#ec4899',  spriteIcon: 'welfare-facility' },
  '子育て施設': { bg: 'rgba(245,158,11,0.18)',   text: '#fbbf24',  marker: '#f59e0b',  spriteIcon: 'baby' },
  'ホール':    { bg: 'rgba(99,102,241,0.18)',   text: '#818cf8',  marker: '#6366f1',  spriteIcon: 'museums' },
  '学校':      { bg: 'rgba(6,182,212,0.18)',    text: '#22d3ee',  marker: '#06b6d4',  spriteIcon: 'preschool' },
  '公園':      { bg: 'rgba(132,204,22,0.18)',   text: '#a3e635',  marker: '#84cc16',  spriteIcon: 'park' },
  'その他':    { bg: 'rgba(107,114,128,0.18)',  text: '#9ca3af',  marker: '#6b7280',  spriteIcon: 'public-facility-navy' },
};

// ============================================================================
// Accessibility Info
// ============================================================================

export interface AccessibilityInfo {
  wheelchair: boolean;
  wheelchairRental: boolean;
  accessibleToilet: boolean;
  slopeElevator: boolean;
  braille: boolean;
  guideDog: boolean;
  nursingRoom: boolean;
  diaperChanging: boolean;
  priorityParking: boolean;
  ostomyToilet: boolean;
}

/** Check if any accessibility info is available */
export function hasAnyAccessibility(a: AccessibilityInfo): boolean {
  return Object.values(a).some(Boolean);
}

// ============================================================================
// Public Facility
// ============================================================================

export interface PublicFacility {
  id: string;
  name: string;
  nameKana: string;
  location: [number, number] | null; // [lng, lat]
  address: string;
  phone: string;
  facilityType: FacilityCategory;
  municipality: string;
  // Operating hours
  openDays: string;
  openTime: string;
  closeTime: string;
  openTimeNote: string;
  // Accessibility
  accessibility: AccessibilityInfo;
  // Additional info
  description: string;
  websiteUrl: string;
  postalCode: string;
  /** Raw NGSI entity for displaying extra attributes not mapped above */
  rawEntity: NgsiEntity;
}

export function toPublicFacility(entity: NgsiEntity): PublicFacility {
  const name = getAttrValue<string>(entity, 'name')
    ?? (entity.id.includes(':') ? entity.id.split(':').slice(1).join(':') : entity.id);

  // Extract location
  let location: [number, number] | null = null;
  const loc = entity.location;
  if (loc && typeof loc !== 'string') {
    const value = (loc as NgsiAttribute).value as GeoJsonPoint | undefined;
    if (value?.type === 'Point' && Array.isArray(value.coordinates)) {
      location = value.coordinates;
    }
  }

  const facilityTypeRaw = getAttrValue<string>(entity, 'facilityType') ?? 'その他';
  const facilityType: FacilityCategory =
    facilityTypeRaw in FACILITY_CATEGORY_COLORS
      ? (facilityTypeRaw as FacilityCategory)
      : 'その他';

  return {
    id: entity.id,
    name,
    nameKana: getAttrValue<string>(entity, 'nameKana') ?? '',
    location,
    address: getAttrValue<string>(entity, 'address') ?? '',
    phone: getAttrValue<string>(entity, 'phone') ?? '',
    facilityType,
    municipality: getAttrValue<string>(entity, 'municipality') ?? '',
    openDays: getAttrValue<string>(entity, 'openDays') ?? '',
    openTime: getAttrValue<string>(entity, 'openTime') ?? '',
    closeTime: getAttrValue<string>(entity, 'closeTime') ?? '',
    openTimeNote: getAttrValue<string>(entity, 'openTimeNote') ?? '',
    accessibility: {
      wheelchair: getAttrValue<boolean>(entity, 'wheelchair') ?? false,
      wheelchairRental: getAttrValue<boolean>(entity, 'wheelchairRental') ?? false,
      accessibleToilet: getAttrValue<boolean>(entity, 'accessibleToilet') ?? false,
      slopeElevator: getAttrValue<boolean>(entity, 'slopeElevator') ?? false,
      braille: getAttrValue<boolean>(entity, 'braille') ?? false,
      guideDog: getAttrValue<boolean>(entity, 'guideDog') ?? false,
      nursingRoom: getAttrValue<boolean>(entity, 'nursingRoom') ?? false,
      diaperChanging: getAttrValue<boolean>(entity, 'diaperChanging') ?? false,
      priorityParking: getAttrValue<boolean>(entity, 'priorityParking') ?? false,
      ostomyToilet: getAttrValue<boolean>(entity, 'ostomyToilet') ?? false,
    },
    description: getAttrValue<string>(entity, 'description') ?? '',
    websiteUrl: getAttrValue<string>(entity, 'websiteUrl') ?? '',
    postalCode: getAttrValue<string>(entity, 'postalCode') ?? '',
    rawEntity: entity,
  };
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Attribute keys that are already mapped into the PublicFacility type.
 * Used to identify "extra" attributes that should be shown in the raw-data section.
 */
const KNOWN_ATTR_KEYS = new Set([
  'id', 'type',
  'name', 'nameKana', 'location', 'address', 'phone',
  'facilityType', 'municipality',
  'openDays', 'openTime', 'closeTime', 'openTimeNote',
  'wheelchair', 'wheelchairRental', 'accessibleToilet', 'slopeElevator',
  'braille', 'guideDog', 'nursingRoom', 'diaperChanging',
  'priorityParking', 'ostomyToilet',
  'description', 'websiteUrl', 'postalCode',
]);

export interface ExtraAttribute {
  key: string;
  type: string;
  value: unknown;
}

/** Extract attributes from the raw entity that are NOT mapped into PublicFacility fields */
export function getExtraAttributes(facility: PublicFacility): ExtraAttribute[] {
  const entity = facility.rawEntity;
  const extras: ExtraAttribute[] = [];
  for (const [key, attr] of Object.entries(entity)) {
    if (KNOWN_ATTR_KEYS.has(key)) continue;
    if (!attr || typeof attr === 'string') continue;
    const typed = attr as NgsiAttribute;
    extras.push({
      key,
      type: typeof typed.type === 'string' ? typed.type : 'Unknown',
      value: typed.value,
    });
  }
  return extras;
}

/** Get unique facility types from a list and their counts, sorted by count desc */
export function getFacilityTypeCounts(
  facilities: PublicFacility[],
): { type: FacilityCategory; count: number }[] {
  const counts = new Map<FacilityCategory, number>();
  for (const f of facilities) {
    counts.set(f.facilityType, (counts.get(f.facilityType) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

/** Format operating hours for display */
export function formatOperatingHours(facility: PublicFacility): string {
  if (facility.openTime && facility.closeTime) {
    return `${facility.openTime} - ${facility.closeTime}`;
  }
  if (facility.openTimeNote) {
    return facility.openTimeNote;
  }
  return '';
}

/**
 * Check if a facility is currently open based on openDays + openTime/closeTime.
 * Uses a provided Date for testability (defaults to now).
 */
export function isCurrentlyOpen(
  facility: PublicFacility,
  now: Date = new Date(),
): boolean | null {
  // If no time data, we can't determine
  if (!facility.openTime || !facility.closeTime) return null;

  // Parse HH:MM
  const [openH, openM] = facility.openTime.split(':').map(Number);
  const [closeH, closeM] = facility.closeTime.split(':').map(Number);
  if (isNaN(openH) || isNaN(closeH)) return null;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const openMinutes = openH * 60 + (openM || 0);
  const closeMinutes = closeH * 60 + (closeM || 0);
  const spansMidnight = closeMinutes <= openMinutes;

  // Check day of week
  if (facility.openDays) {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const todayName = dayNames[now.getDay()];
    // For midnight-spanning hours, the after-midnight portion belongs to yesterday's shift
    const yesterdayName = dayNames[(now.getDay() + 6) % 7];
    const openDay = spansMidnight && currentMinutes < closeMinutes
      ? yesterdayName
      : todayName;
    if (!facility.openDays.includes(openDay)) return false;
  }

  return spansMidnight
    ? currentMinutes >= openMinutes || currentMinutes < closeMinutes
    : currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
