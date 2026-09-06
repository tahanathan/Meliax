import React, { useState, useEffect } from 'react';
import { CheckIn, Trip } from '../types';
import { MapPin, X, Camera, ExternalLink, Sparkles, Loader2, Navigation } from 'lucide-react';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckin: (checkin: CheckIn) => void;
  trips: Trip[];
  initialLat?: number;
  initialLng?: number;
  initialPlaceName?: string;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSaveCheckin,
  trips,
  initialLat,
  initialLng,
  initialPlaceName,
}) => {
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number>(-22.9068);
  const [lng, setLng] = useState<number>(-43.1729);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [selectedTripId, setSelectedTripId] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
    if (initialPlaceName) {
      setPlaceName(initialPlaceName);
    }
  }, [initialLat, initialLng, initialPlaceName]);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização indisponível.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setIsGettingLocation(false);
      },
      (err) => {
        console.error(err);
        setIsGettingLocation(false);
        alert('Permita o acesso à localização para check-in por GPS.');
      }
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;

    const gMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    const newCheckin: CheckIn = {
      id: `ck-${Date.now()}`,
      userId: 'current-user',
      tripId: selectedTripId || undefined,
      placeName,
      address: address || `${placeName} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      lat,
      lng,
      note,
      photoUrl: photoUrl || undefined,
      timestamp: new Date().toISOString(),
      googleMapsUrl: gMapsUrl,
    };

    onSaveCheckin(newCheckin);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
      <div className="bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-[24px] shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] border border-white/60 dark:border-white/10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto">
        {/* Header */}
        <div className="bg-white/40 dark:bg-slate-950/40 p-5 sm:p-6 relative border-b border-slate-200/60 dark:border-white/10 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-1 right-1 w-[45px] h-[45px] flex items-center justify-center text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent dark:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/10 dark:bg-[#384c2e]/40 border border-emerald-800/20 dark:border-[#4f683f] text-emerald-900 dark:text-[#c2d8b2] text-xs font-bold mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-700 dark:text-[#a3c38f]" />
            Check-in de Presença
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Registrar Check-in</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-medium">
            Grave suas coordenadas no Google Maps, memórias e fotos no diário histórico de viagens.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Nome do Local ou Ponto Turístico *
            </label>
            <input
              type="text"
              required
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="Ex: Tavarua Island, Torre Eiffel, Mirante do Soberbo..."
              className="w-full px-4 py-3 bg-white/70 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Endereço / Cidade
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex: Fiji Islands, Pacífico Sul"
              className="w-full px-4 py-3 bg-white/70 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
            />
          </div>

          {/* Coordinates & GPS fetch */}
          <div className="p-3 bg-white/70 dark:bg-transparent rounded-xl border border-slate-200 dark:border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Coordenadas do Google Maps</span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="text-xs font-bold text-[#007ea7] dark:text-lime-400 hover:underline flex items-center gap-1"
              >
                {isGettingLocation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                Obter via GPS
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white/80 dark:bg-transparent text-slate-900 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none"
                />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block mb-1">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white/80 dark:bg-transparent text-slate-900 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/10 font-mono text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Link to trip */}
          {trips.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Vincular a uma Viagem (Opcional)
              </label>
              <select
                value={selectedTripId}
                onChange={(e) => setSelectedTripId(e.target.value)}
                className="w-full px-4 py-3 bg-white/70 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-lime-400"
              >
                <option value="">Nenhuma viagem específica</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id} className="bg-white dark:bg-[#001f3f] text-slate-900 dark:text-white">
                    {t.title} ({t.destination})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Notas e Memórias do Check-in
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="O que achou deste local? Dicas de pratos, horários, impressões..."
              className="w-full px-4 py-3 bg-white/70 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Foto do Check-in (URL da imagem)
            </label>
            <div className="relative">
              <Camera className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full pl-11 pr-4 py-3 bg-white/70 dark:bg-transparent border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-xl bg-[#007ea7] text-white dark:bg-lime-400 dark:text-slate-950 hover:opacity-90 font-bold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-4 h-4" />
              Confirmar Check-in no Histórico
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
