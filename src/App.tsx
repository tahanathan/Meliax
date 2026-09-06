import { formatDate } from './utils';
import React, { useState, useEffect, useMemo } from 'react';
import { CompanionsList } from './components/CompanionsList';
import { CountryFlag } from './components/CountryFlag';
import { AuthMenu } from './components/AuthMenu';
import { MileaLogo } from './components/MileaLogo';
import { MileaLogoHorizontal } from './components/MileaLogoHorizontal';
import { Trip, CheckIn, UserProfile, UserPreferences, BaggageItem } from './types';
import { DEMO_TRIPS, DEMO_CHECKINS } from './lib/demoData';
import { DEFAULT_MASTER_BAGGAGE } from './lib/masterBaggage';
import {
  auth,
  subscribeUserTrips,
  subscribeUserCheckins,
  subscribeUserSettings,
  saveUserSettingsToFirestore,
  saveTripToFirestore,
  deleteTripFromFirestore,
  saveCheckinToFirestore,
  deleteCheckinFromFirestore,
  loginAsGuest,
  loginWithGoogle,
} from './lib/firebase';
import { getContinent, getBrazilRegion, getDynamicCategories } from './lib/regions';
import { onAuthStateChanged } from 'firebase/auth';

import { InteractiveMap } from './components/InteractiveMap';
import { CheckInModal } from './components/CheckInModal';
import { TripFormModal } from './components/TripFormModal';
import { TripDetailModal } from './components/TripDetailModal';
import { AITripGeneratorModal } from './components/AITripGeneratorModal';
import { CustomizationModal } from './components/CustomizationModal';
import { CheckInsTimeline } from './components/CheckInsTimeline';
import { DestinosView } from './components/DestinosView';
import { TripDashboardBento } from './components/TripDashboardBento';
import { BagagemView } from './components/BagagemView';
import { LuxuryHeroHome } from './components/LuxuryHeroHome';
import { SiteHeader } from './components/SiteHeader';
import { ConfiguracoesView } from './components/ConfiguracoesView';

import {
  Search,
  Home,
  Map as MapIcon,
  MapPin,
  Calendar,
  Briefcase,
  User,
  Sun,
  Filter,
  Star,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Compass,
  SlidersHorizontal,
  Sparkles,
  Plus,
  Settings,
  Trees,
  Palmtree,
  Heart,
  Navigation,
  Bell,
  Clock,
  Users,
  X
} from 'lucide-react';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: 'lime',
  currency: 'BRL',
  mapStyle: 'dark',
  displayName: 'Viajante',
  originCity: 'São Paulo',
  originCoords: { lat: -23.5505, lng: -46.6333 },
  notificationsEnabled: true,
};

export function calculateDistanceKm(
  from?: { lat: number; lng: number },
  to?: { lat: number; lng: number }
): number | null {
  if (!from || !to || !from.lat || !from.lng || !to.lat || !to.lng) return null;
  const R = 6371; // earth radius in km
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function getTripDurationDays(trip: Trip): number {
  if (trip.startDate && trip.endDate) {
    const s = new Date(trip.startDate).getTime();
    const e = new Date(trip.endDate).getTime();
    if (!isNaN(s) && !isNaN(e) && e >= s) {
      return Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    }
  }
  if (trip.itinerary && trip.itinerary.length > 0) {
    return Math.max(...trip.itinerary.map((i) => i.day || 1));
  }
  return 3;
}

export function getTripPeopleCount(trip: Trip): number {
  if (trip.participants && trip.participants.length > 0) {
    return trip.participants.length;
  }
  return 1;
}

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_guest_trips');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEMO_TRIPS;
  });
  const [checkins, setCheckins] = useState<CheckIn[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_guest_checkins');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEMO_CHECKINS;
  });

  const activeTrips = trips;
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    try {
      const saved = localStorage.getItem('voyager_preferences');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PREFERENCES;
  });

  const [activeTab, setActiveTab] = useState<'home' | 'popular' | 'map' | 'bagagem' | 'configuracoes'>('home');

  const [masterBaggage, setMasterBaggage] = useState<BaggageItem[]>(() => {
    try {
      const saved = localStorage.getItem('voyager_master_baggage');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_MASTER_BAGGAGE;
  });

  const handleUpdateMasterBaggage = (newItems: BaggageItem[]) => {
    setMasterBaggage(newItems);
    try {
      localStorage.setItem('voyager_master_baggage', JSON.stringify(newItems));
    } catch (e) {}
  };

  // Modals & Panels
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isTripFormOpen, setIsTripFormOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);
  const [selectedTripForDetail, setSelectedTripForDetail] = useState<Trip | null>(null);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [checkinCoords, setCheckinCoords] = useState<{ lat?: number; lng?: number; placeName?: string }>({});
  const [temperature, setTemperature] = useState<number | null>(null);
  const [activeDateFilter, setActiveDateFilter] = useState<string | null>(null);
  const [isStackExpanded, setIsStackExpanded] = useState(false);
  const [featuredTripIndex, setFeaturedTripIndex] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = trips.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      t.title.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q) ||
      (t.category && t.category.toLowerCase().includes(q)) ||
      t.itinerary?.some(
        (item) =>
          item.place.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
      )
    );
  });

  const handleTabChange = (tab: 'home' | 'popular' | 'map' | 'bagagem' | 'configuracoes' | 'checkins') => {
    if (tab === 'checkins') {
      setActiveTab('map');
    } else {
      setActiveTab(tab);
    }
    setSelectedTripForDetail(null);
    setIsStackExpanded(false);
  };

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data?.temperature === 'number') {
            setTemperature(data.temperature);
            return;
          }
        }
      } catch {
        // Safe silent fallback
      }
      setTemperature(24);
    };
    
    const defaultLat = -23.5505;
    const defaultLon = -46.6333;
    
    let cachedCoords: { lat: number; lon: number } | null = null;
    try {
      const raw = localStorage.getItem('voyager_last_geo_coords');
      if (raw) cachedCoords = JSON.parse(raw);
    } catch {}

    if (cachedCoords && typeof cachedCoords.lat === 'number' && typeof cachedCoords.lon === 'number') {
      fetchWeather(cachedCoords.lat, cachedCoords.lon);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          try {
            localStorage.setItem(
              'voyager_last_geo_coords',
              JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude })
            );
          } catch {}
          fetchWeather(pos.coords.latitude, pos.coords.longitude);
        },
        () => fetchWeather(defaultLat, defaultLon),
        { maximumAge: 600000, timeout: 8000 }
      );
    } else {
      fetchWeather(defaultLat, defaultLon);
    }
  }, []);

  useEffect(() => {
    if (preferences.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    document.documentElement.setAttribute('data-accent', preferences.accentColor || 'lime');
    try {
      localStorage.setItem('voyager_preferences', JSON.stringify(preferences));
    } catch (e) {}
  }, [preferences]);

  useEffect(() => {
    try {
      const customSaved = localStorage.getItem('voyager_custom_user');
      if (customSaved) {
        setUser(JSON.parse(customSaved));
      }
    } catch (e) {}

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      try {
        const customSaved = localStorage.getItem('voyager_custom_user');
        if (customSaved) return; // Priority to custom logged-in user
      } catch (e) {}

      if (fbUser) {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName || 'Viajante',
          photoURL: fbUser.photoURL,
          isAnonymous: fbUser.isAnonymous || false,
        });
      } else {
        try {
          const guest = await loginAsGuest();
          if (guest) {
            setUser({
              uid: guest.uid,
              email: guest.email,
              displayName: guest.displayName || 'Viajante Convidado',
              photoURL: guest.photoURL,
              isAnonymous: guest.isAnonymous ?? true,
            });
          }
        } catch (e) {
          setUser({
            uid: 'guest-local-user',
            email: null,
            displayName: 'Viajante Convidado',
            photoURL: null,
            isAnonymous: true,
          });
        }
      }
    });

    return () => unsubAuth();
  }, []);

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...updated };
      try {
        localStorage.setItem('voyager_preferences', JSON.stringify(next));
      } catch (e) {}
      if (user && user.uid) {
        saveUserSettingsToFirestore(user.uid, next);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!user) return;
    const unsubTrips = subscribeUserTrips(user.uid, (data) => {
      if (data && data.length > 0) {
        const uniqueMap = new Map<string, Trip>();
        data.forEach((t) => {
          if (t && t.id) {
            uniqueMap.set(t.id, t);
          }
        });
        setTrips(Array.from(uniqueMap.values()));
      } else {
        // If user has no trips in Firestore, fallback to demo/local trips
        setTrips((prev) => (prev.length > 0 ? prev : DEMO_TRIPS));
      }
    });

    const unsubCheckins = subscribeUserCheckins(user.uid, (data) => {
      if (data && data.length > 0) {
        const uniqueMap = new Map<string, CheckIn>();
        data.forEach((c) => {
          if (c && c.id) uniqueMap.set(c.id, c);
        });
        setCheckins(Array.from(uniqueMap.values()));
      } else {
        // If user has no checkins in Firestore, fallback to demo checkins
        setCheckins((prev) => (prev.length > 0 ? prev : DEMO_CHECKINS));
      }
    });

    const unsubSettings = subscribeUserSettings(user.uid, (remoteSettings) => {
      if (remoteSettings && Object.keys(remoteSettings).length > 0) {
        setPreferences((prev) => ({ ...prev, ...remoteSettings }));
      }
    });

    return () => {
      unsubTrips();
      unsubCheckins();
      unsubSettings();
    };
  }, [user]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSaveTrip = async (tripData: Trip) => {
    const updated = { ...tripData, userId: user ? user.uid : 'guest-user' };
    setTrips((prev) => {
      const idx = prev.findIndex((t) => t.id === updated.id);
      const next = idx >= 0 ? [...prev] : [updated, ...prev];
      if (idx >= 0) next[idx] = updated;
      try {
        localStorage.setItem('voyager_guest_trips', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (selectedTripForDetail?.id === updated.id) {
      setSelectedTripForDetail(updated);
    }
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      try {
        await saveTripToFirestore(updated);
      } catch (err) {
        console.warn('Trip save to Firestore notice:', err);
      }
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== tripId && !t.id.endsWith(`_${tripId}`));
      try {
        localStorage.setItem('voyager_guest_trips', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (selectedTripForDetail?.id === tripId || selectedTripForDetail?.id.endsWith(`_${tripId}`)) {
      setSelectedTripForDetail(null);
    }

    // Return to the Destinos page
    setActiveTab('popular');

    if (auth.currentUser && !auth.currentUser.isAnonymous && !tripId.startsWith('demo-trip-')) {
      try {
        await deleteTripFromFirestore(tripId);
        setNotification({ message: 'Roteiro excluído com sucesso!', type: 'success' });
      } catch (err: any) {
        console.error('Trip deletion error:', err);
        setNotification({ message: `Erro ao excluir do banco de dados: ${err.message || err}`, type: 'error' });
      }
    } else {
      setNotification({ message: 'Roteiro excluído com sucesso!', type: 'success' });
    }
  };

  const handleSaveCheckin = async (c: CheckIn) => {
    const updated = { ...c, userId: user ? user.uid : 'guest-user' };
    setCheckins((prev) => {
      const next = [updated, ...prev];
      try {
        localStorage.setItem('voyager_guest_checkins', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (auth.currentUser && !auth.currentUser.isAnonymous) {
      try {
        await saveCheckinToFirestore(updated);
      } catch (err) {}
    }
  };

  const handleDeleteCheckin = async (checkinId: string) => {
    setCheckins((prev) => {
      const next = prev.filter((c) => c.id !== checkinId);
      try {
        localStorage.setItem('voyager_guest_checkins', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (auth.currentUser && !auth.currentUser.isAnonymous && !checkinId.startsWith('demo-checkin-')) {
      try {
        await deleteCheckinFromFirestore(checkinId);
        setNotification({ message: 'Check-in excluído com sucesso!', type: 'success' });
      } catch (err: any) {
        console.error('Checkin deletion error:', err);
        setNotification({ message: `Erro ao excluir check-in: ${err.message || err}`, type: 'error' });
      }
    } else {
      setNotification({ message: 'Check-in excluído com sucesso!', type: 'success' });
    }
  };

  const handleOpenCheckinAtCoords = (lat?: number, lng?: number, placeName?: string) => {
    setCheckinCoords({ lat, lng, placeName });
    setIsCheckinModalOpen(true);
  };

  const currencySymbol = preferences.currency === 'USD' ? '$' : preferences.currency === 'EUR' ? '€' : preferences.currency === 'GBP' ? '£' : 'R$';


  const filteredTrips = activeTrips;
  
  const displayTrips = filteredTrips.length > 0 ? filteredTrips : activeTrips;
  const recentTrips = [...displayTrips].sort((a, b) => {
    const now = new Date().getTime();
    const aDate = new Date(a.startDate || a.createdAt).getTime();
    const bDate = new Date(b.startDate || b.createdAt).getTime();
    const aIsFuture = a.startDate && aDate >= now;
    const bIsFuture = b.startDate && bDate >= now;

    if (aIsFuture && !bIsFuture) return -1;
    if (!aIsFuture && bIsFuture) return 1;
    if (aIsFuture && bIsFuture) return aDate - bDate; // nearest future trip first
    return bDate - aDate; // most recent past trip first
  });
  const hasNoFilteredTrips = activeTrips.length === 0;
  
  useEffect(() => {
    setFeaturedTripIndex(0);
  }, [trips.length]);

  useEffect(() => {
    if (recentTrips.length <= 1) return;
    const interval = setInterval(() => {
      setFeaturedTripIndex(prev => (prev + 1) % recentTrips.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [recentTrips.length]);

  const featuredTrip = recentTrips[featuredTripIndex] || recentTrips[0] || null;
  const image1 = featuredTrip; // Foto grande & background principal
  const image2 = recentTrips.length >= 2 ? recentTrips[(featuredTripIndex + 1) % recentTrips.length] : null; // 1º quadro pequeno
  const image3 = recentTrips.length >= 3 ? recentTrips[(featuredTripIndex + 2) % recentTrips.length] : null; // 2º quadro pequeno
  const displayName = user?.displayName || preferences.displayName || 'Morgan';

  return (
    <div className="min-h-screen bg-[#D4D9D9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans relative overflow-x-hidden transition-colors duration-500 flex flex-col justify-between pb-16 md:pb-0">
      {/* Notification Banner */}
      {notification && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[999] px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border backdrop-blur-xl animate-in slide-in-from-top duration-300 ${
          notification.type === 'success' 
            ? 'bg-emerald-900/95 border-emerald-500/30 text-white' 
            : 'bg-red-950/95 border-red-500/30 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-lime-400" />
          ) : (
            <X className="w-4 h-4 text-red-400" />
          )}
          <span className="text-xs font-black tracking-wide">{notification.message}</span>
        </div>
      )}

      {/* Top Header Navigation (Unificado sem tarja) */}
      {activeTab !== 'home' && (
        <SiteHeader
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onOpenTripForm={() => {
            setTripToEdit(null);
            setIsTripFormOpen(true);
          }}
          onOpenSearch={() => setIsSearchOpen(true)}
          searchQuery={searchQuery}
          user={user}
          onUserChange={setUser}
          onOpenCustomization={() => setIsCustomizationOpen(true)}
        />
      )}

      {/* Dynamic Main View */}
      {activeTab === 'home' && (
        <LuxuryHeroHome
          trips={activeTrips}
          recentTrips={recentTrips}
          featuredTripIndex={featuredTripIndex}
          setFeaturedTripIndex={setFeaturedTripIndex}
          featuredTrip={featuredTrip}
          onTabChange={handleTabChange}
          onSelectTripForDetail={(trip) => setSelectedTripForDetail(trip)}
          onOpenTripForm={() => {
            setTripToEdit(null);
            setIsTripFormOpen(true);
          }}
          onOpenCustomization={() => setIsCustomizationOpen(true)}
          user={user}
          onUserChange={setUser}
          preferences={preferences}
        />
      )}

      {activeTab === 'popular' && (
        <div className="animate-in fade-in duration-300">
          <DestinosView
            trips={activeTrips}
            onSelectTrip={(selected) => setSelectedTripForDetail(selected)}
            onDeleteTrip={handleDeleteTrip}
            onToggleFavorite={(trip) => {
              const updatedTrip: Trip = {
                ...trip,
                isFavorite: !trip.isFavorite,
                status: trip.status === 'visited' ? 'completed' : trip.status
              };
              handleSaveTrip(updatedTrip);
            }}
            onAddNewTrip={() => {
              setTripToEdit(null);
              setIsTripFormOpen(true);
            }}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            userTravelTypes={preferences.travelTypes}
          />
        </div>
      )}

      {activeTab === 'map' && (
        <div className="animate-in fade-in duration-300 w-full h-[calc(100vh-80px)] overflow-hidden">
          <InteractiveMap
            trips={trips}
            checkins={checkins}
            mapStyle={preferences.mapStyle}
            originCity={preferences.originCity}
            originCoords={preferences.originCoords}
            onSelectTrip={(t) => setSelectedTripForDetail(t)}
            onSelectCheckin={(c) => window.open(c.googleMapsUrl, '_blank')}
            onNewCheckinAtCoords={(lat, lng, placeName) => handleOpenCheckinAtCoords(lat, lng, placeName)}
          />
        </div>
      )}

      {activeTab === 'bagagem' && (
        <div className="animate-in fade-in duration-300 pt-4 px-3 max-w-full mx-auto flex-1 w-full pb-12">
          <div className="flex items-center gap-3.5 mb-6 px-2 sm:px-4">
            <div className="w-11 h-11 rounded-2xl bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] flex items-center justify-center shadow-lg shrink-0">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#001f3f] dark:text-white tracking-tight">
                Checklist de Bagagem Padrão
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
                Defina seus itens essenciais aqui. Ao criar uma nova viagem, esta lista é copiada automaticamente.
              </p>
            </div>
          </div>
          <BagagemView
            masterItems={masterBaggage}
            onUpdateMasterItems={handleUpdateMasterBaggage}
          />
        </div>
      )}

      {activeTab === 'configuracoes' && (
        <div className="animate-in fade-in duration-300">
          <ConfiguracoesView
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            user={user}
            onGoogleLogin={async () => {
              try {
                await loginWithGoogle();
              } catch(e) {
                console.error(e);
              }
            }}
          />
        </div>
      )}

      {/* Rodapé Glassmorphism Ampliado com Destaque na Marca Melia */}
      <footer className={`w-full backdrop-blur-[20px] shadow-2xl relative z-30 shrink-0 transition-all ${
        activeTab === 'home'
          ? '-mt-24 sm:-mt-20 py-6 sm:py-8 bg-white/45 dark:bg-slate-950/60 border-t border-slate-200/60 dark:border-white/10 text-slate-900 dark:text-white'
          : 'mt-20 py-8 sm:py-12 bg-white/15 dark:bg-[#001f3f]/15 border-t border-white/60 dark:border-white/10'
      }`}>
        <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Esquerda: Informações de Direitos Reservados */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1.5">
            <p className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
              © {new Date().getFullYear()} Melia. Todos os direitos reservados.
            </p>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Planejamento inteligente de roteiros, mapas interativos e memórias inesquecíveis.
            </p>
          </div>

          {/* Direita: Logo Horizontal Melia Ampliada e Destacada */}
          <div 
            onClick={() => handleTabChange('home')}
            className="flex items-center cursor-pointer transition-all hover:scale-105 opacity-90 hover:opacity-100 shrink-0 bg-transparent"
            title="Voltar ao Início"
          >
            <div className="hidden md:flex">
              <MileaLogoHorizontal size="xl" />
            </div>
            <div className="md:hidden flex">
              <MileaLogoHorizontal size="lg" />
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Nav (Mobile Only) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-auto max-w-[92vw] bg-white/70 dark:bg-[#001f3f]/80 backdrop-blur-[15px] border border-white/60 dark:border-white/10 rounded-full p-1.5 flex items-center justify-center gap-2 z-50 shadow-2xl">
        <button 
          onClick={() => handleTabChange('home')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'home' 
              ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-lg scale-105' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
          title="Início"
        >
          <Home className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleTabChange('popular')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'popular' 
              ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-lg scale-105' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
          title="Destinos"
        >
          <Compass className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleTabChange('map')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'map' 
              ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-lg scale-105' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
          title="Mapa"
        >
          <MapIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleTabChange('bagagem')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'bagagem' 
              ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-lg scale-105' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
          title="Bagagem Padrão"
        >
          <Briefcase className="w-5 h-5" />
        </button>
        <button 
          onClick={() => handleTabChange('configuracoes')}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 ${
            activeTab === 'configuracoes' 
              ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-lg scale-105' 
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/40 dark:hover:bg-white/10'
          }`}
          title="Configurações"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Modals */}
      
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        user={user}
        onGoogleLogin={async () => {
          try {
            await loginWithGoogle();
          } catch(e) {
            console.error(e);
          }
        }}
      />
      <AITripGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        currencySymbol={currencySymbol}
        onAddTrip={(newTrip) => {
          handleSaveTrip(newTrip);
          setSelectedTripForDetail(newTrip);
        }}
      />
      <TripFormModal
        isOpen={isTripFormOpen}
        onClose={() => {
          setIsTripFormOpen(false);
          setTripToEdit(null);
        }}
        currencySymbol={currencySymbol}
        onSaveTrip={handleSaveTrip}
        tripToEdit={tripToEdit}
      />
      <TripDetailModal
        trip={selectedTripForDetail}
        checkins={checkins}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedTripForDetail(null)}
        onUpdateTrip={(updated) => {
          handleSaveTrip(updated);
          setSelectedTripForDetail(updated);
        }}
        onDeleteTrip={handleDeleteTrip}
        onEditTripDetails={(t) => {
          setTripToEdit(t);
          setIsTripFormOpen(true);
        }}
        onOpenCheckinForTrip={(t) => handleOpenCheckinAtCoords(t.coordinates?.lat, t.coordinates?.lng, t.destination)}
        user={user}
        onUserChange={setUser}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        onTabChange={(tab) => {
          setSelectedTripForDetail(null);
          handleTabChange(tab);
        }}
        onOpenTripForm={() => {
          setTripToEdit(null);
          setIsTripFormOpen(true);
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        searchQuery={searchQuery}
      />
      <CheckInModal
        isOpen={isCheckinModalOpen}
        onClose={() => setIsCheckinModalOpen(false)}
        onSaveCheckin={handleSaveCheckin}
        trips={activeTrips}
        initialLat={checkinCoords.lat}
        initialLng={checkinCoords.lng}
        initialPlaceName={checkinCoords.placeName}
      />
    </div>
  );
}
