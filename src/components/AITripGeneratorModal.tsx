import React, { useState } from 'react';
import { Trip, TripCategory } from '../types';
import { Sparkles, X, Compass, DollarSign, Calendar, MapPin, Loader2, Check } from 'lucide-react';
import { fetchFreeDestinationPhoto } from '../utils/photoService';

interface AITripGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrip: (trip: Trip) => void;
  currencySymbol?: string;
}

const STANDARD_COVER_PHOTOS = [
  {
    id: 'beach',
    label: 'Praia & Mar',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'mountains',
    label: 'Montanhas & Trilhas',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'city',
    label: 'Cidade & Cultura',
    url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
  },
];

export const AITripGeneratorModal: React.FC<AITripGeneratorModalProps> = ({
  isOpen,
  onClose,
  onAddTrip,
  currencySymbol = 'R$',
}) => {
  const [destination, setDestination] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(STANDARD_COVER_PHOTOS[0].url);
  const [days, setDays] = useState(4);
  const [category, setCategory] = useState<TripCategory>('Aventura');
  const [budget, setBudget] = useState(1500);
  const [style, setStyle] = useState('Equilibrado');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim()) return;

    setLoading(true);
    setError('');

    let raw = destination.trim();
    let parsedCity = raw;
    let parsedState = '';
    let parsedCountry = 'Brasil';

    const BRAZIL_STATES: Record<string, string> = {
      'pa': 'Pará', 'pará': 'Pará', 'para': 'Pará',
      'sp': 'São Paulo', 'são paulo': 'São Paulo', 'sao paulo': 'São Paulo',
      'rj': 'Rio de Janeiro', 'rio de janeiro': 'Rio de Janeiro',
      'mg': 'Minas Gerais', 'minas gerais': 'Minas Gerais',
      'ba': 'Bahia', 'bahia': 'Bahia',
      'ce': 'Ceará', 'ceará': 'Ceará', 'ceara': 'Ceará',
      'pr': 'Paraná', 'paraná': 'Paraná', 'parana': 'Paraná',
      'rs': 'Rio Grande do Sul', 'rio grande do sul': 'Rio Grande do Sul',
      'sc': 'Santa Catarina', 'santa catarina': 'Santa Catarina',
      'go': 'Goiás', 'goiás': 'Goiás', 'goias': 'Goiás',
      'pe': 'Pernambuco', 'pernambuco': 'Pernambuco',
      'am': 'Amazonas', 'amazonas': 'Amazonas',
      'es': 'Espírito Santo', 'espírito santo': 'Espírito Santo',
      'rn': 'Rio Grande do Norte', 'rio grande do norte': 'Rio Grande do Norte',
      'al': 'Alagoas', 'alagoas': 'Alagoas',
      'pi': 'Piauí', 'piauí': 'Piauí',
      'mt': 'Mato Grosso', 'mato grosso': 'Mato Grosso',
      'ms': 'Mato Grosso do Sul', 'mato grosso do sul': 'Mato Grosso do Sul',
      'df': 'Distrito Federal', 'distrito federal': 'Distrito Federal',
      'ma': 'Maranhão', 'maranhão': 'Maranhão',
      'pb': 'Paraíba', 'paraíba': 'Paraíba',
      'se': 'Sergipe', 'sergipe': 'Sergipe',
      'ro': 'Rondônia', 'rondônia': 'Rondônia',
      'to': 'Tocantins', 'tocantins': 'Tocantins',
      'ac': 'Acre', 'acre': 'Acre',
      'ap': 'Amapá', 'amapá': 'Amapá',
      'rr': 'Roraima', 'roraima': 'Roraima'
    };

    const commaParts = raw.split(/[,–-]/).map((p) => p.trim());
    if (commaParts.length >= 3) {
      parsedCity = commaParts[0];
      parsedState = commaParts[1];
      parsedCountry = commaParts.slice(2).join(', ');
    } else if (commaParts.length === 2) {
      parsedCity = commaParts[0];
      const stateCandidate = commaParts[1].toLowerCase();
      if (BRAZIL_STATES[stateCandidate]) {
        parsedState = BRAZIL_STATES[stateCandidate];
        parsedCountry = 'Brasil';
      } else {
        parsedCountry = commaParts[1];
      }
    } else {
      const doMatch = raw.match(/^(.*?)\s+(?:do|de|no|em|na)\s+([A-Za-zÀ-ÿ\s]+)$/i);
      if (doMatch) {
        const possibleState = doMatch[2].toLowerCase().trim();
        if (BRAZIL_STATES[possibleState]) {
          parsedCity = doMatch[1].trim();
          parsedState = BRAZIL_STATES[possibleState];
          parsedCountry = 'Brasil';
        }
      }
    }

    let generated: any = null;
    let photoResult: { url: string; credit?: string } | null = null;

    const fetchItineraryTask = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      try {
        const response = await fetch('/api/generate-itinerary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destination: parsedCity,
            state: parsedState,
            country: parsedCountry,
            days,
            category,
            budget,
            style,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const resData = await response.json();
          if (resData && resData.success && resData.data) {
            return resData.data;
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
        console.warn('Backend itinerary fetch timed out or failed, using smart local generation:', e);
      }
      return null;
    };

    const fetchPhotoTask = async (title: string) => {
      try {
        const photo = await fetchFreeDestinationPhoto(parsedCity, parsedState, parsedCountry, title);
        if (photo?.url) {
          return photo;
        }
      } catch (e) {
        console.warn('Auto photo search failed in AI generator:', e);
      }
      return null;
    };

    const expectedTitle = customTitle.trim() || `Tour ${category} em ${parsedCity}`;

    try {
      const [itineraryRes, photoRes] = await Promise.all([
        fetchItineraryTask(),
        fetchPhotoTask(expectedTitle),
      ]);
      generated = itineraryRes;
      photoResult = photoRes;
    } catch (e) {
      console.warn('Parallel generation task error:', e);
    }

    // Resilient local fallback if server fetch is unavailable or failed
    if (!generated) {
      const daysArr = Array.from({ length: Math.max(1, days) }, (_, i) => i + 1);
      const locFull = [parsedCity, parsedState, parsedCountry].filter(Boolean).join(', ');
      generated = {
        title: customTitle.trim() || `Tour ${category} em ${parsedCity}`,
        destination: parsedCity,
        state: parsedState,
        country: parsedCountry || 'Brasil',
        category,
        budget,
        notes: `Roteiro planejado para ${locFull}. Explore as principais atrações, gastronomia típica e pontos turísticos da região.`,
        coordinates: { lat: -22.9068, lng: -43.1729 },
        itinerary: daysArr.flatMap((d) => [
          {
            day: d,
            time: '09:30',
            place: `Passeio Principal - Dia ${d} em ${parsedCity}`,
            description: `Exploração das principais atrações e pontos turísticos autênticos em ${locFull}.`,
            location: `Centro, ${parsedCity}`,
            category: 'activity',
            done: false,
            cost: Math.round((budget / days) * 0.3),
          },
          {
            day: d,
            time: '14:00',
            place: `Atração Cultural & Paisagística - Dia ${d}`,
            description: `Visita a pontos históricos, praças ou mirantes de ${parsedCity}.`,
            location: parsedCity,
            category: 'activity',
            done: false,
            cost: Math.round((budget / days) * 0.2),
          },
          {
            day: d,
            time: '19:30',
            place: `Gastronomia Típica de ${parsedCity}`,
            description: `Jantar e experiência culinária com sabores tradicionais da região.`,
            location: `Restaurante Local, ${parsedCity}`,
            category: 'food',
            done: false,
            cost: Math.round((budget / days) * 0.4),
          },
        ]),
      };
    }

    try {
      const finalTitle = customTitle.trim() || generated.title || `Tour inesquecível em ${parsedCity}`;
      let finalCover = photoResult?.url || coverPhoto || STANDARD_COVER_PHOTOS[0].url;
      let finalCredit: string | undefined = photoResult?.credit;

      const newTrip: Trip = {
        id: `ai-trip-${Date.now()}`,
        userId: 'current-user',
        title: finalTitle,
        destination: generated.destination || parsedCity,
        state: generated.state || parsedState || undefined,
        country: generated.country || parsedCountry || 'Brasil',
        status: 'planned',
        rating: 5,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: generated.notes || `Roteiro completo de viagem gerado para ${parsedCity}.`,
        coverImage: finalCover,
        imageCredit: finalCredit,
        gallery: [
          finalCover,
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80'
        ],
        category: (generated.category as TripCategory) || category,
        budget: Number(generated.budget) || budget,
        coordinates: generated.coordinates || { lat: -22.9068, lng: -43.1729 },
        itinerary: (generated.itinerary || []).map((item: any, idx: number) => ({
          id: `item-${idx}-${Date.now()}`,
          day: item.day || 1,
          time: item.time || '10:00',
          place: item.place || 'Atração Turística',
          description: item.description || 'Passeio recomendado',
          location: item.location || parsedCity,
          category: item.category || 'activity',
          done: false,
          cost: item.cost || 0,
        })),
        checkInsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onAddTrip(newTrip);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('Ocorreu um erro ao salvar o roteiro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
      <div className="bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-[24px] shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/60 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto">
        {/* Banner Header */}
        <div className="bg-white/40 dark:bg-slate-950/40 p-5 sm:p-6 relative border-b border-slate-200/60 dark:border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-1 right-1 w-[45px] h-[45px] flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent dark:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/10 dark:bg-[#384c2e]/40 border border-emerald-800/20 dark:border-[#4f683f] text-emerald-900 dark:text-[#c2d8b2] text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-[#a3c38f]" />
            Planejador Inteligente
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Criar Roteiro de Viagem
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Informe o destino e preferências para gerar um itinerário detalhado com sugestões e localizações no mapa.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleGenerate} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-[24px]">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Destino
            </label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Ex: Tavarua Island, Roma, Kyoto, Bonito..."
                className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Título Personalizado da Viagem
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder={destination ? `Tour inesquecível em ${destination}` : 'Tour inesquecível em...'}
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-xs font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Selectable Cover Photos */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Foto de Capa do Roteiro
            </label>
            <div className="grid grid-cols-3 gap-2">
              {STANDARD_COVER_PHOTOS.map((preset) => {
                const isSelected = coverPhoto === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCoverPhoto(preset.url)}
                    className={`relative h-16 rounded-xl overflow-hidden border-2 transition text-left group ${
                      isSelected
                        ? 'border-lime-400 ring-2 ring-lime-400/30'
                        : 'border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-1 left-1.5 right-1.5 text-xs font-bold text-white truncate drop-shadow">
                      {preset.label}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-lime-400 text-slate-950 rounded-full flex items-center justify-center text-xs font-black shadow">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <input
              type="url"
              value={coverPhoto}
              onChange={(e) => setCoverPhoto(e.target.value)}
              placeholder="Ou informe a URL da foto (https://...)"
              className="w-full px-3.5 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Duração (Dias)
              </label>
              <div className="relative">
                <Calendar className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                Orçamento ({currencySymbol})
              </label>
              <div className="relative">
                <DollarSign className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  min={100}
                  step={100}
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[24px] text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase font-bold text-slate-500 dark:text-slate-400 mb-1.5">
              Estilo da Viagem
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Aventura', 'Cultural', 'Ecoturismo', 'Solo', 'Família', 'Luxo'] as TripCategory[]).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold border transition ${
                    category === cat
                      ? 'bg-lime-400 text-slate-950 border-lime-400 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !destination.trim()}
              className="w-full py-3.5 px-6 rounded-[24px] bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-xs shadow-lg shadow-lime-400/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  Gerando Roteiro...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  Gerar Roteiro Completo
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
