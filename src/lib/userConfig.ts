import { FrequentCompanion, UserPreferences } from '../types';

export const DEFAULT_TRAVEL_TYPES: string[] = [
  'Praia & Sol',
  'Urbano',
  'Aventura',
  'Cultural',
  'Ecoturismo',
  'Gastronomia',
  'Luxo',
  'Solo',
  'Família',
  'Cruzeiro',
  'Negócios',
];

export const DEFAULT_COMPANIONS: FrequentCompanion[] = [];

export function getStoredTravelTypes(): string[] {
  try {
    const raw = localStorage.getItem('voyager_travel_types');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TRAVEL_TYPES;
}

export function saveStoredTravelTypes(types: string[]) {
  try {
    localStorage.setItem('voyager_travel_types', JSON.stringify(types));
  } catch {}
}

const FICTITIOUS_NAMES = new Set(['ana silva', 'carlos eduardo', 'mariana costa', 'ana clara', 'lucas gabriel', 'morgan']);

export function getStoredCompanions(): FrequentCompanion[] {
  try {
    const raw = localStorage.getItem('voyager_frequent_companions');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize out old fictitious template companions
        const sanitized = parsed.filter(
          (c) => c && c.name && !FICTITIOUS_NAMES.has(c.name.trim().toLowerCase())
        );
        if (sanitized.length !== parsed.length) {
          try {
            localStorage.setItem('voyager_frequent_companions', JSON.stringify(sanitized));
          } catch {}
        }
        return sanitized;
      }
    }
  } catch {}
  return [];
}

export function saveStoredCompanions(list: FrequentCompanion[]) {
  try {
    const sanitized = (list || []).filter(
      (c) => c && c.name && !FICTITIOUS_NAMES.has(c.name.trim().toLowerCase())
    );
    localStorage.setItem('voyager_frequent_companions', JSON.stringify(sanitized));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('milea_companions_changed', { detail: sanitized }));
    }
  } catch {}
}
