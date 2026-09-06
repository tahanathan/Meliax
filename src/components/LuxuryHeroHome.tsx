import React, { useState } from 'react';
import { Trip, UserProfile, UserPreferences } from '../types';
import { CountryFlag } from './CountryFlag';
import { AuthMenu } from './AuthMenu';
import { MileaLogo } from './MileaLogo';
import { SiteHeader } from './SiteHeader';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowRight,
  X,
} from 'lucide-react';

interface LuxuryHeroHomeProps {
  trips: Trip[];
  recentTrips: Trip[];
  featuredTripIndex: number;
  setFeaturedTripIndex: React.Dispatch<React.SetStateAction<number>>;
  featuredTrip: Trip | null;
  onTabChange: (tab: 'home' | 'popular' | 'map' | 'bagagem') => void;
  onSelectTripForDetail: (trip: Trip) => void;
  onOpenTripForm: () => void;
  onOpenCustomization: () => void;
  user: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  preferences: UserPreferences;
}

export const LuxuryHeroHome: React.FC<LuxuryHeroHomeProps> = ({
  trips,
  recentTrips,
  featuredTripIndex,
  setFeaturedTripIndex,
  featuredTrip,
  onTabChange,
  onSelectTripForDetail,
  onOpenTripForm,
  onOpenCustomization,
  user,
  onUserChange,
  preferences: _preferences,
}) => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  // Strictly limit the transition cards and carousel pool to the latest 7 trips registered
  const pool = recentTrips && recentTrips.length > 0 ? recentTrips : trips;
  const transitionTrips = pool.slice(0, 7);
  const totalTripsCount = Math.max(transitionTrips.length, 1);

  // Safe featured trip indexing strictly within the 7-trip pool
  const safeIndex = featuredTripIndex % totalTripsCount;
  const currentFeatured = transitionTrips[safeIndex] || featuredTrip || transitionTrips[0];

  // Prev & Next index calculations
  const prevIndex = (safeIndex - 1 + totalTripsCount) % totalTripsCount;
  const nextIndex = (safeIndex + 1) % totalTripsCount;

  // Filtered trips for inline search popup
  const searchResults = localSearch.trim()
    ? trips.filter((t) => {
        const q = localSearch.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.country.toLowerCase().includes(q)
        );
      })
    : [];

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeaturedTripIndex(prevIndex);
  };

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFeaturedTripIndex(nextIndex);
  };

  return (
    <div className="relative w-full h-screen max-h-screen flex flex-col justify-between overflow-hidden select-none font-sans transition-colors duration-500 animate-in fade-in duration-500">
      
      {/* ========================================================================= */}
      {/* FULL-SCREEN BACKGROUND IMAGE LAYERS (Strictly top 7 latest trips)          */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {transitionTrips.map((trip, idx) => {
          const isCurrent = idx === safeIndex;
          return (
            <div
              key={`hero-bg-${trip.id || idx}`}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <img
                src={trip.coverImage}
                alt={trip.title}
                className="w-full h-full object-cover object-center scale-[1.02] transform transition-transform duration-10000 ease-linear filter brightness-[1.02] contrast-[1.02] saturate-[1.08] dark:brightness-[0.82] dark:contrast-[1.08] dark:saturate-[1.12]"
              />
              
              {/* Top-to-bottom gradient overlay: clear background image visibility in light mode with header & text protection */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/10 to-white/35 dark:from-slate-950/95 dark:via-slate-950/55 dark:to-slate-950/80 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/20 to-transparent dark:from-slate-950/90 dark:via-slate-950/30 dark:to-transparent pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTENT (Fits within single screen 100vh without scrolling)  */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full flex flex-col justify-between flex-1 h-full max-h-screen overflow-hidden">
        
        {/* ========================================================================= */}
        {/* TOP NAVIGATION BAR (Unificado sem tarja)                                  */}
        {/* ========================================================================= */}
        <SiteHeader
          activeTab="home"
          onTabChange={onTabChange}
          onOpenTripForm={onOpenTripForm}
          onOpenSearch={() => setIsSearchActive(true)}
          user={user}
          onUserChange={onUserChange}
          onOpenCustomization={onOpenCustomization}
        />

        {/* Global Live Search Overlay */}
        {isSearchActive && (
          <div className="relative z-40 mb-2 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-300 dark:border-white/20 rounded-3xl p-4 shadow-2xl animate-in slide-in-from-top-2 duration-300 max-w-xl mx-auto w-full text-slate-900 dark:text-white">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-500 dark:text-white/70 shrink-0" />
              <input
                type="text"
                autoFocus
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar por cidade, país ou atração..."
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/50 focus:outline-none"
              />
              <button
                onClick={() => {
                  setIsSearchActive(false);
                  setLocalSearch('');
                }}
                className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Drawer */}
            {localSearch.trim() && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 max-h-52 overflow-y-auto space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-white/60 text-center py-2">
                    Nenhum roteiro encontrado para "{localSearch}".
                  </p>
                ) : (
                  searchResults.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => {
                        onSelectTripForDetail(trip);
                        setIsSearchActive(false);
                      }}
                      className="flex items-center gap-3 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/15 rounded-xl cursor-pointer transition border border-slate-200 dark:border-white/5"
                    >
                      <img
                        src={trip.coverImage}
                        alt={trip.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {trip.destination || trip.title}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-white/70 truncate">
                          {trip.country}
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 dark:text-white/60" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* MAIN HERO CONTENT (Estruturado com Alto Impacto Visual)                    */}
        {/* ========================================================================= */}
        <div className="relative z-20 my-auto py-2 flex flex-col justify-end flex-1 min-h-0 gap-4 sm:gap-6 max-w-[1680px] mx-auto w-full px-4 sm:px-8 lg:px-12 xl:px-16 pb-20">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center flex-1 min-h-0">
            
            {/* Esquerda: Chip do País + Título do Banco de Dados e Descrição da Viagem */}
            <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center text-left space-y-3 sm:space-y-4">
              
              {/* Chip do País Alinhado com o Título na parte inferior */}
              {currentFeatured?.country && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#001f3f] text-white dark:bg-white dark:text-slate-950 border border-transparent dark:border-white/20 backdrop-blur-xl text-xs sm:text-sm uppercase font-semibold tracking-normal shadow-md w-fit">
                  <CountryFlag country={currentFeatured.country} />
                  <span>{currentFeatured.country}</span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-[#001f3f] dark:text-white tracking-normal leading-[1.05] font-zolina drop-shadow-sm">
                {currentFeatured?.title || currentFeatured?.destination || 'Roteiro de Viagem'}
              </h1>
              
              {currentFeatured?.destination && currentFeatured?.title && currentFeatured.destination.toLowerCase() !== currentFeatured.title.toLowerCase() && (
                <p className="text-base sm:text-lg lg:text-xl font-semibold text-[#001f3f]/90 dark:text-slate-200 tracking-normal">
                  {currentFeatured.destination} {currentFeatured.state ? `• ${currentFeatured.state}` : ''}
                </p>
              )}

              <p className="text-base sm:text-lg text-[#001f3f]/85 dark:text-white/90 font-normal leading-relaxed max-w-3xl drop-shadow-sm line-clamp-4 sm:line-clamp-5">
                {currentFeatured?.notes ||
                  'Descubra um universo de oportunidades onde inovação, conforto e novas possibilidades se encontram. Transformamos ideias em soluções e memórias marcantes.'}
              </p>

              {/* Botão Explorar Roteiro e Setas de Transição Colados ao Elemento Central */}
              <div className="flex flex-wrap items-center gap-3 pt-3">
                {currentFeatured && (
                  <button
                    onClick={() => onSelectTripForDetail(currentFeatured)}
                    className="bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-semibold px-6 sm:px-7 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm tracking-normal transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5 shadow-xl cursor-pointer"
                  >
                    <span>Explorar Roteiro</span>
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 border border-slate-300 dark:bg-black/50 dark:hover:bg-black/80 dark:text-white dark:border-white/30 backdrop-blur-xl flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                    title="Roteiro Anterior"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 border border-slate-300 dark:bg-black/50 dark:hover:bg-black/80 dark:text-white dark:border-white/30 backdrop-blur-xl flex items-center justify-center transition shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                    title="Próximo Roteiro"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Direita: 2 Cards Fixos de Transição Aumentados (Sem Barra de Rolagem) */}
            <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-start lg:justify-end">
              <div className="flex flex-row items-center gap-4 sm:gap-6 overflow-hidden">
                {(() => {
                  if (totalTripsCount <= 1) {
                    return (
                      <div className="text-sm text-[#001f3f] dark:text-white/70 font-medium py-6 px-4">
                        Adicione mais roteiros para alternar entre destinos.
                      </div>
                    );
                  }

                  const firstNextIndex = (safeIndex + 1) % totalTripsCount;
                  const secondNextIndex = totalTripsCount > 2 ? (safeIndex + 2) % totalTripsCount : null;

                  const upcomingIndices = [firstNextIndex];
                  if (secondNextIndex !== null && secondNextIndex !== safeIndex && secondNextIndex !== firstNextIndex) {
                    upcomingIndices.push(secondNextIndex);
                  }

                  return upcomingIndices.map((idx) => {
                    const trip = transitionTrips[idx];
                    if (!trip) return null;

                    return (
                      <div
                        key={`next-window-card-${trip.id || idx}`}
                        onClick={() => setFeaturedTripIndex(idx)}
                        className="relative shrink-0 w-38 sm:w-50 md:w-58 lg:w-64 xl:w-72 h-56 sm:h-68 md:h-76 lg:h-84 xl:h-92 rounded-[2.25rem] sm:rounded-[3rem] overflow-hidden cursor-pointer shadow-[0_20px_45px_rgba(0,0,0,0.35)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.55)] transition-all duration-300 hover:scale-[1.04] group bg-slate-950/20"
                        title={`Próximo destino: ${trip.destination || trip.title}`}
                      >
                        <img
                          src={trip.coverImage}
                          alt={trip.destination || trip.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Bottom Vignette with Destination City (Top) and State (Bottom) ONLY */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent pt-12 pb-4 px-3 flex flex-col items-center justify-end text-center">
                          <h4 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-normal drop-shadow-md truncate max-w-full">
                            {trip.destination || trip.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-white/90 font-medium truncate max-w-full mt-0.5 tracking-normal">
                            {trip.state || trip.country || ''}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
