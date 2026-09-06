import React, { useState, useMemo, useEffect } from 'react';
import { Trip } from '../types';
import { TripCard } from './TripCard';
import { AllTripsManagementView } from './AllTripsManagementView';
import {
  Search,
  Plus,
  Sparkles,
  ArrowUpDown,
  TableProperties,
  Compass,
} from 'lucide-react';

interface DestinosViewProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onToggleFavorite: (trip: Trip) => void;
  onDeleteTrip?: (tripId: string) => void;
  onAddNewTrip?: () => void;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  userTravelTypes?: string[];
}

export const DestinosView: React.FC<DestinosViewProps> = ({
  trips,
  onSelectTrip,
  onToggleFavorite,
  onDeleteTrip,
  onAddNewTrip,
  searchQuery = '',
  setSearchQuery,
  userTravelTypes,
}) => {
  // Page toggle: Main Cards View vs Deep Table Management View
  const [showAllTripsPage, setShowAllTripsPage] = useState(false);

  // Dynamic lists of years (sorted descending)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    trips.forEach((t) => {
      const date = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
      if (!isNaN(date.getTime())) {
        yearsSet.add(date.getFullYear().toString());
      }
    });
    const list = Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
    if (list.length === 0) {
      list.push(new Date().getFullYear().toString());
    }
    return list;
  }, [trips]);

  // Active year: defaults to current year if exists, otherwise first available year
  const [activeYear, setActiveYear] = useState<string>(() => {
    const currentYear = new Date().getFullYear().toString();
    return availableYears.includes(currentYear) ? currentYear : (availableYears[0] || currentYear);
  });

  // Ensure activeYear is always a valid year from availableYears
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(activeYear)) {
      setActiveYear(availableYears[0]);
    }
  }, [availableYears, activeYear]);

  // Sort State
  const [sortBy, setSortBy] = useState<'recentes' | 'preco_asc' | 'preco_desc' | 'nome'>('recentes');

  // Trips recorded for the selected year (with search and sort applied)
  const yearTrips = useMemo(() => {
    return trips
      .filter((dest) => {
        // Year filter (strict to activeYear)
        const year = (
          dest.startDate ? new Date(dest.startDate) : new Date(dest.createdAt)
        )
          .getFullYear()
          .toString();
        if (year !== activeYear) return false;

        // Text Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = dest.title?.toLowerCase().includes(q);
          const matchDest = dest.destination?.toLowerCase().includes(q);
          const matchState = dest.state?.toLowerCase().includes(q);
          const matchCountry = dest.country?.toLowerCase().includes(q);
          const matchCat = dest.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDest && !matchState && !matchCountry && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'preco_asc') return (a.budget || 0) - (b.budget || 0);
        if (sortBy === 'preco_desc') return (b.budget || 0) - (a.budget || 0);
        if (sortBy === 'nome') return (destName(a)).localeCompare(destName(b));
        // Default sort chronologically by date
        const dateA = a.startDate ? new Date(a.startDate).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.startDate ? new Date(b.startDate).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [trips, activeYear, searchQuery, sortBy]);

  function destName(trip: Trip) {
    return trip.destination || trip.title || '';
  }

  // If user requested to view deep management table page
  if (showAllTripsPage) {
    return (
      <AllTripsManagementView
        trips={trips}
        onSelectTrip={onSelectTrip}
        onDeleteTrip={onDeleteTrip}
        onToggleFavorite={onToggleFavorite}
        onAddNewTrip={onAddNewTrip}
        onBack={() => setShowAllTripsPage(false)}
        userTravelTypes={userTravelTypes}
      />
    );
  }

  return (
    <div className="pt-2 px-3 sm:px-6 max-w-[1600px] mx-auto w-full pb-28 text-left animate-in fade-in duration-300">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Meus Roteiros & Destinos
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-0.5">
            Roteiros e viagens gravadas para o ano de {activeYear}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {/* Botão Ver todas as viagens */}
          <button
            type="button"
            onClick={() => setShowAllTripsPage(true)}
            className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-white/70 hover:bg-white text-slate-800 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white border border-white/60 dark:border-white/15 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition cursor-pointer backdrop-blur-md whitespace-nowrap"
            title="Abrir página completa com tabela para gerenciar todos os roteiros"
          >
            <TableProperties className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
            <span>Ver todas as viagens</span>
          </button>

          {/* Botão Novo Roteiro */}
          {onAddNewTrip && (
            <button
              type="button"
              onClick={onAddNewTrip}
              className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:hover:bg-[#b2f042] dark:text-[#001f3f] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
              <span>Novo Roteiro</span>
            </button>
          )}
        </div>
      </div>

      {/* BOTÕES CENTRALIZADOS DE SELEÇÃO DE ANOS */}
      <div className="mb-6 w-full flex justify-center">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-2 max-w-full justify-start sm:justify-center">
          {availableYears.map((year) => {
            const isSelected = activeYear === year;
            return (
              <button
                key={year}
                type="button"
                onClick={() => setActiveYear(year)}
                className={`min-w-[62px] h-[76px] sm:min-w-[68px] sm:h-[82px] px-2.5 py-3 rounded-full transition-all duration-300 shrink-0 flex flex-col items-center justify-center cursor-pointer shadow-md backdrop-blur-md border ${
                  isSelected
                    ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] border-[#001f3f] dark:border-[#a3e635] scale-105 shadow-lg ring-2 ring-[#001f3f]/25 dark:ring-[#a3e635]/30'
                    : 'bg-white/60 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-white/90 dark:hover:bg-white/20 border-white/70 dark:border-white/15'
                }`}
                title={`Exibir roteiros de ${year}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-65 leading-tight">
                  Ano
                </span>
                <span className="text-sm sm:text-base font-extrabold tracking-tight mt-0.5 leading-tight">
                  {year}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOOLBAR: CABEÇALHO COM CONTADOR, BUSCA E ORDENAÇÃO */}
      <section className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Roteiros de {activeYear} ({yearTrips.length})
          </h2>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery && setSearchQuery('')}
              className="text-xs font-bold text-[#007ea7] dark:text-[#a3e635] hover:underline cursor-pointer ml-1"
            >
              Limpar busca
            </button>
          )}
        </div>

        {/* Inline Search & Sort */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-between sm:justify-end">
          <div className="relative flex-1 sm:flex-initial flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              placeholder="Buscar cidade ou roteiro..."
              className="w-full sm:w-56 bg-white/70 dark:bg-[#001f3f]/50 border border-white/60 dark:border-white/15 rounded-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white pl-8 pr-3 py-1.5 sm:py-2 focus:outline-none placeholder-slate-400 backdrop-blur-md shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-white/70 dark:bg-[#001f3f]/50 border border-white/60 dark:border-white/15 rounded-full px-3 py-1.5 sm:py-2 text-xs font-semibold backdrop-blur-md shadow-sm shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="recentes" className="bg-white dark:bg-slate-900">Recentes</option>
              <option value="preco_asc" className="bg-white dark:bg-slate-900">Menor Orçamento</option>
              <option value="preco_desc" className="bg-white dark:bg-slate-900">Maior Orçamento</option>
              <option value="nome" className="bg-white dark:bg-slate-900">Nome (A-Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* GRID PRINCIPAL: TODOS OS CARDS DAS VIAGENS GRAVADAS PARA O ANO SELECIONADO */}
      <section>
        {yearTrips.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] rounded-[28px] border border-white/60 dark:border-white/10 shadow-lg">
            <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
            <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              Nenhum roteiro encontrado para o ano de {activeYear}
            </h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery
                ? 'Tente remover a busca digitada para ver as outras viagens deste ano.'
                : `Você ainda não cadastrou viagens com data para ${activeYear}.`}
            </p>
            {onAddNewTrip && (
              <button
                type="button"
                onClick={onAddNewTrip}
                className="px-4 py-2 rounded-full bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] text-xs font-bold hover:scale-105 transition cursor-pointer shadow-md"
              >
                Cadastrar viagem em {activeYear}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4.5 items-stretch">
            {yearTrips.map((dest, idx) => (
              <TripCard
                key={dest.id}
                trip={dest}
                onSelectTrip={onSelectTrip}
                onToggleFavorite={onToggleFavorite}
                isFeatured={idx === 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
