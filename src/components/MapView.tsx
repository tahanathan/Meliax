import { formatDate } from '../utils';
import React, { useState, useMemo } from 'react';
import { Trip, ItineraryItem } from '../types';
import { getActivityThumbnail } from '../utils/photoService';
import {
  Plane,
  Hotel,
  Ticket,
  Calendar,
  Users,
  MapPin,
  Plus,
  Share2,
  CheckCircle,
  Layers,
  Compass,
  Edit3,
  ExternalLink,
  DollarSign,
  ChevronDown,
  Navigation,
  ZoomIn,
  ZoomOut,
  X,
  Sparkles,
  Crosshair,
  LocateFixed,
  Smartphone
} from 'lucide-react';

interface MapViewProps {
  trips: Trip[];
  onUpdateTrip?: (updatedTrip: Trip) => void;
  onOpenNewTripModal?: () => void;
}

// Default active itinerary sample matching the exact mockup
const TOKYO_TRIP_SAMPLE: Trip = {
  id: 'tokyo-kyoto-sample',
  userId: 'system',
  title: 'Tóquio & Kyoto',
  destination: 'Tóquio & Kyoto',
  country: 'Japão',
  status: 'planned',
  rating: 5,
  gallery: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80'],
  startDate: '2025-04-10',
  endDate: '2025-04-20',
  notes: 'Aventura Tecnológica e Tradição',
  coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
  budget: 25000,
  category: 'Cultura',
  coordinates: { lat: 35.6762, lng: 139.6503 },
  itinerary: [
    {
      id: 'it-1',
      day: 1,
      time: '09:45 - 14:30',
      title: 'Guarulhos (GRU) para Narita (NRT)',
      place: 'Guarulhos (GRU) para Narita (NRT)',
      description: 'Voo JL 043 • Japan Airlines • Confirmado',
      location: 'Aeroporto Internacional de Narita (NRT)',
      category: 'transport',
      cost: 6800,
      done: true,
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
      title: 'Passeio noturno em Shinjuku',
      place: 'Passeio noturno em Shinjuku',
      description: 'Jantar livre pela região de Omoide Yokocho e reconhecimento da área.',
      location: 'Omoide Yokocho, Shinjuku',
      category: 'activity',
      cost: 350,
      done: false,
      coordinates: { lat: 35.693, lng: 139.6998 }
    },
    {
      id: 'it-4',
      day: 2,
      time: '09:00 - 12:00',
      title: 'Santuário Meiji Jingu & Harajuku',
      place: 'Santuário Meiji Jingu & Harajuku',
      description: 'Caminhada matinal na floresta sagrada e compras na rua Takeshita.',
      location: 'Meiji Jingu, Shibuya',
      category: 'activity',
      cost: 120,
      done: false,
      coordinates: { lat: 35.6764, lng: 139.6993 }
    },
    {
      id: 'it-5',
      day: 2,
      time: '14:00 - 17:30',
      title: 'teamLab Planets Tokyo',
      place: 'teamLab Planets Tokyo',
      description: 'Exposição de arte digital imersiva. Ingressos comprados com antecedência.',
      location: 'Toyosu, Tóquio',
      category: 'activity',
      cost: 280,
      done: false,
      coordinates: { lat: 35.6491, lng: 139.7898 }
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const MapView: React.FC<MapViewProps> = ({
  trips,
  onUpdateTrip,
  onOpenNewTripModal
}) => {
  // Active Selected Trip
  const [selectedTrip, setSelectedTrip] = useState<Trip>(() => {
    return trips.length > 0 ? trips[0] : TOKYO_TRIP_SAMPLE;
  });

  const [activeDay, setActiveDay] = useState<number>(1);
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false);
  const [newActivityTitle, setNewActivityTitle] = useState<string>('');
  const [newActivityTime, setNewActivityTime] = useState<string>('10:00');
  const [newActivityCategory, setNewActivityCategory] = useState<'activity' | 'lodging' | 'food' | 'transport'>('activity');
  const [newActivityLocation, setNewActivityLocation] = useState<string>('');
  const [newActivityDesc, setNewActivityDesc] = useState<string>('');
  const [newActivityCost, setNewActivityCost] = useState<number>(0);
  const [newActivityLat, setNewActivityLat] = useState<string>('');
  const [newActivityLng, setNewActivityLng] = useState<string>('');
  const [newActivityPaste, setNewActivityPaste] = useState<string>('');
  const [isLocatingGps, setIsLocatingGps] = useState<boolean>(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const isAppleDevice = useMemo(() => {
    return (
      typeof navigator !== 'undefined' &&
      /iPhone|iPad|iPod|Macintosh|Mac OS X/i.test(navigator.userAgent || '')
    );
  }, []);

  const handleParsePastedCoords = (input: string) => {
    setNewActivityPaste(input);
    if (!input.trim()) return;

    const directMatch = input.match(/([-+]?\d{1,2}(?:\.\d+)?)[,\s]+([-+]?\d{1,3}(?:\.\d+)?)/);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setNewActivityLat(lat.toString());
        setNewActivityLng(lng.toString());
        setGpsMessage('Coordenadas detectadas e preenchidas!');
        return;
      }
    }

    const atMatch = input.match(/@([-+]?\d{1,2}(?:\.\d+)?),([-+]?\d{1,3}(?:\.\d+)?)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setNewActivityLat(lat.toString());
        setNewActivityLng(lng.toString());
        setGpsMessage('Coordenadas extraídas do link do Google Maps!');
        return;
      }
    }

    const paramMatch = input.match(/[?&](?:q|ll|query)=([-+]?\d{1,2}(?:\.\d+)?),([-+]?\d{1,3}(?:\.\d+)?)/);
    if (paramMatch) {
      const lat = parseFloat(paramMatch[1]);
      const lng = parseFloat(paramMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        setNewActivityLat(lat.toString());
        setNewActivityLng(lng.toString());
        setGpsMessage('Coordenadas extraídas com sucesso!');
        return;
      }
    }
  };

  const handleGetCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage('Geolocalização não suportada pelo navegador.');
      return;
    }
    setIsLocatingGps(true);
    setGpsMessage('Buscando localização GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocatingGps(false);
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setNewActivityLat(lat);
        setNewActivityLng(lng);
        setGpsMessage(`GPS Obtido: ${lat}, ${lng}`);
      },
      (err) => {
        setIsLocatingGps(false);
        setGpsMessage('Erro ao obter GPS. Permita acesso à localização.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [mapZoom, setMapZoom] = useState<number>(12);
  const [activeMapLayer, setActiveMapLayer] = useState<'dark' | 'satellite' | 'streets'>('dark');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>('it-2');
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [isShareSuccess, setIsShareSuccess] = useState<boolean>(false);

  // Group itinerary items by day
  const itemsByDay = React.useMemo(() => {
    const list = selectedTrip.itinerary || [];
    const grouped: { [day: number]: ItineraryItem[] } = {};
    list.forEach((item) => {
      const d = item.day || 1;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(item);
    });
    return grouped;
  }, [selectedTrip.itinerary]);

  const daysList = Object.keys(itemsByDay).map(Number).sort((a, b) => a - b);
  const totalCostCalculated = (selectedTrip.itinerary || []).reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const totalBudgetMax = selectedTrip.budget || 25000;
  const totalActivitiesCount = (selectedTrip.itinerary || []).length;

  const handleCreateActivity = (targetDay: number) => {
    if (!newActivityTitle.trim()) return;

    const latNum = parseFloat(newActivityLat);
    const lngNum = parseFloat(newActivityLng);
    const hasValidCoords =
      !isNaN(latNum) &&
      !isNaN(lngNum) &&
      latNum >= -90 &&
      latNum <= 90 &&
      lngNum >= -180 &&
      lngNum <= 180;

    const coordinates = hasValidCoords
      ? { lat: latNum, lng: lngNum }
      : selectedTrip.coordinates || { lat: 35.6762, lng: 139.6503 };

    const newItem: ItineraryItem = {
      id: `it-${Date.now()}`,
      day: targetDay,
      time: newActivityTime || '12:00',
      title: newActivityTitle.trim(),
      place: newActivityTitle.trim(),
      description: newActivityDesc,
      location: newActivityLocation.trim() || selectedTrip.destination,
      category: newActivityCategory,
      cost: newActivityCost || 0,
      done: false,
      coordinates: coordinates
    };

    const updatedItinerary = [...(selectedTrip.itinerary || []), newItem];
    const updatedTrip = { ...selectedTrip, itinerary: updatedItinerary };
    setSelectedTrip(updatedTrip);

    if (onUpdateTrip) {
      onUpdateTrip(updatedTrip);
    }

    // Reset Form
    setNewActivityTitle('');
    setNewActivityDesc('');
    setNewActivityLocation('');
    setNewActivityCost(0);
    setNewActivityLat('');
    setNewActivityLng('');
    setNewActivityPaste('');
    setGpsMessage(null);
    setIsAddingActivity(false);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Roteiro: ${selectedTrip.title}`,
        text: `Confira meu roteiro de viagem para ${selectedTrip.destination}!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setIsShareSuccess(true);
      setTimeout(() => setIsShareSuccess(false), 3000);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-88px)] w-full overflow-hidden bg-[#121316] text-[#e3e2e5]">
      {/* Left Panel: Interactive Timeline Editor */}
      <section className="w-full lg:w-5/12 xl:w-5/12 flex flex-col border-r border-white/10 bg-[#121316] h-full relative z-10 shadow-[20px_0_30px_rgba(0,0,0,0.5)]">
        {/* Editor Header */}
        <div className="p-5 sm:p-6 border-b border-white/10 bg-[#1f2022]/80 backdrop-blur-xl shrink-0">
          <div className="flex justify-between items-start mb-3">
            <div>

              {/* Trip Selector Dropdown */}
              <div className="relative group">
                <select
                  value={selectedTrip.id}
                  onChange={(e) => {
                    const found = trips.find((t) => t.id === e.target.value);
                    if (found) setSelectedTrip(found);
                    else if (e.target.value === TOKYO_TRIP_SAMPLE.id) setSelectedTrip(TOKYO_TRIP_SAMPLE);
                  }}
                  className="bg-transparent text-xl sm:text-2xl font-black text-white focus:outline-none cursor-pointer pr-8 py-0.5 border-b border-dashed border-white/20 hover:border-white appearance-none"
                >
                  <option value={TOKYO_TRIP_SAMPLE.id} className="bg-slate-900 text-white">
                    Tóquio & Kyoto (Aventura Tecnológica)
                  </option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                      {t.title} ({t.destination})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-5 h-5 text-slate-400 absolute right-0 top-1.5 pointer-events-none" />
              </div>

              <p className="text-xs font-medium text-slate-400 mt-1">
                {selectedTrip.notes || 'Aventura tecnológica e tradição cultural'}
              </p>
            </div>

            {onOpenNewTripModal && (
              <button
                onClick={onOpenNewTripModal}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition shadow-md"
                title="Novo Roteiro"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 bg-[#292a2c] px-3 py-1.5 rounded-xl border border-white/5">
              <Calendar className="w-3.5 h-3.5 text-[#78d1fe]" />
              <span>
                {selectedTrip.startDate
                  ? `${formatDate(selectedTrip.startDate)} - ${
                      selectedTrip.endDate ? formatDate(selectedTrip.endDate) : ''
                    }`
                  : '10 Abr - 20 Abr 2025'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#292a2c] px-3 py-1.5 rounded-xl border border-white/5">
              <Users className="w-3.5 h-3.5 text-[#98da27]" />
              <span>
                {selectedTrip.participants && selectedTrip.participants.length > 0
                  ? `${selectedTrip.participants.length} ${selectedTrip.participants.length === 1 ? 'Pessoa' : 'Pessoas'}`
                  : '1 Pessoa'}
              </span>
            </div>
          </div>
        </div>

        {/* Timeline Content List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 relative scrollbar-thin">
          {/* Vertical Guide Line */}
          <div className="absolute left-[39px] sm:left-[43px] top-6 bottom-6 w-0.5 bg-white/10" />

          {(daysList.length > 0 ? daysList : [1]).map((dayNum) => {
            const dayItems = itemsByDay[dayNum] || [];

            return (
              <div key={`day-group-${dayNum}`} className="mb-8">
                {/* Day Header */}
                <h3 className="text-sm font-bold text-white mb-5 pl-12 relative flex items-center">
                  <div className="absolute left-0 w-8 h-8 rounded-full bg-[#292a2c] border-2 border-[#121316] flex items-center justify-center z-10 text-xs font-black text-[#98da27] shadow-lg">
                    D{dayNum}
                  </div>
                  <span>
                    Dia {dayNum} • {dayNum === 1 ? 'Chegada & Instalação' : dayNum === 2 ? 'Exploração Urbana' : `Dia ${dayNum} de Roteiro`}
                  </span>
                </h3>

                <div className="flex flex-col gap-4 pl-12">
                  {dayItems.map((item) => {
                    const isSelectedMarker = selectedMarkerId === item.id;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedMarkerId(item.id)}
                        className={`bg-[#1f2022]/70 rounded-3xl p-5 hover:bg-white/10 transition-all cursor-pointer group relative overflow-hidden border ${
                          isSelectedMarker
                            ? 'border-[#98da27] shadow-[0_0_20px_rgba(152,218,39,0.25)]'
                            : 'border-white/10'
                        }`}
                      >
                        {/* Glow highlight */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#98da27]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-md z-0 pointer-events-none" />

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  item.category === 'transport'
                                    ? 'bg-[#afc8f0]/20 text-[#afc8f0]'
                                    : item.category === 'lodging'
                                    ? 'bg-[#78d1fe]/20 text-[#78d1fe]'
                                    : 'bg-[#98da27]/20 text-[#98da27]'
                                }`}
                              >
                                {item.category === 'transport' ? (
                                  <Plane className="w-4 h-4" />
                                ) : item.category === 'lodging' ? (
                                  <Hotel className="w-4 h-4" />
                                ) : (
                                  <Ticket className="w-4 h-4" />
                                )}
                              </div>
                              <span
                                className={`text-[10px] font-extrabold tracking-wider uppercase ${
                                  item.category === 'transport'
                                    ? 'text-[#afc8f0]'
                                    : item.category === 'lodging'
                                    ? 'text-[#78d1fe]'
                                    : 'text-[#98da27]'
                                }`}
                              >
                                {item.category === 'transport'
                                  ? 'Voo / Transporte'
                                  : item.category === 'lodging'
                                  ? 'Hospedagem'
                                  : 'Atividade'}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-200 bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
                              {item.time || 'Horário Livre'}
                            </span>
                          </div>

                          <div className="flex gap-3 items-start mb-2">
                            {/* Mini foto do local no lado esquerdo */}
                            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm bg-transparent group/photo">
                              <img
                                src={getActivityThumbnail(item, selectedTrip.coverImage)}
                                alt={item.title || item.place || 'Atividade'}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-110"
                                loading="lazy"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src =
                                    selectedTrip.coverImage ||
                                    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=400&q=80';
                                }}
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-extrabold text-white mb-1 group-hover:text-[#98da27] transition-colors leading-snug">
                                {item.title}
                              </h4>
                              {item.description && (
                                <p className="text-xs text-slate-300 font-normal mb-1 leading-relaxed">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Coordinates & Direct GPS Navigation Route (Apenas quando há coordenada gravada) */}
                          {item.coordinates &&
                            typeof item.coordinates.lat === 'number' &&
                            typeof item.coordinates.lng === 'number' &&
                            !isNaN(item.coordinates.lat) &&
                            !isNaN(item.coordinates.lng) && (
                              <div className="flex flex-wrap items-center gap-1.5 mb-3 pt-2 border-t border-white/5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-300 border border-white/10">
                                  <Crosshair className="w-3 h-3 text-[#98da27]" />
                                  {item.coordinates.lat.toFixed(4)}, {item.coordinates.lng.toFixed(4)}
                                </span>

                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${item.coordinates.lat},${item.coordinates.lng}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#98da27]/15 hover:bg-[#98da27]/25 text-[#98da27] text-[10px] font-bold transition cursor-pointer"
                                  title="Traçar rota a partir do GPS atual no Google Maps"
                                >
                                  <Navigation className="w-3 h-3" />
                                  Rota Google Maps
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              </div>
                            )}

                          <div className="flex justify-between items-center text-xs pt-2 border-t border-white/5">
                            <span className="text-slate-400 flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-lime-400" />
                              {item.location || selectedTrip.destination}
                            </span>
                            {item.cost ? (
                              <span className="font-extrabold text-[#98da27]">
                                R$ {item.cost.toLocaleString('pt-BR')}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Incluso</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Activity to Day Button */}
                  <button
                    onClick={() => {
                      setActiveDay(dayNum);
                      setIsAddingActivity(true);
                    }}
                    className="w-full py-3.5 rounded-2xl border border-dashed border-white/20 text-slate-400 text-xs font-extrabold hover:border-[#98da27] hover:text-[#98da27] hover:bg-[#98da27]/5 transition flex items-center justify-center gap-2 group"
                  >
                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Adicionar Atividade ao Dia {dayNum}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Action */}
        <div className="p-4 border-t border-white/10 bg-[#1f2022]/90 backdrop-blur-xl shrink-0">
          <button
            onClick={() => {
              setActiveDay(daysList.length > 0 ? daysList[daysList.length - 1] + 1 : 1);
              setIsAddingActivity(true);
            }}
            className="w-full py-3.5 rounded-full bg-[#98da27] hover:bg-[#b2f746] text-[#121f00] font-black text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(152,218,39,0.35)] flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nova Atividade Geral</span>
          </button>
        </div>
      </section>

      {/* Right Panel: Interactive Dynamic Map */}
      <section className="hidden lg:flex flex-1 relative bg-[#0d0e11] overflow-hidden">
        {/* Dynamic Dark Canvas Simulation with High-Quality Map Graphic */}
        <div
          className={`absolute inset-0 transition-opacity duration-500 bg-cover bg-center ${
            activeMapLayer === 'satellite' ? 'opacity-80' : activeMapLayer === 'streets' ? 'opacity-90' : 'opacity-60'
          }`}
          style={{
            backgroundImage:
              activeMapLayer === 'satellite'
                ? `url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=2000&q=80')`
                : `url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=2000&q=80')`,
            filter: activeMapLayer === 'dark' ? 'brightness(0.55) contrast(1.2) hue-rotate(180deg)' : 'none'
          }}
        />

        {/* Dark Mode Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e11] via-transparent to-[#0d0e11]/50 pointer-events-none" />

        {/* Animated Map Route Line (SVG Path) */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
          <path
            d="M 320 220 Q 420 310, 520 260 T 680 410"
            stroke="#98da27"
            strokeWidth="3.5"
            strokeDasharray="8 6"
            fill="none"
            className="animate-pulse"
          />
        </svg>

        {/* Map Markers */}
        {(selectedTrip.itinerary || []).map((item, idx) => {
          // Dynamic marker positioning simulation
          const topPos = 25 + (idx * 16) % 55;
          const leftPos = 28 + (idx * 22) % 60;
          const isSelected = selectedMarkerId === item.id;

          return (
            <div
              key={`map-pin-${item.id}`}
              style={{ top: `${topPos}%`, left: `${leftPos}%` }}
              onClick={() => setSelectedMarkerId(item.id)}
              className="absolute z-20 flex flex-col items-center group cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            >
              {/* Marker Tooltip */}
              <div
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold mb-1.5 border shadow-2xl transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-[#98da27] text-[#121f00] border-[#98da27] opacity-100 scale-105'
                    : 'bg-[#1f2022]/90 text-white border-white/20 opacity-0 group-hover:opacity-100'
                }`}
              >
                {item.title}
              </div>

              {/* Pin Icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                  isSelected
                    ? 'bg-[#98da27] text-[#121f00] scale-125 shadow-[0_0_20px_rgba(152,218,39,0.8)]'
                    : 'bg-[#78d1fe] text-[#001e2b] shadow-[0_0_12px_rgba(120,209,254,0.5)] group-hover:scale-110'
                }`}
              >
                {item.category === 'lodging' ? (
                  <Hotel className="w-4 h-4" />
                ) : item.category === 'transport' ? (
                  <Plane className="w-4 h-4" />
                ) : (
                  <MapPin className="w-4 h-4" />
                )}
              </div>
            </div>
          );
        })}

        {/* Floating Map Controls Top-Right */}
        <div className="absolute right-6 top-6 z-30 flex flex-col gap-2.5">
          <button
            onClick={() => {
              setActiveMapLayer((prev) => (prev === 'dark' ? 'satellite' : prev === 'satellite' ? 'streets' : 'dark'));
            }}
            className="w-11 h-11 rounded-2xl bg-[#1f2022]/80 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition shadow-xl"
            title="Alternar Camadas do Mapa"
          >
            <Layers className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              // Center position reset
              if (selectedTrip.itinerary && selectedTrip.itinerary.length > 0) {
                setSelectedMarkerId(selectedTrip.itinerary[0].id);
              }
            }}
            className="w-11 h-11 rounded-2xl bg-[#1f2022]/80 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition shadow-xl"
            title="Minha Localização"
          >
            <Navigation className="w-5 h-5 text-[#98da27]" />
          </button>

          <div className="flex flex-col rounded-2xl bg-[#1f2022]/80 border border-white/20 shadow-xl overflow-hidden mt-2">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
              className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/20 transition border-b border-white/10"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 1, 3))}
              className="w-11 h-11 flex items-center justify-center text-white hover:bg-white/20 transition"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Itinerary Summary Overlay Bottom */}
        <div className="absolute bottom-6 left-6 right-6 z-30">
          <div className="bg-[#1f2022]/90 backdrop-blur-2xl rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-white/15">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Gasto Previsto
                </p>
                <p className="text-2xl font-black text-white flex items-baseline gap-1">
                  R$ {totalCostCalculated.toLocaleString('pt-BR')}{' '}
                  <span className="text-xs font-semibold text-slate-400">
                    / {totalBudgetMax.toLocaleString('pt-BR')}
                  </span>
                </p>
              </div>

              <div className="w-px h-10 bg-white/10" />

              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                  Atividades
                </p>
                <p className="text-2xl font-black text-white flex items-baseline gap-1.5">
                  {totalActivitiesCount}{' '}
                  <span className="text-xs font-semibold text-[#98da27]">agendadas</span>
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={handleShare}
                className="flex-1 md:flex-none px-5 py-3 rounded-2xl border border-[#78d1fe]/50 text-[#78d1fe] font-extrabold text-xs hover:bg-[#78d1fe]/10 transition flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>{isShareSuccess ? 'Link Copiado!' : 'Compartilhar'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Add Activity Modal */}
      {isAddingActivity && (
        <div className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4">
          <div className="bg-[#1f2022] border border-white/20 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-5 border-b border-white/10 pb-4">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#98da27]" />
                Nova Atividade - Dia {activeDay}
              </h3>
              <button
                onClick={() => setIsAddingActivity(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Título da Atividade
                </label>
                <input
                  type="text"
                  value={newActivityTitle}
                  onChange={(e) => setNewActivityTitle(e.target.value)}
                  placeholder="Ex: Visita ao Templo Senso-ji"
                  className="w-full bg-[#121316] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={newActivityTime}
                    onChange={(e) => setNewActivityTime(e.target.value)}
                    placeholder="10:00"
                    className="w-full bg-[#121316] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={newActivityCategory}
                    onChange={(e) => setNewActivityCategory(e.target.value as any)}
                    className="w-full bg-[#121316] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27]"
                  >
                    <option value="activity">Atividade</option>
                    <option value="lodging">Hospedagem</option>
                    <option value="transport">Transporte</option>
                    <option value="food">Alimentação</option>
                  </select>
                </div>
              </div>

              {/* Localização & Coordenadas GPS (Google Maps / Apple Maps) */}
              <div className="p-4 rounded-2xl bg-[#15171a] border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-[#98da27]" />
                    Coordenadas & Mapas
                  </span>
                  {isAppleDevice && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-white/80">
                      <Smartphone className="w-3 h-3" />
                      Apple iOS
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Local / Endereço
                  </label>
                  <input
                    type="text"
                    value={newActivityLocation}
                    onChange={(e) => setNewActivityLocation(e.target.value)}
                    placeholder="Ex: Asakusa, Tóquio"
                    className="w-full bg-[#121316] border border-white/10 rounded-xl p-2.5 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>Colar Link ou Coordenadas</span>
                    <span className="text-[10px] text-slate-500 font-normal">Google ou Apple Maps</span>
                  </label>
                  <input
                    type="text"
                    value={newActivityPaste}
                    onChange={(e) => handleParsePastedCoords(e.target.value)}
                    placeholder="Cole link ou ex: 35.7147, 139.7966"
                    className="w-full bg-[#121316] border border-white/10 rounded-xl p-2.5 text-xs font-mono text-white focus:outline-none focus:border-[#98da27]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={newActivityLat}
                      onChange={(e) => setNewActivityLat(e.target.value)}
                      placeholder="35.714765"
                      className="w-full bg-[#121316] border border-white/10 rounded-xl p-2 text-xs font-mono font-semibold text-white focus:outline-none focus:border-[#98da27]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={newActivityLng}
                      onChange={(e) => setNewActivityLng(e.target.value)}
                      placeholder="139.796655"
                      className="w-full bg-[#121316] border border-white/10 rounded-xl p-2 text-xs font-mono font-semibold text-white focus:outline-none focus:border-[#98da27]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleGetCurrentGps}
                    disabled={isLocatingGps}
                    className="flex-1 min-w-[130px] py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <LocateFixed className={`w-3.5 h-3.5 ${isLocatingGps ? 'animate-spin' : ''}`} />
                    {isLocatingGps ? 'Obtendo GPS...' : 'Usar GPS Atual'}
                  </button>

                  <a
                    href={
                      newActivityLat && newActivityLng
                        ? `https://www.google.com/maps/search/?api=1&query=${newActivityLat},${newActivityLng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(newActivityLocation || newActivityTitle || '')}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#98da27]/15 hover:bg-[#98da27]/25 text-[#98da27] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Google Maps
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>

                {gpsMessage && (
                  <p className="text-[11px] text-[#98da27] font-semibold">
                    {gpsMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Custo Estimado (R$)
                </label>
                <input
                  type="number"
                  value={newActivityCost}
                  onChange={(e) => setNewActivityCost(Number(e.target.value))}
                  placeholder="0"
                  className="w-full bg-[#121316] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Descrição / Anotações
                </label>
                <textarea
                  value={newActivityDesc}
                  onChange={(e) => setNewActivityDesc(e.target.value)}
                  placeholder="Anotações e detalhes do passeio..."
                  rows={2}
                  className="w-full bg-[#121316] border border-white/10 rounded-xl p-3 text-xs font-semibold text-white focus:outline-none focus:border-[#98da27] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingActivity(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-slate-300 font-bold text-xs hover:bg-white/5"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateActivity(activeDay)}
                  className="flex-1 py-3 rounded-xl bg-[#98da27] text-[#121f00] font-black text-xs hover:bg-[#b2f746] shadow-lg"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
