import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { Trip, CheckIn, ItineraryItem } from '../types';
import {
  MapPin,
  Navigation,
  Star,
  Clock,
  Compass,
  Search,
  ExternalLink,
  Plane,
  Hotel,
  Utensils,
  Calendar,
  Users,
  Edit3,
  Plus,
  Share2,
  Layers,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
  Menu
} from 'lucide-react';

interface InteractiveMapProps {
  trips: Trip[];
  checkins: CheckIn[];
  mapStyle?: 'standard' | 'satellite' | 'dark';
  originCity?: string;
  originCoords?: { lat: number; lng: number };
  onSelectTrip: (trip: Trip) => void;
  onSelectCheckin: (checkin: CheckIn) => void;
  onNewCheckinAtCoords: (lat: number, lng: number, placeName?: string) => void;
}

// Sample fallback itinerary if trip has no activities yet
const FALLBACK_ITINERARY_DAY1: ItineraryItem[] = [
  {
    id: 'act-1',
    day: 1,
    time: '09:45 – 14:30',
    place: 'Guarulhos (GRU) para Narita (NRT)',
    title: 'Guarulhos (GRU) para Narita (NRT)',
    description: 'Voo JL 043 • Japan Airlines • Confirmado',
    done: true,
    cost: 4500,
    category: 'transport',
    location: 'Aeroporto Narita, Tóquio',
    coordinates: { lat: 35.772, lng: 140.392 },
  },
  {
    id: 'act-2',
    day: 1,
    time: '16:00',
    place: 'Hotel Gracery Shinjuku',
    title: 'Hotel Gracery Shinjuku',
    description: 'Quarto Duplo Standard • 5 noites',
    done: false,
    cost: 3200,
    category: 'lodging',
    location: 'Shinjuku, Tóquio',
    coordinates: { lat: 35.695, lng: 139.702 },
  },
  {
    id: 'act-3',
    day: 1,
    time: '19:00',
    place: 'Passeio noturno em Shinjuku',
    title: 'Passeio noturno em Shinjuku',
    description: 'Jantar livre pela região de Omoide Yokocho e reconhecimento da área.',
    done: false,
    cost: 350,
    category: 'activity',
    location: 'Omoide Yokocho, Shinjuku',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
    coordinates: { lat: 35.693, lng: 139.699 },
  },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  trips,
  checkins,
  mapStyle: initialMapStyle = 'dark',
  originCity = 'São Paulo',
  originCoords = { lat: -23.5505, lng: -46.6333 },
  onSelectTrip,
  onSelectCheckin,
  onNewCheckinAtCoords,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  const [currentMapStyle, setCurrentMapStyle] = useState<'standard' | 'satellite' | 'dark'>(initialMapStyle);
  const [selectedTripId, setSelectedTripId] = useState<string>(() => trips[0]?.id || '');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(true);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Active Trip object
  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === selectedTripId) || trips[0] || null;
  }, [trips, selectedTripId]);

  // Handle Share Trip
  const handleShareTrip = async () => {
    const tripTitle = activeTrip?.title || 'Roteiro de Viagem';
    const destination = activeTrip?.destination || 'Destino';
    const dates = activeTrip?.startDate ? ` (${activeTrip.startDate} - ${activeTrip.endDate})` : '';
    const shareText = `Confira o roteiro "${tripTitle}" em ${destination}${dates} no Melia - Diário de Viagens!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tripTitle} - Melia`,
          text: shareText,
          url: shareUrl,
        });
        setShareToast('Roteiro compartilhado com sucesso!');
        setTimeout(() => setShareToast(null), 3500);
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${tripTitle} (${destination})\n${shareText}\n${shareUrl}`);
      setShareToast('Link e detalhes copiados para a área de transferência!');
      setTimeout(() => setShareToast(null), 3500);
    } catch {
      setShareToast('Link copiado!');
      setTimeout(() => setShareToast(null), 3500);
    }
  };

  // Active Trip Itinerary for current selected day
  const dayActivities = useMemo(() => {
    if (!activeTrip) return FALLBACK_ITINERARY_DAY1;
    if (activeTrip.itinerary && activeTrip.itinerary.length > 0) {
      const filtered = activeTrip.itinerary.filter((i) => i.day === selectedDay);
      return filtered.length > 0 ? filtered : activeTrip.itinerary;
    }
    return FALLBACK_ITINERARY_DAY1;
  }, [activeTrip, selectedDay]);

  // Total activities and estimated budget stats
  const totalActivitiesCount = useMemo(() => {
    if (!activeTrip) return 12;
    return activeTrip.itinerary && activeTrip.itinerary.length > 0
      ? activeTrip.itinerary.length
      : 12;
  }, [activeTrip]);

  const estimatedExpense = useMemo(() => {
    if (!activeTrip) return 14500;
    if (activeTrip.itinerary && activeTrip.itinerary.length > 0) {
      return activeTrip.itinerary.reduce((acc, curr) => acc + (curr.cost || 0), 0) || 14500;
    }
    return activeTrip.budget || 14500;
  }, [activeTrip]);

  const totalBudgetLimit = useMemo(() => {
    if (!activeTrip) return 25000;
    return activeTrip.budget ? Math.max(activeTrip.budget, 25000) : 25000;
  }, [activeTrip]);

  // Tile URL Map
  const getTileUrl = (style: string) => {
    if (style === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (style === 'standard') {
      return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    }
    return 'https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png';
  };

  // Initialize Leaflet Map centered on user's origin country / coordinates
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Focus on user's origin coordinates (or Brazil as default user origin)
    const initialCenter: [number, number] = originCoords?.lat && originCoords?.lng
      ? [originCoords.lat, originCoords.lng]
      : [-14.2350, -51.9253]; // Brazil geographical center
    const initialZoom = originCoords ? 6 : 4; // Country-level zoom perspective

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
    });

    const tileLayer = L.tileLayer(getTileUrl(currentMapStyle), {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update tile layer style
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(getTileUrl(currentMapStyle));
    }
  }, [currentMapStyle]);

// SVG Map Marker Icons (Solid filled shapes for high visibility)
const MAP_ICONS_SVG = {
  dest: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  mapPin: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
  transport: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  lodging: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>`,
  food: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.46 3.91 3.45 4.38V22h2.1v-8.62C10.54 12.91 12 11.12 12 9V2h-1v7zm5-7v7.58c0 1.83.84 3.54 2.29 4.64L17 22h2.5l1.32-8.32C22.25 12.28 23 10.5 23 8.58V2h-7z"/></svg>`,
  activity: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6.5 17.5l3.31-7.69L17.5 6.5l-3.31 7.69zM12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1 1.1-.49 1.1-1.1-.49-1.1-1.1-1.1z"/></svg>`,
};

// Render Map Markers with transparent glassmorphism in general view and high contrast on selected POI
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // Custom Icon Generator for Activities
    const createMarkerHtml = (cat: string) => {
      let svgIcon = MAP_ICONS_SVG.mapPin;
      let glassBg = 'rgba(255, 255, 255, 0.20)';
      let textColor = '#001f3f'; // Dark Navy Palette Color

      if (cat === 'transport') {
        svgIcon = MAP_ICONS_SVG.transport;
        textColor = '#007ea7';
      } else if (cat === 'lodging') {
        svgIcon = MAP_ICONS_SVG.lodging;
        textColor = '#0284c7';
      } else if (cat === 'food') {
        svgIcon = MAP_ICONS_SVG.food;
        textColor = '#d97706';
      } else if (cat === 'activity') {
        svgIcon = MAP_ICONS_SVG.activity;
        textColor = '#001f3f';
      }

      return L.divIcon({
        html: `
          <div style="
            background: ${glassBg};
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
            box-shadow: 0 4px 16px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.6);
            border: 1.5px solid rgba(255, 255, 255, 0.65);
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          ">
            ${svgIcon}
          </div>
        `,
        className: 'custom-map-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    // Render markers for day activities of active trip
    dayActivities.forEach((act) => {
      if (act.coordinates && act.coordinates.lat && act.coordinates.lng) {
        const latLng: [number, number] = [act.coordinates.lat, act.coordinates.lng];

        const marker = L.marker(latLng, {
          icon: createMarkerHtml(act.category || 'activity'),
        }).addTo(markersGroup);

        const popupContent = document.createElement('div');
        popupContent.className = 'p-2 max-w-[220px] text-left text-slate-900 dark:text-white';
        popupContent.innerHTML = `
          <div class="font-bold text-xs text-[#007ea7] dark:text-[#a3e635] uppercase mb-1">${act.time}</div>
          <div class="font-bold text-sm leading-tight mb-1">${act.title || act.place}</div>
          <p class="text-xs text-slate-500 mb-2">${act.description}</p>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Render trip destination pins (Transparent Glass + Navy icon in general view; High contrast dark navy glass + glowing lime on selected)
    trips.forEach((trip) => {
      if (trip.coordinates && trip.coordinates.lat && trip.coordinates.lng) {
        const latLng: [number, number] = [trip.coordinates.lat, trip.coordinates.lng];

        const isCurrent = trip.id === activeTrip?.id;
        const glassBg = isCurrent ? 'rgba(0, 31, 63, 0.92)' : 'rgba(255, 255, 255, 0.20)';
        const textColor = isCurrent ? '#a3e635' : '#001f3f'; // Dark navy in general view, crisp lime when selected!
        const borderColor = isCurrent ? '#a3e635' : 'rgba(255, 255, 255, 0.65)';
        const shadowStyle = isCurrent
          ? 'box-shadow: 0 0 22px rgba(163, 230, 53, 0.85), 0 8px 25px rgba(0,0,0,0.5); transform: scale(1.15); z-index: 999;'
          : 'box-shadow: 0 4px 16px rgba(0,0,0,0.22), inset 0 1px 1px rgba(255,255,255,0.6);';

        const icon = L.divIcon({
          html: `
            <div style="
              background: ${glassBg};
              backdrop-filter: blur(15px);
              -webkit-backdrop-filter: blur(15px);
              width: 34px;
              height: 34px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${textColor};
              border: 2px solid ${borderColor};
              ${shadowStyle}
              cursor: pointer;
              transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            ">
              ${MAP_ICONS_SVG.dest}
            </div>
          `,
          className: 'custom-trip-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const marker = L.marker(latLng, { icon }).addTo(markersGroup);
        
        // On click: ONLY switch the active trip content on the left panel & smoothly focus in map without opening full screen modal
        marker.on('click', () => {
          setSelectedTripId(trip.id);
          if (trip.coordinates && trip.coordinates.lat && trip.coordinates.lng && mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([trip.coordinates.lat, trip.coordinates.lng], 11, { duration: 1.2 });
          }
        });
      }
    });
  }, [dayActivities, trips, activeTrip]);

  // Geolocation trigger
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada neste navegador.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 14);
        }
        onNewCheckinAtCoords(latitude, longitude, 'Minha Localização');
      },
      (err) => {
        console.error(err);
        alert('Não foi possível obter sua localização exata.');
      }
    );
  };

  // Search location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // 1. Try server geocode proxy
      let foundLat: number | null = null;
      let foundLng: number | null = null;

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const results = data?.results;
          if (Array.isArray(results) && results.length > 0) {
            foundLat = parseFloat(results[0].lat);
            foundLng = parseFloat(results[0].lon);
          }
        }
      } catch {
        // Fallback to direct or dictionary below
      }

      // 2. Dictionary fallback for quick instant navigation without network dependencies
      if (foundLat === null || foundLng === null) {
        const qLower = searchQuery.toLowerCase().trim();
        const cityMap: Record<string, [number, number]> = {
          'canela': [-29.3653, -50.8105],
          'gramado': [-29.3787, -50.8739],
          'porto alegre': [-30.0346, -51.2177],
          'florianópolis': [-27.5954, -48.5480],
          'florianopolis': [-27.5954, -48.5480],
          'curitiba': [-25.4284, -49.2733],
          'são paulo': [-23.5505, -46.6333],
          'sao paulo': [-23.5505, -46.6333],
          'rio de janeiro': [-22.9068, -43.1729],
          'salvador': [-12.9777, -38.5016],
          'recife': [-8.0476, -34.8770],
          'fortaleza': [-3.7319, -38.5267],
          'natal': [-5.7945, -35.2110],
          'belo horizonte': [-19.9167, -43.9345],
          'brasília': [-15.7975, -47.8919],
          'brasilia': [-15.7975, -47.8919],
          'foz do iguaçu': [-25.5469, -54.5882],
          'foz do iguacu': [-25.5469, -54.5882],
          'paraty': [-23.2178, -44.7131],
          'búzios': [-22.7469, -41.8817],
          'buzios': [-22.7469, -41.8817],
          'paris': [48.8566, 2.3522],
          'tokyo': [35.6762, 139.6503],
          'tóquio': [35.6762, 139.6503],
          'roma': [41.9028, 12.4964],
          'nova york': [40.7128, -74.0060],
          'new york': [40.7128, -74.0060],
          'lisboa': [38.7223, -9.1393],
          'londres': [51.5074, -0.1278],
          'barcelona': [41.3851, 2.1734],
        };
        for (const [key, coords] of Object.entries(cityMap)) {
          if (qLower.includes(key)) {
            [foundLat, foundLng] = coords;
            break;
          }
        }
      }

      if (foundLat !== null && foundLng !== null && mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([foundLat, foundLng], 12);
      }
    } catch {
      // Ignore
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full h-full p-2 sm:p-3 lg:p-4 flex flex-col lg:flex-row gap-3 lg:gap-4 text-left font-sans overflow-hidden">
      
      {/* Mobile Toggle Button for Sidebar */}
      <button
        onClick={() => setIsSidebarOpenMobile(!isSidebarOpenMobile)}
        className="lg:hidden absolute top-4 left-4 z-40 px-3.5 py-2 rounded-full bg-white/80 dark:bg-[#001f3f]/80 text-[#001f3f] dark:text-white backdrop-blur-md border border-white/60 dark:border-white/20 text-xs font-semibold flex items-center gap-2 shadow-xl cursor-pointer"
      >
        {isSidebarOpenMobile ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        <span>{isSidebarOpenMobile ? 'Fechar Painel' : 'Ver Roteiro'}</span>
      </button>

      {/* LEFT SIDEBAR: ITINERARY PANEL (Transparent Glassmorphism & Rounded Borders) */}
      <div
        className={`w-full lg:w-[340px] xl:w-[370px] shrink-0 h-full bg-white/35 dark:bg-[#001f3f]/25 text-slate-900 dark:text-white backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] shadow-xl overflow-hidden flex flex-col z-30 transition-all duration-300 ${
          isSidebarOpenMobile ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Top Header inside Sidebar */}
        <div className="p-4 sm:p-5 border-b border-white/40 dark:border-white/10 space-y-3.5">
          <div className="flex items-center justify-between">
            {/* Green / Navy Badge: Roteiro Ativo */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#001f3f] text-white dark:bg-[#a3e635]/20 dark:text-[#a3e635] border border-transparent dark:border-[#a3e635]/30 text-xs font-semibold uppercase tracking-normal">
              <Plane className="w-3.5 h-3.5" />
              <span>Roteiro Ativo</span>
            </div>

            {/* Standard 50px Action Button to Edit Itinerary */}
            <button
              onClick={() => activeTrip && onSelectTrip(activeTrip)}
              className="w-[50px] h-[50px] rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/50 dark:border-white/20 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 text-slate-800 dark:text-white cursor-pointer shrink-0"
              title="Editar Roteiro"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          </div>

          {/* Trip Selector & Main Titles */}
          <div>
            {trips.length > 1 && (
              <select
                value={selectedTripId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedTripId(newId);
                  const found = trips.find((t) => t.id === newId);
                  if (found?.coordinates?.lat && found?.coordinates?.lng && mapInstanceRef.current) {
                    mapInstanceRef.current.flyTo([found.coordinates.lat, found.coordinates.lng], 11, { duration: 1.2 });
                  }
                }}
                className="w-full mb-2 bg-white/60 dark:bg-[#001f3f]/60 backdrop-blur-md text-slate-900 text-xs font-semibold rounded-xl px-3 py-2 border border-white/60 dark:text-white dark:border-white/15 focus:outline-none cursor-pointer"
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {t.title} ({t.destination})
                  </option>
                ))}
              </select>
            )}

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#001f3f] dark:text-white tracking-normal leading-snug">
              {activeTrip?.title || 'Tóquio & Kyoto'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
              {activeTrip?.notes || activeTrip?.destination || 'Aventura Tecnológica e Tradição'}
            </p>
          </div>

          {/* Date & People Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 dark:bg-white/10 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white shadow-sm backdrop-blur-sm">
              <Calendar className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
              <span>
                {activeTrip?.startDate
                  ? `${activeTrip.startDate} - ${activeTrip.endDate}`
                  : '10 Abr - 20 Abr 2025'}
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/50 border border-white/60 dark:bg-white/10 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white shadow-sm backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-[#007ea7] dark:text-sky-400" />
              <span>2 Pessoas</span>
            </div>
          </div>
        </div>

        {/* Days Filter Section */}
        <div className="px-4 sm:px-5 py-2.5 border-b border-white/30 dark:border-white/10 bg-white/20 dark:bg-black/15 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#007ea7] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              D{selectedDay}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                {selectedDay === 1 ? '10 de Abril, Quinta-feira' : `Dia ${selectedDay} do Roteiro`}
              </div>
            </div>
          </div>

          {/* Day Pills Switcher */}
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((dayNum) => (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayNum)}
                className={`w-7 h-7 rounded-full text-xs font-bold transition cursor-pointer ${
                  selectedDay === dayNum
                    ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-slate-950 shadow-sm'
                    : 'bg-white/40 text-slate-700 hover:bg-white/70 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/20'
                }`}
              >
                {dayNum}
              </button>
            ))}
          </div>
        </div>

        {/* ITINERARY ACTIVITIES CARDS LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {dayActivities.map((act) => {
            const isTransport = act.category === 'transport';
            const isLodging = act.category === 'lodging';
            const isFood = act.category === 'food';

            return (
              <div
                key={act.id}
                className="bg-white/55 border border-white/60 text-slate-900 dark:bg-white/10 dark:border-white/10 dark:text-white backdrop-blur-[12px] rounded-2xl p-3.5 transition-all duration-300 hover:bg-white/75 dark:hover:bg-white/15 space-y-2 shadow-sm relative group"
              >
                {/* Header Row: Circular Icon + Tag + Time */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#007ea7] text-white flex items-center justify-center shrink-0 shadow-sm">
                      {isTransport ? (
                        <Plane className="w-3.5 h-3.5" />
                      ) : isLodging ? (
                        <Hotel className="w-3.5 h-3.5" />
                      ) : isFood ? (
                        <Utensils className="w-3.5 h-3.5" />
                      ) : (
                        <Compass className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {isTransport
                        ? 'VOO DE CHEGADA'
                        : isLodging
                        ? 'CHECK-IN HOTEL'
                        : isFood
                        ? 'GASTRONOMIA'
                        : 'EXPLORAÇÃO'}
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-[#007ea7] dark:text-[#a3e635] tracking-normal">
                    {act.time}
                  </span>
                </div>

                {/* Main Activity Title */}
                <h3 className="font-bold text-sm text-[#001f3f] dark:text-white leading-snug">
                  {act.title || act.place}
                </h3>

                {/* Details / Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 font-normal leading-relaxed">
                  {act.description}
                </p>

                {/* Optional Image Thumbnail */}
                {act.image && (
                  <div className="mt-1.5 rounded-xl overflow-hidden h-24 w-full border border-white/50 dark:border-white/10 relative">
                    <img src={act.image} alt={act.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Bottom Action Pill Badges */}
                <div className="pt-0.5 flex flex-wrap items-center gap-2">
                  {isTransport && (
                    <button className="px-2.5 py-1 rounded-full bg-white/60 hover:bg-white/80 text-[10px] font-semibold text-slate-800 border border-white/60 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 transition flex items-center gap-1.5 cursor-pointer">
                      🎫 Ver Bilhete
                    </button>
                  )}
                  {isLodging && (
                    <>
                      <button className="px-2.5 py-1 rounded-full bg-white/60 hover:bg-white/80 text-[10px] font-semibold text-slate-800 border border-white/60 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/20 transition flex items-center gap-1.5 cursor-pointer">
                        📍 Mapa
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Pago
                      </span>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add Activity to Day Dashed Button */}
          <button className="w-full py-2.5 rounded-2xl border border-dashed border-slate-400/40 dark:border-white/20 hover:border-[#007ea7] dark:hover:border-[#a3e635] text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-white/20 dark:bg-white/5 backdrop-blur-sm transition flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
            Adicionar Atividade ao Dia {selectedDay}
          </button>
        </div>

        {/* Bottom Primary Action Button */}
        <div className="p-3.5 sm:p-4 border-t border-white/30 dark:border-white/10 bg-white/20 dark:bg-black/15 backdrop-blur-md">
          <button
            onClick={() => activeTrip && onSelectTrip(activeTrip)}
            className="w-full py-3 rounded-2xl bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#001f3f] dark:hover:bg-[#b2f042] font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            Nova Atividade Geral
          </button>
        </div>
      </div>

      {/* RIGHT AREA: LEAFLET MAP CANVAS (Transparent Glassmorphism Wrapper with Rounded Corners) */}
      <div className="flex-1 h-full relative z-10 rounded-[28px] lg:rounded-[32px] overflow-hidden border border-white/60 dark:border-white/15 shadow-xl">
        {/* Toast Notification for Share / Copy */}
        {shareToast && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-white/90 dark:bg-[#001f3f]/90 text-[#001f3f] dark:text-white px-5 py-2.5 rounded-full backdrop-blur-md border border-white/60 dark:border-white/20 text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
            <Share2 className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
            <span>{shareToast}</span>
          </div>
        )}

        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Top-Left Search Box - Aligned flush with top-left corner */}
        <div className="absolute top-3.5 left-3.5 z-20 max-w-xs sm:max-w-sm w-full">
          <form
            onSubmit={handleSearch}
            className="bg-white/80 dark:bg-[#001f3f]/80 backdrop-blur-[15px] border border-white/60 dark:border-white/20 p-1.5 rounded-full shadow-2xl flex items-center gap-2 w-full transition-all focus-within:ring-2 focus-within:ring-[#007ea7] dark:focus-within:ring-[#a3e635]"
          >
            <Search className="w-4 h-4 text-slate-600 dark:text-slate-300 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cidades ou locais no mapa..."
              className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none tracking-normal"
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3.5 py-1.5 rounded-full bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-slate-950 text-xs font-semibold hover:opacity-90 transition shrink-0 cursor-pointer shadow-sm tracking-normal"
            >
              {isSearching ? '...' : 'Buscar'}
            </button>
          </form>
        </div>

        {/* Top-Right Floating Map Control Stack (Layers & Zoom) with Glassmorphism */}
        <div className="absolute top-3.5 right-3.5 z-20 pointer-events-auto hidden sm:flex flex-col gap-2">
          <button
            onClick={() =>
              setCurrentMapStyle((prev) =>
                prev === 'dark' ? 'satellite' : prev === 'satellite' ? 'standard' : 'dark'
              )
            }
            className="w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white backdrop-blur-[15px] border border-white/40 dark:border-white/20 flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer"
            title="Alternar estilo de mapa"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={handleCurrentLocation}
            className="w-10 h-10 rounded-full bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white backdrop-blur-[15px] border border-white/40 dark:border-white/20 flex items-center justify-center shadow-xl hover:scale-105 transition cursor-pointer"
            title="Minha Localização GPS"
          >
            <Navigation className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
          </button>

          <div className="bg-white/40 dark:bg-black/40 text-slate-900 dark:text-white backdrop-blur-[15px] border border-white/40 dark:border-white/20 rounded-full p-1 flex flex-col gap-1 shadow-xl">
            <button
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-8 h-8 rounded-full hover:bg-black/10 dark:hover:bg-white/10 flex items-center justify-center text-slate-900 dark:text-white cursor-pointer"
              title="Diminuir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BOTTOM FLOATING SUMMARY BAR (Light/Dark Glassmorphism) */}
        <div className="absolute bottom-3.5 left-3.5 right-3.5 lg:left-5 lg:right-5 z-20 pointer-events-auto">
          <div className="bg-white/75 dark:bg-[#001f3f]/75 text-slate-900 dark:text-white backdrop-blur-[16px] border border-white/70 dark:border-white/15 rounded-2xl p-3.5 sm:px-6 sm:py-3.5 shadow-2xl flex flex-wrap items-center justify-between gap-4 transition-colors duration-300">
            {/* Left Stats: GASTO PREVISTO */}
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  GASTO PREVISTO
                </span>
                <span className="text-lg sm:text-2xl font-extrabold text-[#001f3f] dark:text-white leading-tight">
                  R$ {estimatedExpense.toLocaleString('pt-BR')}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                    / {totalBudgetLimit.toLocaleString('pt-BR')}
                  </span>
                </span>
              </div>

              {/* Middle Stats: ATIVIDADES */}
              <div className="hidden sm:block border-l border-slate-300/70 dark:border-white/15 pl-6">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  ATIVIDADES
                </span>
                <span className="text-lg sm:text-xl font-extrabold text-[#001f3f] dark:text-white leading-tight">
                  {totalActivitiesCount} <span className="text-xs font-normal text-slate-600 dark:text-slate-300">agendadas</span>
                </span>
              </div>
            </div>

            {/* Right Action Buttons: Compartilhar */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShareTrip}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#001f3f]/10 hover:bg-[#001f3f]/20 dark:bg-white/10 dark:hover:bg-white/20 text-[#001f3f] dark:text-white text-xs font-semibold border border-[#001f3f]/20 dark:border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                title="Compartilhar Roteiro"
              >
                <Share2 className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                <span>Compartilhar</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
