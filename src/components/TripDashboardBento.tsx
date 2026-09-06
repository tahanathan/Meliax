import { createGoogleCalendarEvent, createGoogleTask } from '../lib/googleApi';
import { formatDate } from '../utils';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import L from 'leaflet';
import { Trip, ItineraryItem, CheckIn, BaggageItem, BaggageCategory } from '../types';
import { cloneMasterBaggageToTrip } from '../lib/masterBaggage';
import { SelectingCoverModal } from './SelectingCoverModal';
import {
  Compass,
  Plus,
  Maximize2,
  Edit3,
  PlaneTakeoff,
  Calendar, CalendarPlus, CheckSquare,
  Users,
  Mountain,
  Wallet,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Building,
  Utensils,
  MapPinPlus,
  Clock,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  FileEdit,
  StickyNote,
  PlusCircle,
  X,
  Hotel,
  Star,
  Check,
  Circle,
  CheckCircle2,
  Briefcase,
  Trash2,
  ShieldCheck,
  Upload,
  HardDrive,
  Link as LinkIcon,
  ZoomIn,
  Navigation,
  Crosshair,
  ExternalLink,
  LocateFixed,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface TripDashboardBentoProps {
  trips: Trip[];
  activeTrip?: Trip;
  checkins?: CheckIn[];
  onSelectTrip?: (trip: Trip) => void;
  onSaveTrip?: (updatedTrip: Trip) => void;
  onDeleteTrip?: (tripId: string) => void;
  onOpenEditTrip?: (trip: Trip) => void;
  onOpenNewTrip?: () => void;
  onOpenMapTab?: () => void;
  onOpenTripDetail?: (trip: Trip) => void;
}

// Default Sample Trip matching the exact visual mockup from prompt
const SAMPLE_BENTO_TRIP: Trip = {
  id: 'bento-sample-tokyo',
  userId: 'system',
  title: 'Tóquio & Kyoto',
  destination: 'Tóquio & Kyoto',
  country: 'Japão',
  status: 'planned',
  rating: 5,
  startDate: '2025-04-10',
  endDate: '2025-04-20',
  notes: 'Lembrar de comprar o JR Pass antes de viajar.\nFazer reserva no restaurante Ninja Akasaka (abre dia 15).\nChecar tomada/adaptador padrão japonês.',
  coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  budget: 25000,
  category: 'Cultura',
  coordinates: { lat: 35.6762, lng: 139.6503 },
  gallery: [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'
  ],
  itinerary: [
    {
      id: 'it-1',
      day: 1,
      time: '09:45 - 14:30',
      title: 'GRU para NRT',
      place: 'GRU para NRT',
      description: 'Voo JL 043 • Japan Airlines',
      location: 'Aeroporto Internacional de Narita (NRT)',
      category: 'transport',
      cost: 6800,
      done: false,
      coordinates: { lat: 35.772, lng: 140.3929 }
    },
    {
      id: 'it-2',
      day: 1,
      time: '16:00',
      title: 'Hotel Gracery Shinjuku',
      place: 'Hotel Gracery Shinjuku',
      description: 'Quarto Duplo Standard • 5 noites',
      location: 'Shinjuku, Tóquio',
      category: 'lodging',
      cost: 4200,
      done: true,
      coordinates: { lat: 35.6953, lng: 139.7022 }
    },
    {
      id: 'it-3',
      day: 1,
      time: '19:00',
      title: 'Passeio em Shinjuku',
      place: 'Passeio em Shinjuku',
      description: 'Jantar livre pela região de Omoide Yokocho e reconhecimento da área.',
      location: 'Omoide Yokocho, Shinjuku',
      category: 'activity',
      cost: 350,
      done: false,
      coordinates: { lat: 35.693, lng: 139.6998 }
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// --- Reusable Top-Right Action Button for Bento Cards (60px Circle, Pencil or custom on Hover) ---
interface BentoCardActionButtonProps {
  defaultIcon: React.ElementType;
  hoverIcon?: React.ElementType;
  title: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const BentoCardActionButton: React.FC<BentoCardActionButtonProps> = ({
  defaultIcon: DefaultIcon,
  hoverIcon: HoverIcon,
  title,
  onClick,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const ActiveHoverIcon = HoverIcon || Edit3;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-[60px] h-[60px] rounded-full bg-white/80 dark:bg-[#001f3f]/60 backdrop-blur-[15px] flex items-center justify-center hover:bg-[#007ea7] dark:hover:bg-[#a3e635] hover:text-white dark:hover:text-[#121f00] text-slate-800 dark:text-white transition-all shadow-md dark:shadow-lg border border-white/60 dark:border-white/10 cursor-pointer ${className}`}
      title={title}
    >
      {isHovered ? (
        <ActiveHoverIcon className="w-6 h-6 transition-transform scale-110" />
      ) : (
        <DefaultIcon className="w-6 h-6 transition-transform" />
      )}
    </button>
  );
};

// --- Sub-component for Real Leaflet Map in Card 3 ---
interface BentoMiniMapProps {
  trip: Trip;
  checkins?: CheckIn[];
  onOpenMapTab?: () => void;
  onAddLocal?: () => void;
  onExpandMap?: () => void;
}

const BentoMiniMap: React.FC<BentoMiniMapProps> = ({
  trip,
  checkins = [],
  onOpenMapTab,
  onAddLocal,
  onExpandMap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const tripCheckins = useMemo(() => {
    return checkins.filter(
      (c) =>
        c.tripId === trip.id ||
        (c.placeName && trip.destination && c.placeName.toLowerCase().includes(trip.destination.toLowerCase()))
    );
  }, [checkins, trip.id, trip.destination]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const defaultCoords = trip.coordinates || { lat: 35.6762, lng: 139.6503 };
    const map = L.map(containerRef.current, {
      center: [defaultCoords.lat, defaultCoords.lng],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const bounds: [number, number][] = [];

    const createIcon = (glassBg: string, svgContent: string, textColor = '#001f3f') => {
      return L.divIcon({
        html: `
          <div style="
            background: ${glassBg};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
            box-shadow: 0 6px 18px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.7);
            border: 2px solid rgba(255, 255, 255, 0.85);
          ">
            ${svgContent}
          </div>
        `,
        className: 'custom-bento-pin',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
    };

    const SVG_DEST = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
    const SVG_PIN = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
    const SVG_ACT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6.5 17.5l3.31-7.69L17.5 6.5l-3.31 7.69zM12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1 1.1-.49 1.1-1.1-.49-1.1-1.1-1.1z"/></svg>`;

    // 1. Destination Main Marker
    if (trip.coordinates && trip.coordinates.lat && trip.coordinates.lng) {
      const pos: [number, number] = [trip.coordinates.lat, trip.coordinates.lng];
      bounds.push(pos);
      const destIcon = createIcon('rgba(163, 230, 53, 0.85)', SVG_DEST, '#001f3f');
      L.marker(pos, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<div style="font-size:12px; font-weight:bold; color:#0f172a;">${trip.destination || trip.title}</div>`);
    }

    // 2. Check-ins for this trip
    tripCheckins.forEach((c) => {
      if (c.lat && c.lng) {
        const cPos: [number, number] = [c.lat, c.lng];
        bounds.push(cPos);
        const cIcon = createIcon('rgba(255, 184, 0, 0.85)', SVG_PIN, '#001f3f');
        L.marker(cPos, { icon: cIcon })
          .addTo(map)
          .bindPopup(`<div style="font-size:11px; font-weight:bold; color:#0f172a;">${c.placeName}</div>`);
      }
    });

    // 3. Itinerary items with coordinates or fallback offsets
    (trip.itinerary || []).forEach((it, idx) => {
      let lat = it.coordinates?.lat;
      let lng = it.coordinates?.lng;
      if ((!lat || !lng) && trip.coordinates?.lat && trip.coordinates?.lng) {
        const angle = (idx * 137.5) * (Math.PI / 180);
        const radius = 0.007 + (idx * 0.003);
        lat = trip.coordinates.lat + Math.sin(angle) * radius;
        lng = trip.coordinates.lng + Math.cos(angle) * radius;
      }
      if (lat && lng) {
        const itPos: [number, number] = [lat, lng];
        bounds.push(itPos);
        const itIcon = createIcon('rgba(0, 126, 167, 0.85)', SVG_ACT, '#ffffff');
        L.marker(itPos, { icon: itIcon })
          .addTo(map)
          .bindPopup(`<div style="font-size:11px; font-weight:bold; color:#0f172a;">${it.title || it.place}</div>`);
      }
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 12);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [trip, tripCheckins]);

  return (
    <div className="relative w-full h-full min-h-[220px] rounded-[24px] overflow-hidden flex flex-col justify-between">
      <div ref={containerRef} className="absolute inset-0 z-[-1] w-full h-full" />

      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-[#121316]/90 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 flex items-center gap-2 shadow-md">
        <MapPin className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
        <span className="font-semibold text-xs text-slate-800 dark:text-[#e3e2e5]">
          {tripCheckins.length > 0
            ? `${tripCheckins.length} Check-in(s) • ${trip.destination}`
            : `Mapa: ${trip.destination}`}
        </span>
      </div>

      {/* Top Right Action (60px circle, 5px from top/right border) */}
      <div className="absolute top-[5px] right-[5px] z-10">
        <BentoCardActionButton
          defaultIcon={MapPin}
          hoverIcon={Maximize2}
          title="Ver no Mapa Completo Ampliado"
          onClick={onExpandMap || onOpenMapTab}
        />
      </div>

      {/* Bottom Button */}
      <div className="relative z-10 mt-auto p-3 flex gap-2">
        <button
          onClick={onAddLocal}
          className="flex-1 bg-white/95 dark:bg-[#121316]/90 backdrop-blur py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-1.5 shadow-md dark:shadow-lg cursor-pointer"
        >
          <MapPinPlus className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
          Adicionar Local
        </button>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                        POPUP MODAL 1: MAPA AMPLIADO                        */
/* -------------------------------------------------------------------------- */
interface ExpandedMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  checkins?: CheckIn[];
}

const ExpandedMapModal: React.FC<ExpandedMapModalProps> = ({
  isOpen,
  onClose,
  trip,
  checkins = [],
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const defaultCoords = trip.coordinates || { lat: -22.9068, lng: -43.1729 };
    const map = L.map(containerRef.current, {
      center: [defaultCoords.lat, defaultCoords.lng],
      zoom: 12,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const bounds: [number, number][] = [];

    const createIcon = (glassBg: string, textSymbol: string, textColor = '#001f3f') => {
      return L.divIcon({
        html: `
          <div style="
            background: ${glassBg};
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${textColor};
            font-weight: 900;
            font-size: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.8);
            border: 2px solid rgba(255, 255, 255, 0.9);
          ">
            ${textSymbol}
          </div>
        `,
        className: 'custom-expanded-pin',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });
    };

    // 1. Destination Main Marker
    if (trip.coordinates && trip.coordinates.lat && trip.coordinates.lng) {
      const pos: [number, number] = [trip.coordinates.lat, trip.coordinates.lng];
      bounds.push(pos);
      const destIcon = createIcon('rgba(163, 230, 53, 0.85)', '★', '#001f3f');
      L.marker(pos, { icon: destIcon })
        .addTo(map)
        .bindPopup(`
          <div style="padding:4px; font-family:sans-serif;">
            <strong style="font-size:14px; color:#0f172a; display:block;">${trip.destination || trip.title}</strong>
            <span style="font-size:12px; color:#64748b;">Destino Principal e Arredores</span>
          </div>
        `);
    }

    // 2. Check-ins for this trip
    const tripCheckins = checkins.filter((c) => c.tripId === trip.id);
    tripCheckins.forEach((c) => {
      if (c.lat && c.lng) {
        const cPos: [number, number] = [c.lat, c.lng];
        bounds.push(cPos);
        const cIcon = createIcon('rgba(255, 184, 0, 0.85)', '📍', '#001f3f');
        L.marker(cPos, { icon: cIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding:4px; font-family:sans-serif;">
              <strong style="font-size:13px; color:#0f172a; display:block;">${c.placeName}</strong>
              <span style="font-size:11px; color:#64748b;">${c.note || 'Check-in realizado'}</span>
            </div>
          `);
      }
    });

    // 3. Itinerary items with coordinates or fallback offsets
    (trip.itinerary || []).forEach((it, idx) => {
      let lat = it.coordinates?.lat;
      let lng = it.coordinates?.lng;
      if ((!lat || !lng) && trip.coordinates?.lat && trip.coordinates?.lng) {
        const angle = (idx * 137.5) * (Math.PI / 180);
        const radius = 0.007 + (idx * 0.003);
        lat = trip.coordinates.lat + Math.sin(angle) * radius;
        lng = trip.coordinates.lng + Math.cos(angle) * radius;
      }
      if (lat && lng) {
        const itPos: [number, number] = [lat, lng];
        bounds.push(itPos);
        const itIcon = createIcon('rgba(0, 126, 167, 0.85)', '📌', '#ffffff');
        L.marker(itPos, { icon: itIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding:4px; font-family:sans-serif;">
              <strong style="font-size:13px; color:#0f172a; display:block;">${it.title || it.place}</strong>
              <span style="font-size:11px; color:#64748b;">${it.description || 'Atividade / Ponto no Roteiro'}</span>
            </div>
          `);
      }
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else {
      map.setView([defaultCoords.lat, defaultCoords.lng], 12);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isOpen, trip, checkins]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[220] bg-transparent flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/20 rounded-3xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-[#1a1c1e]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#007ea7]/20 text-[#007ea7] dark:bg-[#a3e635]/20 dark:text-[#a3e635] flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Mapa Ampliado: {trip.destination || trip.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visualização da cidade e seus arredores, pontos turísticos e check-ins
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white flex items-center justify-center transition cursor-pointer"
            title="Fechar Mapa"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map View Container */}
        <div className="relative flex-1 w-full h-full">
          <div ref={containerRef} className="absolute inset-0 w-full h-full" />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                     MAIN COMPONENT: BENTO DASHBOARD                        */
/* -------------------------------------------------------------------------- */
export const TripDashboardBento: React.FC<TripDashboardBentoProps> = ({
  trips,
  activeTrip,
  checkins = [],
  onSelectTrip,
  onSaveTrip,
  onDeleteTrip,
  onOpenEditTrip,
  onOpenNewTrip,
  onOpenMapTab,
  onOpenTripDetail,
}) => {
  // Current Selected Trip
  const currentTrip = useMemo(() => {
    if (activeTrip) return activeTrip;
    if (trips && trips.length > 0) return trips[0];
    return SAMPLE_BENTO_TRIP;
  }, [activeTrip, trips]);

  // Modals & Editing States
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ItineraryItem | null>(null);
  const [isAddingLocal, setIsAddingLocal] = useState(false);
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isSelectingCoverOpen, setIsSelectingCoverOpen] = useState(false);
  const [isExpandedMapOpen, setIsExpandedMapOpen] = useState(false);

  const [isExportingCalendar, setIsExportingCalendar] = useState(false);
  const [isExportingTasks, setIsExportingTasks] = useState(false);
  
  const handleExportToCalendar = async () => {
    setIsExportingCalendar(true);
    try {
      await createGoogleCalendarEvent(currentTrip);
      alert('Roteiro adicionado ao seu Google Calendar com sucesso!');
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        alert('Você precisa estar logado com o Google para usar essa função. Conecte-se e tente novamente.');
      } else {
        alert('Ocorreu um erro ao adicionar ao Google Calendar. Verifique as permissões.');
      }
      console.error(err);
    }
    setIsExportingCalendar(false);
  };

  const handleExportToTasks = async () => {
    setIsExportingTasks(true);
    try {
      await createGoogleTask(currentTrip);
      alert('Tarefas do roteiro adicionadas ao seu Google Tasks com sucesso!');
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        alert('Você precisa estar logado com o Google para usar essa função. Conecte-se e tente novamente.');
      } else {
        alert('Ocorreu um erro ao adicionar ao Google Tasks. Verifique as permissões.');
      }
      console.error(err);
    }
    setIsExportingTasks(false);
  };

  // Title Form State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleText, setTitleText] = useState(currentTrip.title);

  useEffect(() => {
    setTitleText(currentTrip.title);
  }, [currentTrip.title]);

  const handleSaveTitle = () => {
    if (titleText.trim() && titleText !== currentTrip.title) {
      if (onSaveTrip) onSaveTrip({ ...currentTrip, title: titleText.trim() });
    }
    setIsEditingTitle(false);
  };

  // Combined Trip / Linked Trips State & Handlers
  const [combinedNameInput, setCombinedNameInput] = useState(currentTrip.combinedTripName || '');

  useEffect(() => {
    setCombinedNameInput(currentTrip.combinedTripName || '');
  }, [currentTrip.combinedTripName]);

  const linkedTrips = useMemo(() => {
    const ids = currentTrip.linkedTripIds || [];
    return trips.filter((t) => ids.includes(t.id) && t.id !== currentTrip.id);
  }, [trips, currentTrip.linkedTripIds, currentTrip.id]);

  const availableTripsToLink = useMemo(() => {
    const ids = currentTrip.linkedTripIds || [];
    return trips.filter((t) => t.id !== currentTrip.id && !ids.includes(t.id));
  }, [trips, currentTrip.linkedTripIds, currentTrip.id]);

  const handleToggleLinkTrip = (targetTripId: string) => {
    const currentLinked = currentTrip.linkedTripIds || [];
    const exists = currentLinked.includes(targetTripId);
    const updatedLinked = exists
      ? currentLinked.filter((id) => id !== targetTripId)
      : [...currentLinked, targetTripId];

    if (onSaveTrip) {
      onSaveTrip({
        ...currentTrip,
        linkedTripIds: updatedLinked,
        isCombinedTrip: updatedLinked.length > 0,
      });
    }
  };

  const handleSaveCombinedName = (name: string) => {
    if (onSaveTrip && name !== currentTrip.combinedTripName) {
      onSaveTrip({
        ...currentTrip,
        combinedTripName: name,
      });
    }
  };

  // Activity Form State
  const [actTitle, setActTitle] = useState('');
  const [actDate, setActDate] = useState('');
  const [actTime, setActTime] = useState('10:00 - 12:00');
  const [actCategory, setActCategory] = useState<'activity' | 'lodging' | 'food' | 'transport'>('activity');
  const [actDesc, setActDesc] = useState('');
  const [actCost, setActCost] = useState<number>(0);
  const [actDay, setActDay] = useState<number>(1);
  const [actLocationName, setActLocationName] = useState('');
  const [actMapLink, setActMapLink] = useState('');

  const isAppleDevice = useMemo(() => {
    return (
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(navigator.userAgent || '')
    );
  }, []);

  const handleOpenAddActivity = () => {
    setEditingActivity(null);
    setActTitle('');
    if (currentTrip.startDate) {
      const base = new Date(currentTrip.startDate + 'T00:00:00');
      if (!isNaN(base.getTime())) {
        base.setDate(base.getDate() + (selectedDay - 1));
        const yyyy = base.getFullYear();
        const mm = String(base.getMonth() + 1).padStart(2, '0');
        const dd = String(base.getDate()).padStart(2, '0');
        setActDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setActDate(currentTrip.startDate);
      }
    } else {
      setActDate('');
    }
    setActTime('10:00 - 12:00');
    setActCategory('activity');
    setActDesc('');
    setActCost(0);
    setActDay(selectedDay || 1);
    setActLocationName(currentTrip.destination || '');
    setActMapLink('');
    setIsAddingActivity(true);
  };

  const handleOpenEditActivity = (item: ItineraryItem) => {
    setEditingActivity(item);
    setActTitle(item.title || item.place || '');
    if (item.date) {
      setActDate(item.date);
    } else if (currentTrip.startDate) {
      const base = new Date(currentTrip.startDate + 'T00:00:00');
      if (!isNaN(base.getTime())) {
        base.setDate(base.getDate() + ((item.day || 1) - 1));
        const yyyy = base.getFullYear();
        const mm = String(base.getMonth() + 1).padStart(2, '0');
        const dd = String(base.getDate()).padStart(2, '0');
        setActDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setActDate(currentTrip.startDate);
      }
    } else {
      setActDate('');
    }
    setActTime(item.time || '10:00');
    setActCategory((item.category as any) || 'activity');
    setActDesc(item.description || '');
    setActCost(item.cost || 0);
    setActDay(item.day || 1);
    setActLocationName(item.location || item.place || currentTrip.destination || '');
    setActMapLink('');
    setIsAddingActivity(true);
  };

  const handleActDateChange = (newDateStr: string) => {
    setActDate(newDateStr);
    if (newDateStr && currentTrip.startDate) {
      const base = new Date(currentTrip.startDate + 'T00:00:00').getTime();
      const target = new Date(newDateStr + 'T00:00:00').getTime();
      if (!isNaN(base) && !isNaN(target)) {
        const diffDays = Math.floor((target - base) / (1000 * 60 * 60 * 24)) + 1;
        if (diffDays >= 1) {
          setActDay(diffDays);
        } else {
          setActDay(1);
        }
      }
    }
  };

  const handleDeleteActivity = (itemId: string) => {
    const updatedItinerary = (currentTrip.itinerary || []).filter((it) => it.id !== itemId);
    if (onSaveTrip) onSaveTrip({ ...currentTrip, itinerary: updatedItinerary });
  };

  // Local Form State
  const [localTitle, setLocalTitle] = useState('');
  const [localCategory, setLocalCategory] = useState<'hotel' | 'restaurant' | 'attraction'>('attraction');

  // Photo Form State
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoMode, setPhotoMode] = useState<'upload' | 'url'>('upload');
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState<string | null>(null);

  // Computed Gallery Photos
  const galleryPhotos = useMemo(() => {
    if (currentTrip.gallery && currentTrip.gallery.length > 0) {
      return currentTrip.gallery;
    }
    return [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80'
    ];
  }, [currentTrip.gallery]);

  const handleDeletePhotoFromGallery = (idxToRemove: number) => {
    const nextGal = galleryPhotos.filter((_, idx) => idx !== idxToRemove);
    if (onSaveTrip) {
      onSaveTrip({ ...currentTrip, gallery: nextGal });
    }
  };

  // Notes Form State (Always direct-editable)
  const [notesText, setNotesText] = useState(currentTrip.notes || '');

  useEffect(() => {
    setNotesText(currentTrip.notes || '');
  }, [currentTrip.notes]);

  // Selected Day state for Roteiro Principal date pills
  const [selectedDay, setSelectedDay] = useState<number>(1);

  // Bento Baggage Checklist State
  const [bentoBaggageCategory, setBentoBaggageCategory] = useState<BaggageCategory | null>(null);
  const [newBentoBaggageName, setNewBentoBaggageName] = useState('');

  // Calculate days list for Date Pills
  const tripDaysList = useMemo(() => {
    let duration = 3;
    if (currentTrip.startDate && currentTrip.endDate) {
      const s = new Date(currentTrip.startDate + 'T00:00:00').getTime();
      const e = new Date(currentTrip.endDate + 'T00:00:00').getTime();
      if (!isNaN(s) && !isNaN(e) && e >= s) {
        duration = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    const maxDayInItinerary = (currentTrip.itinerary || []).reduce((max, item) => Math.max(max, item.day || 1), 1);
    const totalDays = Math.max(duration, maxDayInItinerary, 1);

    const daysArr = [];
    const baseDate = currentTrip.startDate ? new Date(currentTrip.startDate + 'T00:00:00') : null;

    for (let d = 1; d <= totalDays; d++) {
      if (baseDate && !isNaN(baseDate.getTime())) {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + (d - 1));
        const dayNum = currentDate.getDate();
        const monthStr = currentDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
        daysArr.push({
          dayNumber: d,
          dateNum: dayNum,
          monthStr,
          fullDateStr: `${dayNum} de ${currentDate.toLocaleDateString('pt-BR', { month: 'long' })}`,
        });
      } else {
        daysArr.push({
          dayNumber: d,
          dateNum: d,
          monthStr: 'DIA',
          fullDateStr: `Dia ${d}`,
        });
      }
    }
    return daysArr;
  }, [currentTrip.startDate, currentTrip.endDate, currentTrip.itinerary]);

  // Trip Baggage Checklist items
  const tripBaggageItems = useMemo(() => {
    if (currentTrip.baggageChecklist && currentTrip.baggageChecklist.length > 0) {
      return currentTrip.baggageChecklist;
    }
    return cloneMasterBaggageToTrip();
  }, [currentTrip.baggageChecklist]);

  const handleToggleTripBaggageItem = (itemId: string) => {
    const updated = tripBaggageItems.map((i) =>
      i.id === itemId ? { ...i, packed: !i.packed } : i
    );
    if (onSaveTrip) {
      onSaveTrip({ ...currentTrip, baggageChecklist: updated });
    }
  };

  const handleAddTripBaggageItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBentoBaggageName.trim() || !bentoBaggageCategory) return;
    const newItem: BaggageItem = {
      id: `trip-bag-${Date.now()}`,
      category: bentoBaggageCategory,
      name: newBentoBaggageName.trim(),
      packed: false,
    };
    const updated = [...tripBaggageItems, newItem];
    if (onSaveTrip) {
      onSaveTrip({ ...currentTrip, baggageChecklist: updated });
    }
    setNewBentoBaggageName('');
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesText(val);
    if (onSaveTrip) {
      onSaveTrip({ ...currentTrip, notes: val });
    }
  };

  // Budget Form State
  const [newBudget, setNewBudget] = useState<number>(currentTrip.budget || 25000);

  // Calculations
  const totalSpent = (currentTrip.itinerary || []).reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalBudgetMax = currentTrip.budget || 25000;
  const spentPercent = Math.min(Math.round((totalSpent / totalBudgetMax) * 100), 100);

  // Donut chart calculations (r=46, circumference ~289)
  const circumference = 289;
  const strokeDashoffset = circumference - (spentPercent / 100) * circumference;

  // Save Activity Handler (Add or Edit)
  const handleSaveActivity = () => {
    if (!actTitle.trim()) return;

    const finalLocation = actLocationName.trim() || actMapLink.trim() || currentTrip.destination || actTitle.trim();

    let updatedStartDate = currentTrip.startDate;
    let updatedEndDate = currentTrip.endDate;
    let targetDay = actDay || 1;

    if (actDate) {
      if (currentTrip.startDate) {
        const startMs = new Date(currentTrip.startDate + 'T00:00:00').getTime();
        const actMs = new Date(actDate + 'T00:00:00').getTime();

        if (!isNaN(startMs) && !isNaN(actMs)) {
          if (actMs < startMs) {
            // Act date is earlier than start date: extend trip start date to actDate
            updatedStartDate = actDate;
            targetDay = 1;
          } else {
            targetDay = Math.floor((actMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
          }

          // Check if actDate exceeds end date
          if (currentTrip.endDate) {
            const endMs = new Date(currentTrip.endDate + 'T00:00:00').getTime();
            if (!isNaN(endMs) && actMs > endMs) {
              updatedEndDate = actDate;
            }
          } else {
            updatedEndDate = actDate;
          }
        }
      } else {
        // No start date set yet
        updatedStartDate = actDate;
        updatedEndDate = actDate;
        targetDay = 1;
      }
    }

    let updatedItinerary: ItineraryItem[];

    if (editingActivity) {
      updatedItinerary = (currentTrip.itinerary || []).map((it) =>
        it.id === editingActivity.id
          ? {
              ...it,
              title: actTitle.trim(),
              place: actTitle.trim(),
              date: actDate || undefined,
              time: actTime || '10:00',
              category: actCategory,
              description: actDesc,
              cost: Number(actCost) || 0,
              day: targetDay,
              location: finalLocation,
            }
          : it
      );
    } else {
      const newItem: ItineraryItem = {
        id: `it-${Date.now()}`,
        day: targetDay,
        date: actDate || undefined,
        time: actTime || '10:00',
        title: actTitle.trim(),
        place: actTitle.trim(),
        description: actDesc,
        category: actCategory,
        cost: Number(actCost) || 0,
        done: false,
        location: finalLocation,
      };
      updatedItinerary = [...(currentTrip.itinerary || []), newItem];
    }

    // If start date was shifted backwards, adjust other items so their day aligns
    if (updatedStartDate && updatedStartDate !== currentTrip.startDate && currentTrip.startDate) {
      const oldStartMs = new Date(currentTrip.startDate + 'T00:00:00').getTime();
      const newStartMs = new Date(updatedStartDate + 'T00:00:00').getTime();
      const shiftDays = Math.round((oldStartMs - newStartMs) / (1000 * 60 * 60 * 24));
      if (shiftDays > 0) {
        updatedItinerary = updatedItinerary.map((it) => {
          if (it.id === (editingActivity ? editingActivity.id : updatedItinerary[updatedItinerary.length - 1]?.id)) {
            return it;
          }
          if (it.date) {
            const itMs = new Date(it.date + 'T00:00:00').getTime();
            const newDay = Math.max(1, Math.floor((itMs - newStartMs) / (1000 * 60 * 60 * 24)) + 1);
            return { ...it, day: newDay };
          }
          return { ...it, day: (it.day || 1) + shiftDays };
        });
      }
    }

    const updatedTrip: Trip = {
      ...currentTrip,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      itinerary: updatedItinerary,
    };

    if (onSaveTrip) onSaveTrip(updatedTrip);

    setSelectedDay(targetDay);

    setActTitle('');
    setActDesc('');
    setActCost(0);
    setActLocationName('');
    setActMapLink('');
    setEditingActivity(null);
    setIsAddingActivity(false);
  };

  // Save Local Pin Handler
  const handleSaveLocal = () => {
    if (!localTitle.trim()) return;

    const newItem: ItineraryItem = {
      id: `local-${Date.now()}`,
      day: 1,
      time: 'Check-in',
      title: localTitle,
      place: localTitle,
      description: `Local adicionado ao mapa de check-ins (${localCategory})`,
      category: localCategory === 'hotel' ? 'lodging' : localCategory === 'restaurant' ? 'food' : 'activity',
      cost: 0,
      done: false,
      location: localTitle
    };

    const updatedItinerary = [...(currentTrip.itinerary || []), newItem];
    const updatedTrip = { ...currentTrip, itinerary: updatedItinerary };

    if (onSaveTrip) onSaveTrip(updatedTrip);

    setLocalTitle('');
    setIsAddingLocal(false);
  };

  // Save Photo Handler
  const handleSavePhoto = () => {
    if (!photoUrl.trim()) return;

    const updatedGallery = [...(currentTrip.gallery || []), photoUrl];
    const updatedTrip = { ...currentTrip, gallery: updatedGallery };

    if (onSaveTrip) onSaveTrip(updatedTrip);

    setPhotoUrl('');
    setIsAddingPhoto(false);
  };

  // Save Notes Handler
  const handleSaveNotes = () => {
    const updatedTrip = { ...currentTrip, notes: notesText };
    if (onSaveTrip) onSaveTrip(updatedTrip);
  };

  // Save Budget Handler
  const handleSaveBudget = () => {
    const updatedTrip = { ...currentTrip, budget: newBudget };
    if (onSaveTrip) onSaveTrip(updatedTrip);
    setIsEditingBudget(false);
  };

  // Format notes into list items if possible
  const notesList = useMemo(() => {
    if (!currentTrip.notes || !currentTrip.notes.trim()) {
      return [
        'Este espaço é dedicado ao registro de informações importantes da sua viagem, como números de reserva, contatos de emergência, lembretes de documentos e dicas locais.'
      ];
    }
    return currentTrip.notes.split('\n').filter((n) => n.trim().length > 0);
  }, [currentTrip.notes]);

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 md:p-8 bg-transparent text-slate-900 dark:text-[#e3e2e5] min-h-screen">
      {/* Trip Selector Header if multiple trips exist */}
      {trips && trips.length > 1 && (
        <div className="mb-6 flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-none bg-white/80 dark:bg-[#1f2022]/60 p-3 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-2 shrink-0">
            <Compass className="w-5 h-5 text-[#007ea7] dark:text-[#a3e635]" />
            <span className="text-xs font-bold text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider">
              Meus Roteiros:
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {trips.map((t) => {
              const isSelected = t.id === currentTrip.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onSelectTrip && onSelectTrip(t)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-bold shadow-md scale-105'
                      : 'bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 dark:bg-[#1f2022] dark:text-[#c4c6cf] dark:hover:text-white dark:hover:bg-white/10 border border-slate-200 dark:border-white/10'
                  }`}
                >
                  <span>{t.title}</span>
                </button>
              );
            })}
          </div>
          {onOpenNewTrip && (
            <button
              onClick={onOpenNewTrip}
              className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-[#007ea7] hover:text-white dark:bg-[#292a2c] dark:hover:bg-[#a3e635] dark:hover:text-[#121f00] text-slate-700 dark:text-[#c4c6cf] text-xs font-bold transition flex items-center gap-1 shrink-0 border border-slate-200 dark:border-white/10 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </button>
          )}
        </div>
      )}

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-[minmax(260px,auto)]">
        {/* Card 1: Header / Overview (Col Span 2) - Title of the trip */}
        <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-2 flex flex-col justify-between h-full min-h-[260px]">

          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

          {/* Banner Image Background */}
          <div className="absolute inset-0 z-[-1] pointer-events-none">
            <img
              src={currentTrip.coverImage || (currentTrip.gallery && currentTrip.gallery[0]) || 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'}
              alt={currentTrip.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          </div>

          <div className="relative z-10 pr-16">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-xl mb-2">
                <input
                  type="text"
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') setIsEditingTitle(false);
                  }}
                  onBlur={handleSaveTitle}
                  autoFocus
                  className="w-full bg-white dark:bg-[#0d0e11]/90 border-2 border-[#007ea7] dark:border-[#a3e635] rounded-xl px-4 py-1.5 font-extrabold text-2xl sm:text-3xl lg:text-4xl text-slate-900 dark:text-white focus:outline-none shadow-xl"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-2.5 rounded-xl bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-bold hover:bg-[#006688] dark:hover:bg-[#b2f746] cursor-pointer shrink-0"
                  title="Salvar Título"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setTitleText(currentTrip.title);
                  setIsEditingTitle(true);
                }}
                className="inline-block cursor-pointer mb-2"
                title="Clique para editar o título"
              >
                <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white drop-shadow-md leading-tight tracking-tight transition-colors hover:text-slate-200">
                  {currentTrip.title}
                </h1>
              </div>
            )}
            <p className="font-medium text-base text-white/90 drop-shadow-sm">
              {currentTrip.destination} • {currentTrip.notes ? currentTrip.notes.split('\n')[0] : 'Informações e Roteiro de Viagem'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-6 relative z-10">
            <div className="flex items-center gap-2 bg-white/20 bg-transparent px-4 py-2 rounded-xl border border-white/20">
              <Users className="w-4 h-4 text-white" />
              <span className="font-semibold text-sm text-white">
                {currentTrip.participants && currentTrip.participants.length > 0
                  ? `${currentTrip.participants.length} ${currentTrip.participants.length === 1 ? 'Pessoa' : 'Pessoas'}`
                  : '1 Pessoa'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportToCalendar();
              }}
              disabled={isExportingCalendar}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white transition disabled:opacity-50"
              title="Adicionar ao Google Calendar"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {isExportingCalendar ? 'Exportando...' : 'Google Calendar'}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleExportToTasks();
              }}
              disabled={isExportingTasks}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-white transition disabled:opacity-50"
              title="Adicionar Tarefas ao Google Tasks"
            >
              <CheckSquare className="w-4 h-4" />
              <span className="font-semibold text-sm">
                {isExportingTasks ? 'Exportando...' : 'Google Tasks'}
              </span>
            </button>
          </div>

          {/* Background decorative element */}
          <div className="absolute -bottom-10 -right-10 text-[#007ea7]/5 dark:text-[#a3e635]/5 select-none pointer-events-none">
            <Mountain className="w-48 h-48 opacity-10 text-[#007ea7] dark:text-[#a3e635]" />
          </div>
        </div>

        {/* Card 2: Budget Donut Chart (Col Span 1) */}
        <div
          onClick={() => setIsEditingBudget(true)}
          className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 flex flex-col items-center justify-between cursor-pointer h-full min-h-[260px]"
        >
          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />
          <div className="absolute top-[5px] right-[5px] z-10">
            <BentoCardActionButton
              defaultIcon={Wallet}
              title="Editar Orçamento"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingBudget(true);
              }}
            />
          </div>

          <div className="w-full flex justify-between items-start mb-2 pr-16">
            <h3 className="font-semibold text-xs text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
              Orçamento
            </h3>
          </div>

          {/* Corrected progress donut chart without any edge clipping */}
          <div className="relative w-40 h-40 mt-2 flex items-center justify-center p-1">
            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 120 120">
              <circle className="stroke-slate-200 dark:stroke-[#292a2c]" cx="60" cy="60" r="46" fill="transparent" strokeWidth="10" />
              <circle
                className="stroke-[#007ea7] dark:stroke-[#a3e635] transition-all duration-1000 ease-out"
                cx="60"
                cy="60"
                r="46"
                fill="transparent"
                strokeWidth="10"
                strokeDasharray="289"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0px 0px 6px rgba(0,126,167,0.3))' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-normal text-xs text-slate-500 dark:text-[#c4c6cf] mb-1">Gasto</span>
              <span className="font-extrabold text-2xl text-slate-900 dark:text-[#e3e2e5]">{spentPercent}%</span>
            </div>
          </div>

          <div className="w-full mt-4 flex justify-between items-end border-t border-slate-200 dark:border-white/10 pt-4">
            <div>
              <p className="font-bold text-sm text-[#007ea7] dark:text-[#a3e635]">R$ {totalSpent.toLocaleString('pt-BR')}</p>
              <p className="text-xs font-normal text-slate-500 dark:text-[#c4c6cf]">de R$ {totalBudgetMax.toLocaleString('pt-BR')}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-[#c4c6cf] group-hover:text-[#007ea7] dark:group-hover:text-[#a3e635] transition-colors" />
          </div>
        </div>

        {/* Card 3: Real Interactive Check-ins Map (Col Span 1) */}
        <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-0 flex flex-col justify-between h-full min-h-[260px]">

          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

          <BentoMiniMap
            trip={currentTrip}
            checkins={checkins}
            onOpenMapTab={onOpenMapTab}
            onAddLocal={() => setIsAddingLocal(true)}
            onExpandMap={() => setIsExpandedMapOpen(true)}
          />
        </div>

        {/* Card 4: Itinerary Timeline ("Roteiro Principal") (Col Span 2) */}
        <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-2 flex flex-col h-full">

          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

          <div className="absolute top-[5px] right-[5px] z-10">
            <BentoCardActionButton
              defaultIcon={Plus}
              hoverIcon={Sparkles}
              title="Adicionar Atividade ao Roteiro"
              onClick={() => {
                setActDay(selectedDay);
                handleOpenAddActivity();
              }}
            />
          </div>

          <div className="flex justify-between items-center mb-4 shrink-0 pr-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1a1c1e] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-800 dark:text-[#e3e2e5] shrink-0">
                <Clock className="w-4.5 h-4.5 text-[#007ea7] dark:text-[#a3e635]" />
              </div>
              <h2 className="font-bold text-xl text-slate-900 dark:text-[#e3e2e5] tracking-tight">Roteiro Principal</h2>
            </div>
          </div>

          {/* Scrollable vertical date pills centered below title */}
          <div className="w-full flex justify-start sm:justify-center items-center gap-2 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin shrink-0 border-b border-slate-200/80 dark:border-white/10 mb-4">
            {tripDaysList.map((dayObj) => {
              const isSelected = selectedDay === dayObj.dayNumber;
              return (
                <button
                  key={`day-pill-${dayObj.dayNumber}`}
                  type="button"
                  onClick={() => setSelectedDay(dayObj.dayNumber)}
                  className={`flex flex-col items-center justify-center min-w-[56px] px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] border-transparent shadow-lg font-bold scale-105'
                      : 'bg-white/40 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="text-base font-black leading-none mb-0.5">{dayObj.dateNum}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 leading-none">{dayObj.monthStr}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[380px] pr-2 relative scrollbar-thin">
            {/* Vertical Line centered on left-4 (16px) */}
            <div className="absolute left-4 top-2 bottom-0 w-[2px] -translate-x-1/2 bg-slate-200 dark:bg-white/10" />

            <div className="flex flex-col gap-6">
              {/* Day Sub-header */}
              <div className="relative pl-12">
                <div className="absolute left-4 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/20 border-2 border-[#007ea7] dark:border-[#a3e635] text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center z-10 text-xs font-black shadow-[0_0_12px_rgba(0,126,167,0.2)] dark:shadow-[0_0_12px_rgba(163,230,53,0.3)]">
                  D{selectedDay}
                </div>
                <h3 className="font-semibold text-sm text-slate-900 dark:text-[#e3e2e5] pt-1.5">
                  {tripDaysList.find((d) => d.dayNumber === selectedDay)?.fullDateStr || `Dia ${selectedDay}`}
                </h3>
              </div>

              {/* Items List Filtered by selectedDay */}
              {(() => {
                const dayActivities = (currentTrip.itinerary || []).filter(
                  (item) => (item.day || 1) === selectedDay
                );

                if (dayActivities.length === 0) {
                  return (
                    <div className="relative pl-12 my-2">
                      <div className="p-6 text-center border-2 border-dashed border-slate-300 dark:border-white/15 rounded-2xl bg-white/20 dark:bg-white/5 backdrop-blur-sm">
                        <Clock className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          Nenhuma atividade para este dia.
                        </p>
                        <button
                          onClick={() => {
                            setActDay(selectedDay);
                            handleOpenAddActivity();
                          }}
                          className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#007ea7]/10 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold hover:bg-[#007ea7]/20 dark:hover:bg-[#a3e635]/30 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Atividade
                        </button>
                      </div>
                    </div>
                  );
                }

                return dayActivities.map((item, idx) => {
                  const isTransport = item.category === 'transport';
                  const isLodging = item.category === 'lodging';
                  const isActivity = item.category === 'activity' || !item.category;

                  return (
                    <div key={item.id || idx} className="relative pl-12 group/item">
                      {/* Timeline Dot with pulsing ring */}
                      <div className="absolute left-4 top-5 -translate-x-1/2 z-10 flex items-center justify-center pointer-events-none">
                        {isActivity && (
                          <span className="absolute w-3.5 h-3.5 rounded-full bg-[#007ea7]/40 dark:bg-[#a3e635]/50 animate-ping" />
                        )}
                        <div
                          className={`w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#1f2022] transition-transform group-hover/item:scale-125 ${
                            isTransport
                              ? 'bg-[#007ea7] dark:bg-[#afc8f0]'
                              : isLodging
                              ? 'bg-[#00a8e8] dark:bg-[#78d1fe]'
                              : 'bg-[#007ea7] dark:bg-[#a3e635] shadow-[0_0_8px_rgba(0,126,167,0.5)] dark:shadow-[0_0_8px_rgba(163,230,53,0.7)]'
                          }`}
                        />
                      </div>

                      <div
                        className={`rounded-[24px] p-4 border transition-colors backdrop-blur-[12px] ${
                          isActivity
                            ? 'bg-white/40 dark:bg-[#001f3f]/30 border-white/60 dark:border-[#a3e635]/30 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:bg-white/60 dark:hover:bg-[#001f3f]/40'
                            : 'bg-white/30 dark:bg-[#001f3f]/20 border-white/40 dark:border-white/10 hover:bg-white/50 dark:hover:bg-[#001f3f]/30'
                        }`}
                      >
                        <div className="flex justify-between mb-2 items-center">
                          <span
                            className={`font-semibold uppercase text-xs ${
                              isTransport
                                ? 'text-[#007ea7] dark:text-[#afc8f0]'
                                : isLodging
                                ? 'text-[#00a8e8] dark:text-[#78d1fe]'
                                : 'text-[#007ea7] dark:text-[#a3e635] flex items-center gap-1'
                            }`}
                          >
                            {isActivity && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#007ea7] dark:bg-[#a3e635] animate-pulse" />
                            )}
                            {isTransport ? 'Voo / Transporte' : isLodging ? 'Hospedagem' : 'Atividade'}
                          </span>

                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditActivity(item);
                                }}
                                className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-[#007ea7] hover:text-white dark:hover:bg-[#a3e635] dark:hover:text-[#121f00] text-slate-700 dark:text-white transition cursor-pointer"
                                title="Editar Atividade"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteActivity(item.id);
                                }}
                                className="p-1.5 rounded-lg bg-slate-200 dark:bg-white/10 hover:bg-red-500 hover:text-white text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                title="Excluir Atividade"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="font-medium text-slate-600 dark:text-[#c4c6cf] text-xs">
                              {item.time || '10:00'}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base text-slate-900 dark:text-[#e3e2e5] mb-1 leading-snug">
                            {item.title || item.place}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-slate-600 dark:text-[#c4c6cf] leading-relaxed mb-2">
                              {item.description}
                            </p>
                          )}

                          {item.location && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                              <MapPin className="w-3 h-3 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          )}

                          {(item.location || item.place || item.coordinates) && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                              <a
                                href={
                                  item.coordinates
                                    ? `https://www.google.com/maps/dir/?api=1&destination=${item.coordinates.lat},${item.coordinates.lng}`
                                    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.location || item.place || item.title || '')}`
                                }
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#007ea7]/10 hover:bg-[#007ea7]/20 text-[#007ea7] dark:bg-[#a3e635]/15 dark:hover:bg-[#a3e635]/25 dark:text-[#a3e635] text-xs font-bold transition cursor-pointer whitespace-nowrap"
                                title="Traçar rota no Google Maps"
                              >
                                <Navigation className="w-3.5 h-3.5" />
                                Rota Google Maps
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </a>
                            </div>
                          )}

                          {item.cost ? (
                            <div className="mt-2 text-xs font-semibold text-[#007ea7] dark:text-[#a3e635]">
                              R$ {item.cost.toLocaleString('pt-BR')}
                            </div>
                          ) : null}
                        </div>

                        {isLodging && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="bg-[#007ea7]/10 dark:bg-[#a3e635]/10 text-[#007ea7] dark:text-[#a3e635] px-2.5 py-0.5 rounded text-xs font-bold uppercase border border-[#007ea7]/20 dark:border-[#a3e635]/20 whitespace-nowrap">
                              Confirmado
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Add Activity Button */}
              <div className="relative pl-12 mt-2">
                <button
                  onClick={() => {
                    setActDay(selectedDay);
                    handleOpenAddActivity();
                  }}
                  className="w-full py-3 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-slate-600 dark:text-[#c4c6cf] hover:border-[#007ea7] dark:hover:border-[#a3e635] hover:text-[#007ea7] dark:hover:text-[#a3e635] hover:bg-[#007ea7]/5 dark:hover:bg-[#a3e635]/5 transition-all flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Atividade (Dia {selectedDay})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Photos Carousel ("Inspiração & Fotos") */}
        <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-2 flex flex-col h-full">

          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

            <div className="flex justify-between items-center mb-4 pr-16">
              <h3 className="font-semibold text-xs text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-800 dark:text-[#e3e2e5]" />
                Inspiração & Fotos ({galleryPhotos.length})
              </h3>
              {/* Top Right Action Button (60px circle, 5px from border) */}
              <div className="absolute top-[5px] right-[5px] flex gap-2 z-10">
                <BentoCardActionButton
                  defaultIcon={Camera}
                  hoverIcon={Upload}
                  title="Adicionar / Enviar Fotos"
                  onClick={() => setIsAddingPhoto(true)}
                />
              </div>
            </div>

            <div className="overflow-x-auto flex gap-4 pb-2 snap-x snap-mandatory scrollbar-thin">
              {galleryPhotos.map((img, idx) => (
                <div
                  key={`gallery-${idx}`}
                  className="shrink-0 w-56 sm:w-64 h-36 sm:h-40 rounded-2xl overflow-hidden snap-center relative group/img border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-[#121316] shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Inspiração ${idx + 1}`}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500 cursor-pointer"
                    onClick={() => setSelectedLightboxPhoto(img)}
                  />
                  {/* Hover Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-opacity flex items-end justify-between p-3">
                    <button
                      onClick={() => setSelectedLightboxPhoto(img)}
                      className="text-xs font-bold text-white flex items-center gap-1 hover:text-[#007ea7] dark:hover:text-[#a3e635] cursor-pointer"
                    >
                      <ZoomIn className="w-4 h-4" />
                      Expandir
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhotoFromGallery(idx);
                      }}
                      className="w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center transition cursor-pointer"
                      title="Remover Foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div
                onClick={() => setIsAddingPhoto(true)}
                className="shrink-0 w-56 sm:w-64 h-36 sm:h-40 rounded-2xl overflow-hidden snap-center relative group/img cursor-pointer bg-slate-50 dark:bg-[#121316] flex items-center justify-center border border-dashed border-slate-300 dark:border-white/20 hover:border-[#007ea7] dark:hover:border-[#a3e635] hover:text-[#007ea7] dark:hover:text-[#a3e635] transition-colors text-slate-500 dark:text-[#c4c6cf]"
              >
                <div className="text-center p-3">
                  <UploadCloud className="w-8 h-8 mb-1.5 mx-auto block text-slate-400 dark:text-[#c4c6cf] group-hover/img:text-[#007ea7] dark:group-hover/img:text-[#a3e635] transition-transform group-hover/img:scale-110" />
                  <span className="text-xs font-bold block text-slate-800 dark:text-white">Adicionar Foto</span>
                  <span className="text-xs text-slate-500 dark:text-[#c4c6cf]">Upload ou URL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Notes / Quick Info ("Notas Rápidas") */}
          <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-2 flex flex-col h-full">

          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-xs text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                Notas Rápidas
              </h3>
            </div>

            <div className="relative flex-1">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#007ea7] dark:bg-[#a3e635] rounded-l-xl z-10 pointer-events-none" />
              <textarea
                id="bento-notes-textarea"
                value={notesText}
                onChange={handleNotesChange}
                placeholder="Escreva suas notas rápidas, lembretes, contatos de emergência e dicas aqui..."
                rows={5}
                className="w-full h-full min-h-[120px] bg-white/30 dark:bg-[#001f3f]/30 backdrop-blur-[12px] text-slate-900 dark:text-[#e3e2e5] placeholder-slate-500 dark:placeholder-slate-400 text-sm p-3.5 pl-5 rounded-xl border border-white/60 dark:border-white/10 focus:outline-none focus:border-[#007ea7]/50 dark:focus:border-[#a3e635]/50 focus:bg-white/50 dark:focus:bg-[#001f3f]/50 transition-all resize-none leading-relaxed shadow-inner"
              />
            </div>
          </div>

          {/* Card 7: Checklist de Bagagem (Bento Card Interativo) */}
          <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-2 flex flex-col h-full">
            {/* Decorative Glassmorphism Mesh Gradients */}
            <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

            {/* Header & Content */}
            {(() => {
              const packedCount = tripBaggageItems.filter(i => i.packed).length;
              const totalCount = tripBaggageItems.length;
              const percent = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
              const categories: BaggageCategory[] = ['Eletrônicos', 'Roupas', 'Higiene', 'Documentos', 'Outros'];

              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-xs text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                      Checklist de Bagagem
                    </h3>
                    <span className="text-xs font-bold text-[#007ea7] dark:text-[#a3e635]">
                      {packedCount}/{totalCount} ({percent}%)
                    </span>
                  </div>

                  {!bentoBaggageCategory ? (
                    <div className="grid grid-cols-2 gap-2.5 flex-1">
                      {categories.map((catName) => {
                        const catItems = tripBaggageItems.filter(i => i.category === catName);
                        const catPacked = catItems.filter(i => i.packed).length;
                        const catTotal = catItems.length;
                        const catPercent = catTotal > 0 ? Math.round((catPacked / catTotal) * 100) : 0;

                        return (
                          <div
                            key={catName}
                            onClick={() => setBentoBaggageCategory(catName)}
                            className="p-3 rounded-xl bg-white/40 dark:bg-[#121316]/50 border border-slate-200 dark:border-white/10 hover:border-[#007ea7] dark:hover:border-[#a3e635] transition cursor-pointer flex flex-col justify-between group/mini"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white group-hover/mini:text-[#007ea7] dark:group-hover/mini:text-[#a3e635] transition-colors">
                                {catName}
                              </span>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                {catPacked}/{catTotal}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className="bg-[#007ea7] dark:bg-[#a3e635] h-full transition-all duration-300"
                                style={{ width: `${catPercent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-white/10">
                        <button
                          onClick={() => setBentoBaggageCategory(null)}
                          className="text-xs font-bold text-[#007ea7] dark:text-[#a3e635] flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                        </button>
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase">
                          {bentoBaggageCategory}
                        </span>
                      </div>

                      <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-1 scrollbar-thin flex-1">
                        {tripBaggageItems.filter(i => i.category === bentoBaggageCategory).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleTripBaggageItem(item.id)}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/5 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-white/5 transition"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {item.packed ? (
                                <CheckCircle2 className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
                              )}
                              <span className={`font-semibold text-slate-900 dark:text-white truncate ${item.packed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                                {item.name}
                              </span>
                            </div>
                            {item.weightKg !== undefined && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0 ml-2">
                                {item.weightKg}kg
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleAddTripBaggageItem} className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 flex gap-1.5">
                        <input
                          type="text"
                          value={newBentoBaggageName}
                          onChange={(e) => setNewBentoBaggageName(e.target.value)}
                          placeholder={`+ Item em ${bentoBaggageCategory}...`}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] font-bold text-xs hover:opacity-90 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Card 8: Viagens Conectadas & Roteiros Vinculados */}
          <div className="bento-card relative bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] rounded-[32px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#a3e635]/50 transition-all duration-300 group p-6 lg:col-span-4 flex flex-col justify-between min-h-[240px]">
            {/* Decorative Glassmorphism Mesh Gradients */}
            <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-white/40 to-transparent dark:from-[#a3e635]/10 dark:via-[#001f3f]/40 dark:to-transparent pointer-events-none" />
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/20 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-[-1]" />

            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold text-xs text-slate-600 dark:text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                Viagens Conectadas & Roteiros Vinculados
              </h3>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#007ea7]/15 text-[#007ea7] dark:bg-[#a3e635]/20 dark:text-[#a3e635]">
                {linkedTrips.length > 0 ? `${linkedTrips.length + 1} Roteiros Integrados` : 'Roteiro Único'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 font-medium leading-relaxed">
              Passou ou vai passar por mais de um destino na mesma viagem? Vincule outros roteiros cadastrados para montar uma jornada completa.
            </p>

            {/* Optional Combined Circuit Title Input */}
            <div className="mb-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Nome do Circuito / Viagem Completa:
              </label>
              <input
                type="text"
                value={combinedNameInput}
                onChange={(e) => setCombinedNameInput(e.target.value)}
                onBlur={() => handleSaveCombinedName(combinedNameInput)}
                placeholder="Ex: Eurotrip 2025, Mochilão América do Sul..."
                className="w-full bg-white/40 dark:bg-[#001f3f]/30 border border-white/60 dark:border-white/15 rounded-xl text-xs font-semibold px-3.5 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
              />
            </div>

            {/* Linked Trips Display */}
            {linkedTrips.length > 0 ? (
              <div className="space-y-2 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Etapas da Viagem Combinada:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Current Trip Pill */}
                  <div className="p-3 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 border border-[#007ea7]/30 dark:border-[#a3e635]/30 flex items-center gap-2.5">
                    <img src={currentTrip.coverImage} alt={currentTrip.title} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold uppercase text-[#007ea7] dark:text-[#a3e635] block">Roteiro Atual</span>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">{currentTrip.title}</h5>
                    </div>
                  </div>

                  {/* Linked Trips List */}
                  {linkedTrips.map((lTrip) => (
                    <div
                      key={lTrip.id}
                      onClick={() => onSelectTrip && onSelectTrip(lTrip)}
                      className="p-3 rounded-2xl bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/60 dark:border-white/10 flex items-center gap-2.5 transition cursor-pointer group/link"
                    >
                      <img src={lTrip.coverImage} alt={lTrip.title} className="w-9 h-9 rounded-xl object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block truncate">{lTrip.destination}</span>
                        <h5 className="font-extrabold text-xs text-slate-900 dark:text-white group-hover/link:text-[#007ea7] dark:group-hover/link:text-[#a3e635] truncate">{lTrip.title}</h5>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleLinkTrip(lTrip.id);
                        }}
                        className="w-7 h-7 rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-500 flex items-center justify-center transition shrink-0 cursor-pointer"
                        title="Desvincular roteiro"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-white/20 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 text-center mb-4">
                <LinkIcon className="w-5 h-5 text-slate-400 mx-auto mb-1 opacity-60" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nenhum outro roteiro vinculado a esta viagem.</p>
              </div>
            )}

            {/* Select to Add/Link Another Trip */}
            {availableTripsToLink.length > 0 && (
              <div className="mt-auto pt-3 border-t border-slate-200/80 dark:border-white/10">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleToggleLinkTrip(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full bg-white/70 dark:bg-[#001f3f]/50 border border-white/70 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled className="bg-white dark:bg-slate-900">
                    + Vincular outro roteiro a esta mesma viagem...
                  </option>
                  {availableTripsToLink.map((t) => (
                    <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900">
                      {t.title} ({t.destination})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

      {/* --- LIGHTBOX MODAL FOR EXPANDED GALLERY PHOTOS --- */}
      {selectedLightboxPhoto && (
        <div
          className="fixed inset-0 z-[250] bg-transparent flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedLightboxPhoto(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#a3e635] p-2 cursor-pointer bg-transparent rounded-full border border-white/20 transition"
              title="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedLightboxPhoto}
              alt="Foto da Galeria"
              className="max-w-full max-h-[85vh] object-contain rounded-[24px] shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* --- MODALS FOR DATA INSERTION --- */}

      {/* 1. Add/Edit Activity Modal */}
      {isAddingActivity && (
        <div className="fixed inset-0 z-50 bg-transparent bg-transparent flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1f2022] border border-slate-200 dark:border-white/20 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-white/10 pb-4 sticky top-0 bg-white dark:bg-[#1f2022] z-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#007ea7] dark:text-[#a3e635]" />
                {editingActivity ? 'Editar Atividade' : 'Nova Atividade do Roteiro'}
              </h3>
              <button onClick={() => setIsAddingActivity(false)} className="text-slate-400 hover:text-slate-600 dark:text-[#c4c6cf] dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Título do Passeio / Atividade</label>
                <input
                  type="text"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  placeholder="Ex: Passeio no Cristo Redentor ou Museu do Amanhã"
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Data do Passeio</label>
                  <input
                    type="date"
                    value={actDate}
                    onChange={(e) => handleActDateChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Horário</label>
                  <input
                    type="text"
                    value={actTime}
                    onChange={(e) => setActTime(e.target.value)}
                    placeholder="10:00 - 12:30"
                    className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Categoria</label>
                  <select
                    value={actCategory}
                    onChange={(e) => setActCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  >
                    <option value="activity">Atividade / Passeio</option>
                    <option value="lodging">Hospedagem</option>
                    <option value="transport">Voo / Transporte</option>
                    <option value="food">Alimentação / Bar</option>
                  </select>
                </div>
              </div>

              {/* Localização & Mapas */}
              <div className="p-4 rounded-[24px] bg-slate-50 dark:bg-[#15171a] border border-slate-200 dark:border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                    Local do Passeio
                  </span>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#c4c6cf] block mb-1">
                    Nome do Local / Endereço
                  </label>
                  <input
                    type="text"
                    value={actLocationName}
                    onChange={(e) => setActLocationName(e.target.value)}
                    placeholder="Ex: Cristo Redentor, Rio de Janeiro..."
                    className="w-full bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-[#c4c6cf] block mb-1">
                    Link do Mapa (Opcional - Google Maps)
                  </label>
                  <input
                    type="text"
                    value={actMapLink}
                    onChange={(e) => setActMapLink(e.target.value)}
                    placeholder="https://maps.app.goo.gl/..."
                    className="w-full bg-white dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                </div>

                {/* Preview de Rota a partir do GPS atual */}
                {actLocationName.trim() && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(actLocationName.trim())}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3 rounded-xl bg-[#007ea7]/10 hover:bg-[#007ea7]/20 text-[#007ea7] dark:bg-[#a3e635]/15 dark:hover:bg-[#a3e635]/25 dark:text-[#a3e635] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                      title="Abrir rota no Google Maps a partir da localização atual"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Rota Google Maps
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Custo Estimado (R$)</label>
                <input
                  type="number"
                  value={actCost}
                  onChange={(e) => setActCost(Number(e.target.value))}
                  placeholder="350"
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Descrição & Dicas</label>
                <textarea
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  placeholder="Detalhes, ingressos, dicas ou pontos de referência..."
                  rows={2}
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingActivity(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveActivity}
                  className="flex-1 py-3 rounded-xl bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-black text-xs hover:bg-[#006688] dark:hover:bg-[#b2f746] shadow-lg cursor-pointer"
                >
                  Salvar Atividade
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Add Local Modal */}
      {isAddingLocal && (
        <div className="fixed inset-0 z-50 bg-transparent bg-transparent flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1f2022] border border-slate-200 dark:border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-white/10 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPinPlus className="w-5 h-5 text-[#007ea7] dark:text-[#a3e635]" />
                Adicionar Local
              </h3>
              <button onClick={() => setIsAddingLocal(false)} className="text-slate-400 hover:text-slate-600 dark:text-[#c4c6cf] dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Nome do Local</label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Ex: Senso-ji Temple, Asakusa"
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Tipo de Local</label>
                <select
                  value={localCategory}
                  onChange={(e) => setLocalCategory(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                >
                  <option value="attraction">Atração / Ponto Turístico</option>
                  <option value="restaurant">Restaurante / Bar</option>
                  <option value="hotel">Hotel / Hospedagem</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingLocal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveLocal}
                  className="flex-1 py-3 rounded-xl bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-black text-xs hover:bg-[#006688] dark:hover:bg-[#b2f746] shadow-lg cursor-pointer"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Add Photo Modal */}
      {isAddingPhoto && (
        <div className="fixed inset-0 z-[150] bg-transparent bg-transparent flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1f2022] border border-slate-200 dark:border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 border-b border-slate-200 dark:border-white/10 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#007ea7] dark:text-[#a3e635]" />
                Inspiração e Fotos
              </h3>
              <button onClick={() => setIsAddingPhoto(false)} className="text-slate-400 hover:text-slate-600 dark:text-[#c4c6cf] dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selector Tabs */}
            <div className="flex bg-slate-100 dark:bg-[#121316] p-1 rounded-[24px] border border-slate-200 dark:border-white/10 mb-4">
              <button
                type="button"
                onClick={() => setPhotoMode('upload')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  photoMode === 'upload'
                    ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] shadow'
                    : 'text-slate-600 dark:text-[#c4c6cf] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload do Dispositivo
              </button>
              <button
                type="button"
                onClick={() => setPhotoMode('url')}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  photoMode === 'url'
                    ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] shadow'
                    : 'text-slate-600 dark:text-[#c4c6cf] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Link Web (URL)
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {photoMode === 'upload' ? (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-2">
                    Escolha uma Foto do seu Dispositivo
                  </label>
                  <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-slate-300 dark:border-white/20 hover:border-[#007ea7] dark:hover:border-[#a3e635] rounded-[24px] cursor-pointer bg-slate-50 dark:bg-[#121316] hover:bg-slate-100 dark:hover:bg-[#18191c] transition group p-4 text-center">
                    <UploadCloud className="w-8 h-8 text-[#007ea7] dark:text-[#a3e635] group-hover:scale-110 transition mb-2" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Clique para selecionar arquivo</span>
                    <span className="text-xs text-slate-500 dark:text-[#c4c6cf] mt-1">PNG, JPG, WEBP, GIF (Armazenamento Criptografado)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (!file.type.startsWith('image/')) {
                          alert('Por favor, escolha um arquivo de imagem válido.');
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          const base64 = reader.result as string;
                          if (base64) {
                            const updatedGallery = [...(currentTrip.gallery || []), base64];
                            if (onSaveTrip) onSaveTrip({ ...currentTrip, gallery: updatedGallery });
                            setIsAddingPhoto(false);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">URL da Imagem</label>
                  <input
                    type="text"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingPhoto(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                {photoMode === 'url' && (
                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    className="flex-1 py-3 rounded-xl bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-black text-xs hover:bg-[#006688] dark:hover:bg-[#b2f746] shadow-lg cursor-pointer"
                  >
                    Salvar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Edit Budget Modal */}
      {isEditingBudget && (
        <div className="fixed inset-0 z-50 bg-transparent bg-transparent flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1f2022] border border-slate-200 dark:border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-slate-200 dark:border-white/10 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#007ea7] dark:text-[#a3e635]" />
                Ajustar Orçamento Total
              </h3>
              <button onClick={() => setIsEditingBudget(false)} className="text-slate-400 hover:text-slate-600 dark:text-[#c4c6cf] dark:hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-[#c4c6cf] block mb-1">Orçamento Limite (R$)</label>
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-[#121316] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBudget}
                  className="flex-1 py-3 rounded-xl bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00] font-black text-xs hover:bg-[#006688] dark:hover:bg-[#b2f746] shadow-lg cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Expanded Map Modal */}
      <ExpandedMapModal
        isOpen={isExpandedMapOpen}
        onClose={() => setIsExpandedMapOpen(false)}
        trip={currentTrip}
        checkins={checkins}
      />

      {/* 7. Selecting Cover Image Gallery Modal */}
      <SelectingCoverModal
        isOpen={isSelectingCoverOpen}
        onClose={() => setIsSelectingCoverOpen(false)}
        trip={currentTrip}
        onSelectCover={(photoUrl) => {
          if (onSaveTrip) {
            onSaveTrip({ ...currentTrip, coverImage: photoUrl });
          }
        }}
      />
    </div>
  );
};
