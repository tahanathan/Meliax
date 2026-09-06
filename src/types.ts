export type TripStatus = 'visited' | 'planned' | 'ongoing' | 'completed';

export type TripCategory =
  | 'Aventura'
  | 'Cultural'
  | 'Cultura'
  | 'Ecoturismo'
  | 'Solo'
  | 'Família'
  | 'Luxo'
  | 'Gastronomia'
  | 'Praia & Sol'
  | 'Outro';

export interface ItineraryItem {
  id: string;
  day: number;
  date?: string;
  time: string;
  place: string;
  title?: string;
  description: string;
  done: boolean;
  cost: number;
  category?: 'activity' | 'lodging' | 'food' | 'transport';
  location?: string;
  image?: string;
  imageCredit?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Companion {
  name: string;
  photoURL?: string;
}

export type BaggageCategory = 'Eletrônicos' | 'Roupas' | 'Higiene' | 'Documentos' | 'Outros';

export interface BaggageItem {
  id: string;
  category: BaggageCategory;
  name: string;
  note?: string;
  weightKg?: number;
  packed: boolean;
}

export interface Trip {
  id: string;
  userId: string;
  title: string;
  destination: string;
  state?: string;
  country: string;
  status: TripStatus;
  isFavorite?: boolean;
  rating: number; // 1 to 5 stars
  startDate: string;
  endDate: string;
  notes: string;
  coverImage: string;
  imageCredit?: string;
  gallery: string[];
  category: TripCategory;
  budget: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  itinerary: ItineraryItem[];
  baggageChecklist?: BaggageItem[];
  participants?: { name: string; icon?: string; photoURL?: string }[];
  checkInsCount?: number;
  linkedTripIds?: string[];
  isCombinedTrip?: boolean;
  combinedTripName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  tripId?: string;
  placeName: string;
  address: string;
  lat: number;
  lng: number;
  note: string;
  photoUrl?: string;
  timestamp: string;
  googleMapsUrl: string;
}

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'lime' | 'emerald' | 'cyan' | 'coral';
export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP';

export interface FrequentCompanion {
  id: string;
  name: string;
  email?: string;
  relationship?: string;
  avatarUrl?: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  accentColor: AccentColor;
  currency: CurrencyCode;
  defaultCategory?: TripCategory | 'Todos';
  mapStyle: 'standard' | 'satellite' | 'dark';
  enableCheckinReminders?: boolean;
  notificationsEnabled?: boolean;
  displayName: string;
  originCity?: string;
  originCountry?: string;
  originCoords?: { lat: number; lng: number };
  travelTypes?: string[];
  frequentCompanions?: FrequentCompanion[];
  preferredBudgetStyle?: 'economico' | 'moderado' | 'luxo';
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
}
