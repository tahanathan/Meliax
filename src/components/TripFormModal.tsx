import React, { useState, useEffect } from 'react';
import { Trip, TripCategory, TripStatus } from '../types';
import {
  X,
  MapPin,
  Calendar,
  Star,
  ArrowRight,
  Plane,
  BookOpen,
  Upload,
  Search,
  Check,
  Building2,
  Mountain,
  Palmtree,
  Utensils,
  Landmark,
  Train,
  Waves,
  Compass,
  Tent,
  FileText,
  Globe,
  Sparkles,
  Clock,
  Tag,
  CheckCircle2,
  CalendarClock,
  Users,
  Plus,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchFreeDestinationPhoto } from '../utils/photoService';
import { estimateStateFromCity, toTitleCase } from '../utils';
import { auth } from '../lib/firebase';
import { getFrequentCompanions } from './CustomizationModal';

interface TripFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveTrip: (trip: Trip) => void;
  tripToEdit?: Trip | null;
  currencySymbol?: string;
}

interface CuratedStyle {
  id: string;
  name: string;
  category: TripCategory;
  defaultDestination: string;
  defaultState: string;
  defaultCountry: string;
  defaultTitle: string;
  image: string;
  icon: React.ElementType;
  description: string;
  features: {
    icon: React.ElementType;
    label: string;
  }[];
}

const CURATED_STYLES: CuratedStyle[] = [
  {
    id: 'coastal',
    name: 'Refúgio Costeiro',
    category: 'Praia & Sol' as TripCategory,
    defaultDestination: 'Rio de Janeiro',
    defaultState: 'Rio de Janeiro',
    defaultCountry: 'Brasil',
    defaultTitle: 'Paraíso Tropical no Rio de Janeiro',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    icon: Palmtree,
    description: 'Desconecte-se sob o sol e a brisa do oceano. Ideal para quem busca praias paradisíacas, passeios náuticos e gastronomia à beira-mar.',
    features: [
      { icon: Waves, label: 'Praias paradisíacas & passeios náuticos' },
      { icon: Utensils, label: 'Gastronomia fresca e culinária costeira' },
      { icon: Compass, label: 'Roteiros de descanso, esportes aquáticos e sol' },
    ],
  },
  {
    id: 'urban',
    name: 'Explorador Urbano',
    category: 'Cultura' as TripCategory,
    defaultDestination: 'Tóquio',
    defaultState: 'Kanto',
    defaultCountry: 'Japão',
    defaultTitle: 'Aventura Urbana em Tóquio',
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
    icon: Building2,
    description: 'Mergulhe na selva de concreto. Este estilo prioriza passeios urbanos, arquitetura, museus, vida noturna vibrante e gastronomia icônica.',
    features: [
      { icon: Utensils, label: 'Foco em gastronomia e culinária local' },
      { icon: Landmark, label: 'Monumentos culturais e museus históricos' },
      { icon: Train, label: 'Planejamento ágil orientado ao transporte público' },
    ],
  },
  {
    id: 'wilderness',
    name: 'Trilha Selvagem',
    category: 'Aventura' as TripCategory,
    defaultDestination: 'Patagônia',
    defaultState: 'Magallanes',
    defaultCountry: 'Chile',
    defaultTitle: 'Expedição Selvagem na Patagônia',
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    icon: Mountain,
    description: 'Conquiste trilhas espetaculares e natureza intocada. Projetado para quem busca montanhas, caminhadas ao ar livre e paisagens de tirar o fôlego.',
    features: [
      { icon: Mountain, label: 'Mapeamento de trilhas panorâmicas e picos' },
      { icon: Tent, label: 'Acampamentos, refúgios e mirantes naturais' },
      { icon: Compass, label: 'Ecoturismo e aventuras imersivas na natureza' },
    ],
  },
];

const PRESET_COVER_PHOTOS = [
  {
    id: 'praia_rio',
    label: 'Praia & Sol',
    category: 'Praia & Sol' as TripCategory,
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'cultura_urbano',
    label: 'Cultura & Cidade',
    category: 'Cultura' as TripCategory,
    url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'montanha_aventura',
    label: 'Aventura & Montanha',
    category: 'Aventura' as TripCategory,
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'metropole_noturna',
    label: 'Metrópole Noturna',
    category: 'Cultural' as TripCategory,
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  },
];

const CATEGORIES: { label: string; value: TripCategory; icon: React.ElementType }[] = [
  { label: 'Praia & Sol', value: 'Praia & Sol' as TripCategory, icon: Palmtree },
  { label: 'Cultura', value: 'Cultura' as TripCategory, icon: Landmark },
  { label: 'Aventura', value: 'Aventura' as TripCategory, icon: Mountain },
  { label: 'Urbano', value: 'Cultural' as TripCategory, icon: Building2 },
  { label: 'Relaxamento', value: 'Ecoturismo' as TripCategory, icon: Waves },
];

export const TripFormModal: React.FC<TripFormModalProps> = ({
  isOpen,
  onClose,
  onSaveTrip,
  tripToEdit,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('coastal');
  const [customDestinationSearch, setCustomDestinationSearch] = useState('');

  // Trip Fields
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState<TripStatus>('planned');
  const [category, setCategory] = useState<TripCategory>('Praia & Sol' as TripCategory);
  const [rating, setRating] = useState<number>(4);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (newStart) {
      const startParts = newStart.split('-'); // ["YYYY", "MM", "DD"]
      if (startParts.length === 3) {
        if (!endDate) {
          // Default return date to 7 days after departure
          const d = new Date(newStart + 'T00:00:00');
          d.setDate(d.getDate() + 7);
          setEndDate(d.toISOString().split('T')[0]);
        } else {
          const endParts = endDate.split('-');
          if (endParts.length === 3) {
            // Keep the return day if valid, but automatically sync year and month to match departure
            const returnDay = endParts[2];
            setEndDate(`${startParts[0]}-${startParts[1]}-${returnDay}`);
          } else {
            setEndDate(newStart);
          }
        }
      }
    }
  };
  const [notes, setNotes] = useState('');
  const [coverImage, setCoverImage] = useState(PRESET_COVER_PHOTOS[0].url);
  const [isCustomCover, setIsCustomCover] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [participants, setParticipants] = useState<{ id: string; name: string; avatar?: string; role?: string }[]>([]);
  const [customParticipantName, setCustomParticipantName] = useState('');

  const selectedStyle =
    CURATED_STYLES.find((s) => s.id === selectedStyleId) || CURATED_STYLES[0];

  useEffect(() => {
    if (isOpen) {
      if (tripToEdit) {
        setTitle(tripToEdit.title || '');
        setDestination(tripToEdit.destination || '');
        setState(tripToEdit.state || '');
        setCountry(tripToEdit.country || '');
        setStatus(tripToEdit.status || 'planned');
        setCategory(tripToEdit.category || ('Praia & Sol' as TripCategory));
        setRating(tripToEdit.rating || 4);
        setStartDate(tripToEdit.startDate || '');
        setEndDate(tripToEdit.endDate || '');
        setNotes(tripToEdit.notes || '');
        setCoverImage(tripToEdit.coverImage || PRESET_COVER_PHOTOS[0].url);
        setParticipants(tripToEdit.participants || []);
        setStep(2); // Se estiver editando, vai direto para os detalhes
      } else {
        // Padrões do Passo 1
        setStep(1);
        setSelectedStyleId('coastal');
        setCustomDestinationSearch('');
        setTitle('');
        setDestination('Rio de Janeiro');
        setState('Rio de Janeiro');
        setCountry('Brasil');
        setStatus('planned');
        setCategory('Praia & Sol' as TripCategory);
        setRating(4);
        const today = new Date();
        const nextWeek = new Date(Date.now() + 7 * 86400000);
        setStartDate(today.toISOString().split('T')[0]);
        setEndDate(nextWeek.toISOString().split('T')[0]);
        setNotes('');
        setCoverImage(PRESET_COVER_PHOTOS[0].url);
        // Default to preset frequent companions if available
        const freq = getFrequentCompanions();
        if (freq && freq.length > 0) {
          setParticipants(freq.slice(0, 2).map((c) => ({ id: c.id, name: c.name, role: c.relationship || 'Acompanhante' })));
        } else {
          setParticipants([]);
        }
      }
    }
  }, [tripToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSelectStyle = (style: CuratedStyle) => {
    setSelectedStyleId(style.id);
    if (!customDestinationSearch.trim() && (!destination || destination === selectedStyle.defaultDestination)) {
      setDestination(style.defaultDestination);
      setState(style.defaultState);
      setCountry(style.defaultCountry);
      setTitle(style.defaultTitle);
    }
    setCategory(style.category);
    setCoverImage(style.image);
  };

  const handleSelectPresetCover = (preset: typeof PRESET_COVER_PHOTOS[0]) => {
    setCoverImage(preset.url);
    setCategory(preset.category);
    const matchedStyle = CURATED_STYLES.find((s) => s.category === preset.category);
    if (matchedStyle) {
      setSelectedStyleId(matchedStyle.id);
    }
  };

  const handleDestinationChange = (newDest: string) => {
    setDestination(newDest);
    const estimated = estimateStateFromCity(newDest);
    if (estimated) {
      setState(estimated);
      setCountry('Brasil');
    }
  };

  const handleAdvanceFromStep1 = () => {
    if (customDestinationSearch.trim()) {
      let raw = customDestinationSearch.trim();
      let parsedCity = raw;
      let parsedState = '';
      let parsedCountry = 'Brasil';

      const estimated = estimateStateFromCity(raw);
      if (estimated) {
        parsedState = estimated;
      }

      // Check for comma or hyphen separated values
      const commaParts = raw.split(/[,–-]/).map((p) => p.trim());
      if (commaParts.length >= 3) {
        parsedCity = commaParts[0];
        parsedState = commaParts[1];
        parsedCountry = commaParts.slice(2).join(', ');
      } else if (commaParts.length === 2) {
        parsedCity = commaParts[0];
        const stateCandidate = estimateStateFromCity(commaParts[1]) || commaParts[1];
        parsedState = stateCandidate;
      }

      setDestination(parsedCity);
      if (parsedState) {
        setState(parsedState);
      } else {
        const est = estimateStateFromCity(parsedCity);
        if (est) setState(est);
      }
      if (parsedCountry) setCountry(parsedCountry);

      if (!title) {
        setTitle(`Minha Aventura em ${parsedCity}`);
      }
    } else {
      if (!destination) {
        setDestination(selectedStyle.defaultDestination);
        setState(selectedStyle.defaultState);
        setCountry(selectedStyle.defaultCountry);
        setTitle(selectedStyle.defaultTitle);
      }
    }
    setStep(2);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setCoverImage(reader.result as string);
          setIsCustomCover(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdvanceToStep3 = async () => {
    let finalDest = destination.trim();
    if (!finalDest) {
      finalDest = selectedStyle.defaultDestination;
      setDestination(finalDest);
    }
    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = `Aventura em ${finalDest}`;
      setTitle(finalTitle);
    }
    setStep(3);

    // Fetch and update preview image immediately
    if (!tripToEdit && !isCustomCover && (finalDest || state.trim() || country.trim())) {
      try {
        const photo = await fetchFreeDestinationPhoto(finalDest, state.trim(), country.trim(), finalTitle);
        if (photo?.url) {
          setCoverImage(photo.url);
        }
      } catch (err) {
        console.warn('Failed to pre-fetch photo for preview', err);
      }
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return null;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? days : 1;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const handleFinalSubmit = async () => {
    setIsSaving(true);

    const rawDest = destination.trim() || selectedStyle.defaultDestination;
    const rawState = state.trim();
    const rawCountry = country.trim() || 'Brasil';
    const rawTitle = title.trim() || `Minha Aventura em ${rawDest}`;

    const finalDest = toTitleCase(rawDest);
    const finalState = toTitleCase(rawState);
    const finalCountry = toTitleCase(rawCountry);
    const finalTitle = toTitleCase(rawTitle);

    const formattedParticipants = (participants || []).map((p) => toTitleCase(p));

    // Geocodificação de Coordenadas
    let finalLat = tripToEdit?.coordinates?.lat || -22.9068;
    let finalLng = tripToEdit?.coordinates?.lng || -43.1729;

    try {
      const searchTerms = [finalDest, finalState, finalCountry].filter(Boolean).join(', ');
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerms)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          finalLat = parseFloat(data.results[0].lat);
          finalLng = parseFloat(data.results[0].lon);
        }
      }
    } catch (e) {
      console.warn('Geocoding fallback', e);
    }

    // Busca de foto automática se não houver foto personalizada
    let finalCover = coverImage;
    let finalCredit = tripToEdit?.imageCredit;

    if (!tripToEdit && !isCustomCover && (finalDest || finalState || finalCountry || customDestinationSearch)) {
      try {
        const photo = await fetchFreeDestinationPhoto(finalDest, finalState, finalCountry, finalTitle);
        if (photo?.url) {
          finalCover = photo.url;
          finalCredit = photo.credit;
        }
      } catch (err) {
        console.warn('Photo service fallback', err);
      }
    }

    let finalItinerary = tripToEdit?.itinerary || [];
    let finalBudget = tripToEdit?.budget || 0;

    if (!tripToEdit) {
      try {
        const tripDays = calculateDays() || 3;
        const aiRes = await fetch('/api/generate-activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: finalDest,
            state: finalState,
            country: finalCountry,
            days: tripDays,
            category,
          })
        });
        const aiData = await aiRes.json();
        if (aiData.itinerary && Array.isArray(aiData.itinerary)) {
          finalItinerary = aiData.itinerary;
        }
        if (aiData.budget) {
          finalBudget = aiData.budget;
        }
      } catch (err) {
        console.warn('Failed to generate activities', err);
      }
    }

    // Attach coordinates to all itinerary activities if missing
    if (finalItinerary && Array.isArray(finalItinerary)) {
      finalItinerary = finalItinerary.map((item, index) => {
        if (!item.coordinates || !item.coordinates.lat) {
          const angle = (index * 137.5) * (Math.PI / 180);
          const radius = 0.006 + (index * 0.003);
          return {
            ...item,
            coordinates: {
              lat: finalLat + Math.sin(angle) * radius,
              lng: finalLng + Math.cos(angle) * radius,
            }
          };
        }
        return item;
      });
    }

    const savedTrip: Trip = {
      id: tripToEdit?.id || `trip-${Date.now()}`,
      userId: tripToEdit?.userId || auth.currentUser?.uid || 'guest-user',
      title: finalTitle,
      destination: finalDest,
      state: finalState || undefined,
      country: finalCountry,
      status,
      category,
      rating,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      budget: finalBudget,
      notes,
      coverImage: finalCover,
      imageCredit: finalCredit,
      gallery: tripToEdit?.gallery || [finalCover],
      participants: formattedParticipants,
      coordinates: { lat: finalLat, lng: finalLng },
      itinerary: finalItinerary,
      checkInsCount: tripToEdit?.checkInsCount || 0,
      createdAt: tripToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsSaving(false);
    onSaveTrip(savedTrip);
    onClose();
  };

  const tripDays = calculateDays();

  return (
    <div className="fixed inset-0 z-[200] bg-transparent flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl my-auto">
        <div className="bg-white/10 dark:bg-[#001f3f]/10 border border-white/60 dark:border-white/10 rounded-[24px] shadow-2xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden flex flex-col lg:flex-row text-slate-900 dark:text-white backdrop-blur-[15px]">
          
          {/* ========================================================================= */}
          {/* COLUNA ESQUERDA: FORMULÁRIO DINÂMICO (PASSOS 1, 2 E 3)                   */}
          {/* ========================================================================= */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between">
            <AnimatePresence mode="wait">
              {/* --------------------------------------------------------------------- */}
              {/* ETAPA 1: ESTILO & IMAGEM DE FUNDO PADRÃO + CATEGORIA PRINCIPAL        */}
              {/* --------------------------------------------------------------------- */}
              {step === 1 && (
                <motion.div
                  key="step-1-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Cabeçalho */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold uppercase tracking-wider mb-1">
                          <Sparkles className="w-4 h-4" />
                          <span>PASSO 1 DE 3</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-1">
                          Inspiração & Estilo
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8]">
                          Selecione o estilo da viagem e a imagem de fundo padrão para o seu diário.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white transition cursor-pointer shrink-0"
                        title="Fechar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Barra de Destino Personalizado */}
                    <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 font-bold mb-2">
                        DESTINO PERSONALIZADO
                      </label>
                      <div className="relative flex items-center bg-slate-100 dark:bg-[#1a1c20] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                        <Search className="w-4 h-4 text-slate-500 dark:text-white/70 mr-2.5 shrink-0" />
                        <input
                          type="text"
                          value={customDestinationSearch}
                          onChange={(e) => setCustomDestinationSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAdvanceFromStep1();
                          }}
                          placeholder="Ex: São Luís, Maranhão"
                          className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-white/50 focus:outline-none font-medium"
                        />
                      </div>
                    </div>

                    {/* Opções de Status da Viagem: Programando vs Viagem já Executada */}
                    <div className="mb-4">
                      <label className="block text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 font-bold mb-2">
                        STATUS DA VIAGEM
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setStatus('planned')}
                          className={`p-3 rounded-[24px] border text-left transition-all flex items-start gap-3 cursor-pointer ${
                            status === 'planned'
                              ? 'bg-[#007ea7]/10 dark:bg-[#a3e635]/15 border-[#007ea7] dark:border-[#a3e635] text-slate-900 dark:text-white shadow-sm ring-1 ring-[#007ea7]/40 dark:ring-[#a3e635]/50'
                              : 'bg-slate-100 dark:bg-[#1a1c20] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-200/70 dark:hover:bg-white/5'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              status === 'planned'
                                ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00]'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80'
                            }`}
                          >
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold leading-snug flex items-center justify-between">
                              <span>Programando Viagem</span>
                              {status === 'planned' && (
                                <Check className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635] stroke-[3]" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-tight font-medium">
                              Planejando novo roteiro
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatus('visited')}
                          className={`p-3 rounded-[24px] border text-left transition-all flex items-start gap-3 cursor-pointer ${
                            status === 'visited' || status === 'completed'
                              ? 'bg-[#007ea7]/10 dark:bg-[#a3e635]/15 border-[#007ea7] dark:border-[#a3e635] text-slate-900 dark:text-white shadow-sm ring-1 ring-[#007ea7]/40 dark:ring-[#a3e635]/50'
                              : 'bg-slate-100 dark:bg-[#1a1c20] border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-200/70 dark:hover:bg-white/5'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              status === 'visited' || status === 'completed'
                                ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#121f00]'
                                : 'bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold leading-snug flex items-center justify-between">
                              <span>Viagem já Realizada</span>
                              {(status === 'visited' || status === 'completed') && (
                                <Check className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635] stroke-[3]" />
                              )}
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-tight font-medium">
                              Registrando viagem executada
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Seleção da Imagem de Fundo Padrão com base no Estilo da Viagem */}
                    <div className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 font-bold">
                          ESTILO DA VIAGEM & CAPA PADRÃO
                        </label>
                        <label className="flex items-center gap-1.5 text-xs text-[#007ea7] dark:text-[#a3e635] hover:opacity-80 font-bold cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Enviar Foto</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCustomFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {CURATED_STYLES.map((styleItem) => {
                          const isSelected = selectedStyleId === styleItem.id && coverImage === styleItem.image;
                          const StyleIcon = styleItem.icon;
                          return (
                            <div
                              key={styleItem.id}
                              onClick={() => handleSelectStyle(styleItem)}
                              className={`relative aspect-[4/3] rounded-[24px] overflow-hidden cursor-pointer group border transition-all duration-300 ${
                                isSelected
                                  ? 'border-[#007ea7] dark:border-[#a3e635] ring-2 ring-[#007ea7]/60 dark:ring-[#a3e635]/60 shadow-lg'
                                  : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/30 opacity-85 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={styleItem.image}
                                alt={styleItem.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-2.5">
                                <StyleIcon className="w-4 h-4 text-[#a3e635] mb-1" />
                                <span className="text-xs font-bold text-white leading-tight">
                                  {styleItem.name}
                                </span>
                              </div>

                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] flex items-center justify-center font-bold text-xs shadow-md">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Categoria Principal (Pílulas de Seleção) */}
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100 font-bold mb-2">
                        CATEGORIA PRINCIPAL
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat.value;
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.label}
                              type="button"
                              onClick={() => {
                                setCategory(cat.value);
                                const match = CURATED_STYLES.find((s) => s.category === cat.value);
                                if (match) setSelectedStyleId(match.id);
                              }}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#121f00] shadow-md font-bold'
                                  : 'bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/80 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                              }`}
                            >
                              <CatIcon className="w-3.5 h-3.5" />
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Controles de Rodapé */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      onClick={handleAdvanceFromStep1}
                      className="px-6 py-2.5 rounded-full bg-[#001f3f] hover:bg-[#007ea7] dark:bg-[#a3e635] dark:hover:bg-[#b2f746] text-white dark:text-[#121f00] text-sm font-bold flex items-center gap-2 transition shadow-lg hover:scale-105 cursor-pointer"
                    >
                      <span>Continuar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* ETAPA 2: PLANEJAMENTO DA JORNADA (Destino, Estado, País, Datas)       */}
              {/* --------------------------------------------------------------------- */}
              {step === 2 && (
                <motion.div
                  key="step-2-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold uppercase tracking-wider mb-1">
                          <Plane className="w-4 h-4" />
                          <span>PASSO 2 DE 3</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Planejamento da Jornada
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                          Defina as datas e a localização detalhada da sua viagem.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white transition cursor-pointer shrink-0"
                        title="Fechar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {/* Destino Principal / Cidade */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                          Destino Principal / Cidade
                        </label>
                        <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                          <MapPin className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2.5 shrink-0" />
                          <input
                            type="text"
                            required
                            value={destination}
                            onChange={(e) => handleDestinationChange(e.target.value)}
                            placeholder="Ex: São Luís"
                            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Grid: Estado e País */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                            Estado / Província
                          </label>
                          <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                            <Building2 className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2 shrink-0" />
                            <input
                              type="text"
                              value={state}
                              onChange={(e) => setState(e.target.value)}
                              placeholder="Ex: Maranhão"
                              className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                            País
                          </label>
                          <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                            <Globe className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2 shrink-0" />
                            <input
                              type="text"
                              required
                              value={country}
                              onChange={(e) => setCountry(e.target.value)}
                              placeholder="Ex: Brasil"
                              className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Grid: Datas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                            Data de Partida
                          </label>
                          <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                            <Calendar className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2 shrink-0" />
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => handleStartDateChange(e.target.value)}
                              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                            Data de Retorno
                          </label>
                          <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                            <Calendar className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2 shrink-0" />
                            <input
                              type="date"
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                              className="w-full bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-medium"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Convidados / Participantes da Viagem */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
                            Pessoas Convidadas para a Viagem
                          </label>
                          <span className="text-xs font-bold text-[#007ea7] dark:text-[#a3e635]">
                            {participants.length} Selecionados
                          </span>
                        </div>

                        {/* Quick selector from frequent companions */}
                        <div className="space-y-2.5 bg-slate-100/60 dark:bg-[#17191f]/60 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                          <div className="flex flex-wrap gap-1.5">
                            {getFrequentCompanions().map((fComp) => {
                              const isAdded = participants.some((p) => p.name.toLowerCase() === fComp.name.toLowerCase());
                              return (
                                <button
                                  key={fComp.id}
                                  type="button"
                                  onClick={() => {
                                    if (isAdded) {
                                      setParticipants(participants.filter((p) => p.name.toLowerCase() !== fComp.name.toLowerCase()));
                                    } else {
                                      setParticipants([
                                        ...participants,
                                        { id: `p-${Date.now()}-${Math.random()}`, name: fComp.name, role: fComp.relationship || 'Acompanhante' }
                                      ]);
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition ${
                                    isAdded
                                      ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] shadow-sm'
                                      : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3" />}
                                  <span>{fComp.name}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom companion input */}
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              value={customParticipantName}
                              onChange={(e) => setCustomParticipantName(e.target.value)}
                              placeholder="Adicionar nome de outro participante..."
                              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none"
                            />
                            <button
                              type="button"
                              disabled={!customParticipantName.trim()}
                              onClick={() => {
                                if (!customParticipantName.trim()) return;
                                setParticipants([
                                  ...participants,
                                  { id: `p-${Date.now()}`, name: customParticipantName.trim(), role: 'Acompanhante' }
                                ]);
                                setCustomParticipantName('');
                              }}
                              className="px-3.5 py-1.5 bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] rounded-lg text-xs font-bold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-1 shrink-0"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Incluir
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Controles de Navegação */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      onClick={handleAdvanceToStep3}
                      className="px-6 py-2.5 rounded-full bg-[#001f3f] hover:bg-[#007ea7] dark:bg-[#a3e635] dark:hover:bg-[#b2f746] text-white dark:text-[#121f00] text-sm font-bold flex items-center gap-2 transition shadow-lg hover:scale-105 cursor-pointer"
                    >
                      <span>Continuar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --------------------------------------------------------------------- */}
              {/* ETAPA 3: PERSONALIZAÇÃO DO DIÁRIO (Título, Expectativa, Notas)        */}
              {/* --------------------------------------------------------------------- */}
              {step === 3 && (
                <motion.div
                  key="step-3-form"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-5">
                      <div>
                        <div className="flex items-center gap-2 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold uppercase tracking-wider mb-1">
                          <BookOpen className="w-4 h-4" />
                          <span>PASSO 3 DE 3</span>
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                          Personalização do Diário
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-[#94a3b8] mt-1">
                          Dê um toque único com o título e suas expectativas para o roteiro.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white transition cursor-pointer shrink-0"
                        title="Fechar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      {/* Título da Viagem */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                          Título da Viagem
                        </label>
                        <div className="flex items-center bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-3 focus-within:border-[#007ea7] dark:focus-within:border-[#a3e635] transition">
                          <FileText className="w-4 h-4 text-slate-500 dark:text-white/60 mr-2.5 shrink-0" />
                          <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Minha Aventura em São Luís"
                            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none font-medium"
                          />
                        </div>
                      </div>

                      {/* Card de Expectativa da Viagem */}
                      <div className="bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-[24px] p-4">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                            <Star className="w-4 h-4 text-amber-500 dark:text-[#a3e635] fill-amber-500 dark:fill-[#a3e635]" />
                            Expectativa da Viagem
                          </span>
                          <span className="text-base font-extrabold text-[#007ea7] dark:text-[#a3e635]">
                            {rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 font-medium">
                          Defina o nível de prioridade ou animação para este roteiro.
                        </p>

                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setRating(star)}
                              className="p-1 text-amber-500 dark:text-[#a3e635] hover:scale-110 transition cursor-pointer"
                              title={`${star} estrela(s)`}
                            >
                              <Star
                                className={`w-6 h-6 ${
                                  star <= rating
                                    ? 'fill-amber-500 dark:fill-[#a3e635] text-amber-500 dark:text-[#a3e635]'
                                    : 'text-slate-300 dark:text-white/20'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Observações / Notas Iniciais */}
                      <div>
                        <label className="block text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5">
                          Observações & Ideias Iniciais (Opcional)
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={2}
                          placeholder="Anotações de lugares que quer visitar, dicas de amigos..."
                          className="w-full bg-slate-100 dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635] transition resize-none font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Controles de Navegação */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-sm font-semibold border border-slate-200 dark:border-white/10 transition cursor-pointer"
                    >
                      Voltar
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleFinalSubmit}
                      className="px-7 py-3 rounded-full bg-[#001f3f] hover:bg-[#007ea7] dark:bg-[#a3e635] dark:hover:bg-[#b2f746] text-white dark:text-[#121f00] text-sm font-extrabold flex items-center gap-2 transition shadow-xl hover:scale-105 cursor-pointer disabled:opacity-50"
                    >
                      <span>{isSaving ? (tripToEdit ? 'Salvando...' : 'Criando Roteiro...') : (tripToEdit ? 'Salvar Alterações' : 'Criar Roteiro')}</span>
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ========================================================================= */}
          {/* COLUNA DIREITA: PAINEL DE ACOMPANHAMENTO LATERAL & PRÉVIA DINÂMICA       */}
          {/* (Atualiza em tempo real em todas as etapas 1, 2 e 3)                      */}
          {/* ========================================================================= */}
          <div className="w-full lg:w-84 bg-slate-50/95 dark:bg-[#0d0e11]/90 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-white/10 p-6 sm:p-7 flex flex-col justify-between relative overflow-hidden">
            
            {/* Background Glow sutil */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#a3e635]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Badge Dinâmica de Status / Estilo */}
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/15 border border-[#007ea7]/30 dark:border-[#a3e635]/40 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold">
                  <Tag className="w-3 h-3" />
                  <span>{category}</span>
                </div>
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-white/40 font-semibold">
                  Prévia da Viagem
                </span>
              </div>

              {/* Card Miniatura de Capa */}
              <div className="relative aspect-[16/10] rounded-[24px] overflow-hidden border border-slate-200 dark:border-white/15 mb-4 shadow-lg group">
                <img
                  src={coverImage}
                  alt={selectedStyle.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3">
                  <span className="text-sm font-extrabold text-white leading-tight drop-shadow-md">
                    {title.trim() || `Minha Viagem para ${destination || selectedStyle.defaultDestination}`}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-[#a3e635] font-semibold mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>
                      {[destination || selectedStyle.defaultDestination, state || selectedStyle.defaultState, country || selectedStyle.defaultCountry]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações Resumidas da Jornada */}
              <div className="space-y-3 mb-5">
                {/* Estilo Selecionado */}
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                    {selectedStyle.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#94a3b8] leading-relaxed line-clamp-3">
                    {selectedStyle.description}
                  </p>
                </div>

                {/* Status da Viagem (Logo acima da Data do Passeio) */}
                <div className="bg-white dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                        status === 'planned'
                          ? 'bg-[#007ea7]/10 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635]'
                          : 'bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {status === 'planned' ? (
                        <CalendarClock className="w-3.5 h-3.5" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-slate-400 dark:text-white/40 block leading-none mb-0.5 font-medium">
                        Status do Roteiro
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-white/95">
                        {status === 'planned' ? 'Programando Viagem' : 'Viagem Realizada'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      status === 'planned'
                        ? 'bg-[#007ea7]/10 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635]'
                        : 'bg-emerald-500/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {status === 'planned' ? 'Planejada' : 'Executada'}
                  </span>
                </div>

                {/* Período da Viagem & Duração */}
                {(startDate || endDate) && (
                  <div className="bg-white dark:bg-[#17191f] border border-slate-200 dark:border-white/10 rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                      <div className="text-xs text-slate-800 dark:text-white/90">
                        <span className="font-semibold">{formatDateDisplay(startDate) || 'A definir'}</span>
                        <span className="text-slate-400 dark:text-white/40 mx-1">→</span>
                        <span className="font-semibold">{formatDateDisplay(endDate) || 'A definir'}</span>
                      </div>
                    </div>
                    {tripDays && (
                      <span className="px-2 py-0.5 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635] text-xs font-bold">
                        {tripDays} {tripDays === 1 ? 'dia' : 'dias'}
                      </span>
                    )}
                  </div>
                )}

                {/* Expectativa */}
                <div className="flex items-center justify-between px-1 text-xs text-slate-600 dark:text-white/70">
                  <span>Expectativa:</span>
                  <div className="flex items-center gap-1 text-[#007ea7] dark:text-[#a3e635] font-bold">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-500 dark:text-[#a3e635]" />
                    <span>{rating.toFixed(1)} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Destaques do Estilo */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-white/40 font-bold block mb-1">
                  Destaques do Roteiro
                </span>
                {selectedStyle.features.slice(0, 3).map((feat, idx) => {
                  const FeatIcon = feat.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-200/80 dark:bg-[#1c1e24] border border-slate-300 dark:border-white/10 flex items-center justify-center shrink-0 text-[#007ea7] dark:text-[#a3e635]">
                        <FeatIcon className="w-3 h-3" />
                      </div>
                      <span className="text-xs text-slate-700 dark:text-white/80 font-medium leading-tight">
                        {feat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rodapé do Painel */}
            <div className="mt-6 pt-3 border-t border-slate-200 dark:border-white/10 text-xs text-slate-500 dark:text-white/40 flex items-center justify-between">
              <span>Etapa {step} de 3</span>
              <span className="text-[#007ea7] dark:text-[#a3e635] font-semibold">
                {step === 1 ? 'Estilo' : step === 2 ? 'Localização' : (tripToEdit ? 'Salvar Edições' : 'Criar Roteiro')}
              </span>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
