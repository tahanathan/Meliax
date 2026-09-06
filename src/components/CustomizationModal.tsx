import React, { useState, useEffect } from 'react';
import { UserPreferences, AccentColor, CurrencyCode, FrequentCompanion, UserProfile } from '../types';
import {
  X,
  Sun,
  Moon,
  Palette,
  Map,
  User,
  Check,
  Bell,
  Globe,
  Search,
  MapPin,
  Loader2,
  Users,
  Plus,
  Trash2,
  UserPlus
} from 'lucide-react';

import { getStoredCompanions as getFrequentCompanions, saveStoredCompanions as saveFrequentCompanions } from '../lib/userConfig';
export { getFrequentCompanions, saveFrequentCompanions };

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  user?: UserProfile | null;
  onGoogleLogin?: () => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  user,
  onGoogleLogin
}) => {
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeMessage, setGeocodeMessage] = useState<string | null>(null);

  // Frequent Companions state
  const [companions, setCompanions] = useState<FrequentCompanion[]>([]);
  const [newCompName, setNewCompName] = useState('');
  const [newCompRelation, setNewCompRelation] = useState('Amigo');

  useEffect(() => {
    if (isOpen) {
      setCompanions(getFrequentCompanions());
    }
  }, [isOpen]);

  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompName.trim()) return;
    const item: FrequentCompanion = {
      id: `fc-${Date.now()}`,
      name: newCompName.trim(),
      relationship: newCompRelation,
    };
    const next = [...companions, item];
    setCompanions(next);
    saveFrequentCompanions(next);
    setNewCompName('');
  };

  const handleDeleteCompanion = (id: string) => {
    const next = companions.filter((c) => c.id !== id);
    setCompanions(next);
    saveFrequentCompanions(next);
  };

  if (!isOpen) return null;

  const handleGeocodeOrigin = async (cityName: string) => {
    const q = cityName.trim();
    if (!q) return;
    setIsGeocoding(true);
    setGeocodeMessage(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          const lat = parseFloat(data.results[0].lat);
          const lng = parseFloat(data.results[0].lon);
          onUpdatePreferences({
            originCity: q,
            originCoords: { lat, lng }
          });
          setGeocodeMessage(`Posição vinculada no mapa: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          return;
        }
      }
      onUpdatePreferences({ originCity: q });
      setGeocodeMessage('Cidade salva.');
    } catch {
      onUpdatePreferences({ originCity: q });
      setGeocodeMessage('Cidade salva.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const ACCENT_OPTIONS: { id: AccentColor; name: string; bg: string; ring: string }[] = [
    { id: 'lime', name: 'Verde Lima (Design Original)', bg: 'bg-lime-400', ring: 'ring-lime-400' },
    { id: 'emerald', name: 'Verde Esmeralda', bg: 'bg-emerald-500', ring: 'ring-emerald-500' },
    { id: 'cyan', name: 'Azul Oceano', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
    { id: 'coral', name: 'Rosa Coral', bg: 'bg-rose-500', ring: 'ring-rose-500' },
  ];

  const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', label: 'Dólar Americano', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'Libra Esterlina', symbol: '£' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-transparent flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
      <div className="bg-white/10 dark:bg-[#001f3f]/10 backdrop-blur-[15px] text-slate-900 dark:text-slate-100 border border-white/60 dark:border-white/10 w-full max-w-lg rounded-[24px] shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-white/10 relative bg-white/40 dark:bg-slate-950/40 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-1 right-1 w-[45px] h-[45px] flex items-center justify-center rounded-full text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-transparent dark:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/20 border border-[#007ea7]/20 dark:border-[#a3e635]/30 text-[#007ea7] dark:text-[#a3e635] text-xs font-semibold mb-2">
            <Palette className="w-3.5 h-3.5" />
            Preferências & Estilo
          </div>
          <h2 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white">Customizar Aplicativo</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 font-normal mt-1">
            Personalize o tema visual, moedas, cores e estilos para adaptar o app às suas viagens.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          {/* 1. Theme */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Modo do Tema
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onUpdatePreferences({ theme: 'light' })}
                className={`py-3 px-4 rounded-[24px] border text-sm font-medium flex items-center justify-center gap-2 transition ${
                  preferences.theme === 'light'
                    ? 'bg-[#007ea7] text-white border-[#007ea7]'
                    : 'bg-transparent dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                <Sun className="w-4 h-4" />
                Claro
              </button>
              <button
                onClick={() => onUpdatePreferences({ theme: 'dark' })}
                className={`py-3 px-4 rounded-[24px] border text-sm font-medium flex items-center justify-center gap-2 transition ${
                  preferences.theme === 'dark'
                    ? 'bg-[#a3e635] text-[#001f3f] border-[#a3e635] shadow-sm'
                    : 'bg-transparent dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                <Moon className="w-4 h-4" />
                Escuro
              </button>
            </div>
          </div>

          {/* 4.5 Cidade de Origem (Ponto de Partida) */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Cidade de Origem (Ponto de Partida)
            </label>
            <p className="text-[11px] text-slate-700 dark:text-slate-300">
              Sua cidade base (ex: São Paulo, Rio de Janeiro). Serve de parâmetro para cálculos de planejamento.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={preferences.originCity || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdatePreferences({ originCity: val });
                    setGeocodeMessage(null);
                  }}
                  onBlur={(e) => {
                    const val = e.target.value;
                    if (val && val.trim() !== '') {
                      handleGeocodeOrigin(val);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (preferences.originCity) handleGeocodeOrigin(preferences.originCity);
                    }
                  }}
                  placeholder="Sua cidade base..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/40 dark:bg-white/5 border border-slate-300 dark:border-white/20 rounded-[24px] text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-[#007ea7] dark:focus:border-[#a3e635]"
                />
              </div>

              <button
                type="button"
                disabled={isGeocoding || !preferences.originCity?.trim()}
                onClick={() => {
                  if (preferences.originCity) handleGeocodeOrigin(preferences.originCity);
                }}
                className="px-4 py-2.5 bg-[#007ea7] dark:bg-[#a3e635] hover:opacity-90 disabled:opacity-50 text-white dark:text-[#001f3f] rounded-[24px] text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-sm"
              >
                {isGeocoding ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Vincular</span>
                  </>
                )}
              </button>
            </div>

            {/* Status / Coordinate Badge */}
            {preferences.originCoords ? (
              <div className="text-[11px] text-[#007ea7] dark:text-[#a3e635] font-semibold flex items-center gap-1.5 pt-0.5">
                <Check className="w-3.5 h-3.5" />
                <span>
                  Base vinculada: ({preferences.originCoords.lat.toFixed(4)}, {preferences.originCoords.lng.toFixed(4)})
                </span>
              </div>
            ) : geocodeMessage ? (
              <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                {geocodeMessage}
              </p>
            ) : null}
          </div>

          {/* 6. Pessoas Frequentes (Companheiros de Viagem) */}
          <div className="space-y-3 p-4 bg-white/30 dark:bg-white/5 rounded-[24px] border border-slate-300 dark:border-white/10">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                Pessoas Frequentes (Companheiros)
              </label>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635]">
                {companions.length} Cadastrados
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              Cadastre familiares e amigos que costumam viajar com você para selecioná-los rapidamente ao criar roteiros.
            </p>

            {/* List of frequent companions */}
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
              {companions.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-[#001f3f]/40 border border-slate-200 dark:border-white/10 text-xs font-medium"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#007ea7]/20 dark:bg-[#a3e635]/20 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center font-bold text-xs">
                      {comp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block leading-tight">{comp.name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{comp.relationship || 'Acompanhante'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteCompanion(comp.id)}
                    className="p-1 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition"
                    title="Remover acompanhante"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Form to add companion */}
            <form onSubmit={handleAddCompanion} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCompName}
                onChange={(e) => setNewCompName(e.target.value)}
                placeholder="Nome da pessoa..."
                className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/20 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
              <select
                value={newCompRelation}
                onChange={(e) => setNewCompRelation(e.target.value)}
                className="px-2 py-1.5 bg-white dark:bg-slate-900/80 border border-slate-300 dark:border-white/20 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="Amigo">Amigo</option>
                <option value="Família">Família</option>
                <option value="Cônjuge">Cônjuge</option>
                <option value="Filho(a)">Filho(a)</option>
              </select>
              <button
                type="submit"
                disabled={!newCompName.trim()}
                className="px-3 py-1.5 bg-[#007ea7] dark:bg-[#a3e635] hover:opacity-90 disabled:opacity-50 text-white dark:text-[#001f3f] rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>
          </div>

          {/* 5. Map Style */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Estilo do Mapa Interativo
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onUpdatePreferences({ mapStyle: 'standard' })}
                className={`py-2.5 px-3 rounded-[24px] border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  preferences.mapStyle === 'standard'
                    ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] border-[#007ea7] dark:border-[#a3e635]'
                    : 'bg-transparent dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                Ruas
              </button>

              <button
                onClick={() => onUpdatePreferences({ mapStyle: 'satellite' })}
                className={`py-2.5 px-3 rounded-[24px] border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  preferences.mapStyle === 'satellite'
                    ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] border-[#007ea7] dark:border-[#a3e635]'
                    : 'bg-transparent dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Satélite
              </button>

              <button
                onClick={() => onUpdatePreferences({ mapStyle: 'dark' })}
                className={`py-2.5 px-3 rounded-[24px] border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                  preferences.mapStyle === 'dark'
                    ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] border-[#007ea7] dark:border-[#a3e635]'
                    : 'bg-transparent dark:bg-white/5 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-white/20 hover:bg-white/40 dark:hover:bg-white/10'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Noturno
              </button>
            </div>
          </div>
          
          {/* 5. Account Linkage */}
          <div className="space-y-2 pb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Conta e Sincronização
            </label>
            <div className="p-4 bg-transparent dark:bg-white/5 rounded-[24px] border border-slate-300 dark:border-white/20">
              {user && !user.isAnonymous ? (
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900 dark:text-white">Conectado como {user.displayName || 'Usuário'}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Você está usando uma conta de convidado. Para vincular fotos dos contatos e salvar os dados na sua conta, faça login com o Google.
                  </p>
                  <button
                    onClick={() => onGoogleLogin && onGoogleLogin()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-medium rounded-full transition shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.36,22 12.22,22C17,22 21.67,18.5 21.67,12.22C21.67,11.67 21.35,11.1 21.35,11.1V11.1Z" />
                    </svg>
                    Entrar com Google
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-transparent dark:bg-white/5 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0b1f14] dark:bg-[#384c2e] hover:opacity-90 text-white dark:text-[#f0f7e8] font-medium text-xs rounded-full shadow-md transition"
          >
            Concluir & Salvar
          </button>
        </div>
      </div>
    </div>
  );
};
