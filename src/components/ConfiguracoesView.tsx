import React, { useState, useEffect } from 'react';
import {
  UserPreferences,
  AccentColor,
  CurrencyCode,
  ThemeMode,
  FrequentCompanion,
  UserProfile,
} from '../types';
import {
  getStoredTravelTypes,
  saveStoredTravelTypes,
  getStoredCompanions,
  saveStoredCompanions,
  DEFAULT_TRAVEL_TYPES,
} from '../lib/userConfig';
import {
  User,
  Users,
  Plus,
  Trash2,
  MapPin,
  Compass,
  Sun,
  Moon,
  Palette,
  Map as MapIcon,
  Bell,
  Coins,
  Check,
  Loader2,
  Sparkles,
  ShieldCheck,
  LogOut,
  LogIn,
  Heart,
  Navigation,
  Globe,
  Tag,
  CheckCircle2,
} from 'lucide-react';

interface ConfiguracoesViewProps {
  preferences: UserPreferences;
  onUpdatePreferences: (updated: Partial<UserPreferences>) => void;
  user: UserProfile | null;
  onGoogleLogin?: () => void;
  onLogout?: () => void;
}

export const ConfiguracoesView: React.FC<ConfiguracoesViewProps> = ({
  preferences,
  onUpdatePreferences,
  user,
  onGoogleLogin,
  onLogout,
}) => {
  // Frequent companions state
  const [companions, setCompanions] = useState<FrequentCompanion[]>(() => {
    return preferences.frequentCompanions || getStoredCompanions();
  });
  const [compName, setCompName] = useState('');
  const [compRelation, setCompRelation] = useState('Amigo(a)');
  const [compEmail, setCompEmail] = useState('');

  // Travel styles / types state
  const [travelTypes, setTravelTypes] = useState<string[]>(() => {
    return preferences.travelTypes || getStoredTravelTypes();
  });
  const [newTypeName, setNewTypeName] = useState('');

  // Origin fields
  const [originCity, setOriginCity] = useState(preferences.originCity || 'São Paulo');
  const [originCountry, setOriginCountry] = useState(preferences.originCountry || 'Brasil');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeFeedback, setGeocodeFeedback] = useState<string | null>(null);

  // Profile fields
  const [displayName, setDisplayName] = useState(preferences.displayName || user?.displayName || 'Viajante');

  // Success toast feedback
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Sync initial props
  useEffect(() => {
    if (preferences.originCity) setOriginCity(preferences.originCity);
    if (preferences.originCountry) setOriginCountry(preferences.originCountry);
    if (preferences.displayName) setDisplayName(preferences.displayName);
    if (preferences.frequentCompanions) setCompanions(preferences.frequentCompanions);
    if (preferences.travelTypes) setTravelTypes(preferences.travelTypes);
  }, [preferences]);

  const triggerSaveNotification = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 3000);
  };

  // Add Companion
  const handleAddCompanion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compName.trim()) return;
    const newComp: FrequentCompanion = {
      id: `fc-${Date.now()}`,
      name: compName.trim(),
      relationship: compRelation,
      email: compEmail.trim() || undefined,
    };
    const updated = [...companions, newComp];
    setCompanions(updated);
    saveStoredCompanions(updated);
    onUpdatePreferences({ frequentCompanions: updated });
    setCompName('');
    setCompEmail('');
    triggerSaveNotification();
  };

  // Delete Companion
  const handleDeleteCompanion = (id: string) => {
    const updated = companions.filter((c) => c.id !== id);
    setCompanions(updated);
    saveStoredCompanions(updated);
    onUpdatePreferences({ frequentCompanions: updated });
    triggerSaveNotification();
  };

  // Add Custom Travel Type
  const handleAddTravelType = (e: React.FormEvent) => {
    e.preventDefault();
    const formatted = newTypeName.trim();
    if (!formatted) return;
    if (travelTypes.some((t) => t.toLowerCase() === formatted.toLowerCase())) {
      setNewTypeName('');
      return;
    }
    const updated = [...travelTypes, formatted];
    setTravelTypes(updated);
    saveStoredTravelTypes(updated);
    onUpdatePreferences({ travelTypes: updated });
    setNewTypeName('');
    triggerSaveNotification();
  };

  // Toggle Travel Type Active / Inactive
  const handleToggleTravelType = (type: string) => {
    let updated: string[];
    if (travelTypes.includes(type)) {
      if (travelTypes.length <= 1) return; // Keep at least one
      updated = travelTypes.filter((t) => t !== type);
    } else {
      updated = [...travelTypes, type];
    }
    setTravelTypes(updated);
    saveStoredTravelTypes(updated);
    onUpdatePreferences({ travelTypes: updated });
    triggerSaveNotification();
  };

  // Remove travel type permanently if custom
  const handleRemoveTravelType = (typeToRemove: string) => {
    const updated = travelTypes.filter((t) => t !== typeToRemove);
    setTravelTypes(updated);
    saveStoredTravelTypes(updated);
    onUpdatePreferences({ travelTypes: updated });
    triggerSaveNotification();
  };

  // Geocode Origin
  const handleSaveOrigin = async () => {
    const city = originCity.trim();
    const country = originCountry.trim();
    if (!city) return;
    setIsGeocoding(true);
    setGeocodeFeedback(null);
    try {
      const query = country ? `${city}, ${country}` : city;
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.results && Array.isArray(data.results) && data.results.length > 0) {
          const lat = parseFloat(data.results[0].lat);
          const lng = parseFloat(data.results[0].lon);
          onUpdatePreferences({
            originCity: city,
            originCountry: country,
            originCoords: { lat, lng },
          });
          setGeocodeFeedback(`Origem fixada: ${city} (${lat.toFixed(3)}, ${lng.toFixed(3)})`);
          triggerSaveNotification();
          return;
        }
      }
      onUpdatePreferences({ originCity: city, originCountry: country });
      setGeocodeFeedback('Origem salva.');
      triggerSaveNotification();
    } catch {
      onUpdatePreferences({ originCity: city, originCountry: country });
      setGeocodeFeedback('Origem salva com sucesso.');
      triggerSaveNotification();
    } finally {
      setIsGeocoding(false);
    }
  };

  const ACCENT_OPTIONS: { id: AccentColor; name: string; bg: string; border: string }[] = [
    { id: 'lime', name: 'Verde Lima', bg: 'bg-[#a3e635]', border: 'border-[#a3e635]' },
    { id: 'emerald', name: 'Verde Esmeralda', bg: 'bg-emerald-500', border: 'border-emerald-500' },
    { id: 'cyan', name: 'Azul Oceano', bg: 'bg-[#007ea7]', border: 'border-[#007ea7]' },
    { id: 'coral', name: 'Rosa Coral', bg: 'bg-rose-500', border: 'border-rose-500' },
  ];

  const CURRENCY_OPTIONS: { code: CurrencyCode; label: string; symbol: string }[] = [
    { code: 'BRL', label: 'Real Brasileiro', symbol: 'R$' },
    { code: 'USD', label: 'Dólar Americano', symbol: '$' },
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'GBP', label: 'Libra Esterlina', symbol: '£' },
  ];

  return (
    <div className="pt-2 px-3 sm:px-6 max-w-[1400px] mx-auto w-full pb-28 text-left animate-in fade-in duration-300">
      
      {/* Toast Notification */}
      {showSavedToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] px-5 py-3 rounded-full backdrop-blur-md shadow-2xl flex items-center gap-2.5 text-xs font-bold border border-white/20 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-lime-400 dark:text-[#001f3f]" />
          <span>Configurações atualizadas com sucesso!</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#001f3f]/10 dark:bg-white/10 backdrop-blur-md text-[#001f3f] dark:text-white text-xs font-semibold mb-2">
            <User className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
            <span>Perfil & Preferências Globais</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Configurações do Viajante
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
            Defina seus passageiros frequentes, tipos de roteiro habituais, origem geográfica e a estética do sistema.
          </p>
        </div>

        <button
          onClick={() => {
            handleSaveOrigin();
            onUpdatePreferences({
              displayName,
              travelTypes,
              frequentCompanions: companions,
            });
            triggerSaveNotification();
          }}
          className="px-6 py-3 rounded-full bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:hover:bg-[#b2f042] dark:text-[#001f3f] text-xs sm:text-sm font-semibold transition-all shadow-md hover:scale-105 active:scale-95 flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Grid of Configuration Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Companions & Travel Types (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6 sm:gap-8">
          
          {/* 1. PASSAGEIROS FREQUENTES */}
          <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] p-5 sm:p-7 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#001f3f] dark:text-white leading-snug">
                    Passageiros Frequentes
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Pessoas que costumam viajar com você para preenchimento rápido em novos roteiros.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 text-xs font-bold text-slate-800 dark:text-white">
                {companions.length} {companions.length === 1 ? 'passageiro' : 'passageiros'}
              </span>
            </div>

            {/* List of Companions */}
            <div className="space-y-2.5 mb-5 max-h-60 overflow-y-auto pr-1">
              {companions.length === 0 ? (
                <div className="text-center py-6 px-4 bg-white/30 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-xs text-slate-500 dark:text-slate-400">
                  Nenhum passageiro frequente cadastrado. Adicione um abaixo.
                </div>
              ) : (
                companions.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between p-3 sm:p-3.5 bg-white/60 dark:bg-white/10 rounded-2xl border border-white/60 dark:border-white/10 transition hover:bg-white/80 dark:hover:bg-white/15"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {comp.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {comp.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#007ea7]/10 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635]">
                            {comp.relationship || 'Acompanhante'}
                          </span>
                          {comp.email && (
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {comp.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteCompanion(comp.id)}
                      className="w-8 h-8 rounded-full bg-red-100/80 hover:bg-red-200 text-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 flex items-center justify-center transition cursor-pointer"
                      title="Excluir passageiro"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Form to Add Companion */}
            <form onSubmit={handleAddCompanion} className="p-3.5 sm:p-4 bg-white/40 dark:bg-black/20 rounded-2xl border border-white/60 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block">
                Cadastrar Novo Passageiro
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  type="text"
                  placeholder="Nome completo..."
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  className="sm:col-span-6 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  required
                />
                <select
                  value={compRelation}
                  onChange={(e) => setCompRelation(e.target.value)}
                  className="sm:col-span-4 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="Cônjuge">Cônjuge / Parceiro(a)</option>
                  <option value="Família">Família</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Amigo(a)">Amigo(a)</option>
                  <option value="Colega">Colega de Trabalho</option>
                  <option value="Outro">Outro</option>
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:hover:bg-[#b2f042] dark:text-[#001f3f] rounded-xl text-xs font-bold py-2 px-3 flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar</span>
                </button>
              </div>
            </form>
          </div>

          {/* 2. TIPOS DE VIAGEM HABITUAIS */}
          <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] p-5 sm:p-7 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-[#001f3f] dark:text-white leading-snug">
                    Tipos de Viagem Habituais
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Estilos que você costuma praticar. Esses chips serão exibidos nos filtros de destinos e sugestões.
                  </p>
                </div>
              </div>
            </div>

            {/* Travel Types Chips */}
            <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-5">
              {DEFAULT_TRAVEL_TYPES.map((type) => {
                const isSelected = travelTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleToggleTravelType(type)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      isSelected
                        ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] scale-[1.02]'
                        : 'bg-white/50 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/20 border border-white/60 dark:border-white/10'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{type}</span>
                  </button>
                );
              })}

              {/* Custom Types created by user */}
              {travelTypes
                .filter((t) => !DEFAULT_TRAVEL_TYPES.includes(t))
                .map((customType) => (
                  <div
                    key={customType}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#001f3f] text-xs font-bold shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{customType}</span>
                    <button
                      onClick={() => handleRemoveTravelType(customType)}
                      className="w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-[10px] ml-1 cursor-pointer"
                      title="Excluir tipo"
                    >
                      ×
                    </button>
                  </div>
                ))}
            </div>

            {/* Form to add custom travel type */}
            <form onSubmit={handleAddTravelType} className="flex gap-2">
              <input
                type="text"
                placeholder="Criar novo tipo (ex: Gastronomia Rural, Neve & Esqui)..."
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1 bg-white/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-full px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:hover:bg-[#b2f042] dark:text-[#001f3f] text-xs font-semibold transition shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Tipo</span>
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Origin, Theme, Visuals & System (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sm:gap-8">
          
          {/* 3. ORIGEM DO VIAJANTE */}
          <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#001f3f] dark:text-white leading-snug">
                  Cidade e País de Origem
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Utilizada para centralizar o mapa e calcular distâncias reais em km.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={originCity}
                    onChange={(e) => setOriginCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="w-full bg-white/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    value={originCountry}
                    onChange={(e) => setOriginCountry(e.target.value)}
                    placeholder="Ex: Brasil"
                    className="w-full bg-white/70 dark:bg-slate-900/80 border border-slate-300 dark:border-white/15 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {preferences.originCoords && (
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-white/30 dark:bg-white/5 rounded-xl p-2.5 flex items-center justify-between border border-white/40 dark:border-white/5">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635]" />
                    Coordenadas: {preferences.originCoords.lat.toFixed(4)}, {preferences.originCoords.lng.toFixed(4)}
                  </span>
                </div>
              )}

              {geocodeFeedback && (
                <p className="text-xs text-emerald-600 dark:text-lime-400 font-semibold">
                  {geocodeFeedback}
                </p>
              )}

              <button
                onClick={handleSaveOrigin}
                disabled={isGeocoding}
                className="w-full py-2.5 rounded-xl bg-white/60 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20 text-[#001f3f] dark:text-white border border-white/60 dark:border-white/10 font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isGeocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#007ea7]" />
                ) : (
                  <Globe className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
                )}
                <span>{isGeocoding ? 'Localizando coordenadas...' : 'Atualizar Ponto de Origem'}</span>
              </button>
            </div>
          </div>

          {/* 4. ESTILO DO SITE & TEMA */}
          <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center shrink-0">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#001f3f] dark:text-white leading-snug">
                  Estilo do Site & Tema
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Alterne entre modo claro e escuro e defina as cores de realce.
                </p>
              </div>
            </div>

            {/* Light / Dark Mode Toggle Cards with Glassmorphism */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => onUpdatePreferences({ theme: 'light' })}
                className={`p-4 rounded-2xl backdrop-blur-[15px] border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  preferences.theme === 'light'
                    ? 'bg-white/75 dark:bg-white/20 border-[#001f3f] dark:border-white shadow-md ring-2 ring-[#001f3f]/30'
                    : 'bg-white/30 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10'
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500 drop-shadow" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => onUpdatePreferences({ theme: 'dark' })}
                className={`p-4 rounded-2xl backdrop-blur-[15px] border transition-all flex flex-col items-center justify-center gap-2 cursor-pointer shadow-sm ${
                  preferences.theme === 'dark'
                    ? 'bg-[#001f3f]/80 dark:bg-[#001f3f]/90 border-[#a3e635] shadow-md ring-2 ring-[#a3e635]/40 text-white'
                    : 'bg-white/30 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10'
                }`}
              >
                <Moon className="w-6 h-6 text-sky-400 drop-shadow" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Escuro</span>
              </button>
            </div>

            {/* Accent Color Selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Paleta de Destaque
              </span>
              <div className="grid grid-cols-2 gap-2">
                {ACCENT_OPTIONS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => onUpdatePreferences({ accentColor: acc.id })}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      preferences.accentColor === acc.id
                        ? 'bg-white/80 dark:bg-white/20 border-slate-900 dark:border-white shadow-sm'
                        : 'bg-white/30 dark:bg-white/5 border-white/40 dark:border-white/10'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${acc.bg}`} />
                    <span className="truncate text-slate-900 dark:text-white">{acc.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 5. PARÂMETROS OPERACIONAIS & MOEDA */}
          <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] p-5 sm:p-6 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/40 dark:border-white/10">
              <div className="w-10 h-10 rounded-2xl bg-[#007ea7]/15 dark:bg-[#a3e635]/15 text-[#007ea7] dark:text-[#a3e635] flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-[#001f3f] dark:text-white leading-snug">
                  Moeda & Notificações
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Símbolos monetários e alertas do sistema.
                </p>
              </div>
            </div>

            {/* Currency Select */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Moeda Principal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CURRENCY_OPTIONS.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => onUpdatePreferences({ currency: c.code })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                        preferences.currency === c.code
                          ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] border-transparent shadow-sm'
                          : 'bg-white/40 dark:bg-white/5 text-slate-800 dark:text-white border-white/60 dark:border-white/10'
                      }`}
                    >
                      <span>{c.label}</span>
                      <span className="font-bold">{c.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Style */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Estilo Padrão do Mapa
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', name: 'Claro' },
                    { id: 'dark', name: 'Dark' },
                    { id: 'satellite', name: 'Satélite' },
                  ].map((ms) => (
                    <button
                      key={ms.id}
                      onClick={() => onUpdatePreferences({ mapStyle: ms.id as any })}
                      className={`py-2 px-1 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                        preferences.mapStyle === ms.id
                          ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] border-transparent shadow-sm'
                          : 'bg-white/40 dark:bg-white/5 text-slate-800 dark:text-white border-white/60 dark:border-white/10'
                      }`}
                    >
                      {ms.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
