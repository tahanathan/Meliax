import React, { useState, useMemo } from 'react';
import { Trip } from '../types';
import { formatDate } from '../utils';
import { CountryFlag } from './CountryFlag';
import { getContinent, getBrazilRegion, getDynamicCategories } from '../lib/regions';
import { getStoredTravelTypes } from '../lib/userConfig';
import {
  ArrowLeft,
  Search,
  ArrowUpDown,
  Calendar,
  Users,
  Heart,
  Trash2,
  ChevronRight,
  Plus,
  Compass,
  MapPin,
  Sparkles,
  Plane,
  CheckCircle2,
  Clock,
  Coins,
  Globe,
  Filter,
} from 'lucide-react';

interface AllTripsManagementViewProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onDeleteTrip?: (tripId: string) => void;
  onToggleFavorite: (trip: Trip) => void;
  onAddNewTrip?: () => void;
  onBack: () => void;
  userTravelTypes?: string[];
}

export const AllTripsManagementView: React.FC<AllTripsManagementViewProps> = ({
  trips,
  onSelectTrip,
  onDeleteTrip,
  onToggleFavorite,
  onAddNewTrip,
  onBack,
  userTravelTypes,
}) => {
  // Filter States
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'planned' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recentes' | 'preco_asc' | 'preco_desc' | 'nome'>('recentes');

  // Dynamic lists of years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    trips.forEach((t) => {
      const date = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
      if (!isNaN(date.getTime())) {
        yearsSet.add(date.getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => Number(b) - Number(a));
  }, [trips]);

  // Combined Travel Types
  const allTravelTypes = useMemo(() => {
    const baseTypes = userTravelTypes && userTravelTypes.length > 0 ? userTravelTypes : getStoredTravelTypes();
    const typesSet = new Set<string>(baseTypes);
    trips.forEach((t) => {
      if (t.category && t.category.trim()) {
        typesSet.add(t.category.trim());
      }
    });
    return Array.from(typesSet);
  }, [trips, userTravelTypes]);

  // Dynamic Regions
  const dynamicRegions = useMemo(() => {
    return getDynamicCategories(trips);
  }, [trips]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = trips.length;
    const completed = trips.filter((t) => t.status === 'visited' || t.status === 'completed').length;
    const planned = trips.filter((t) => t.status === 'planned').length;
    const totalBudget = trips.reduce((acc, t) => acc + (t.budget || 0), 0);
    const countries = new Set(trips.map((t) => t.country).filter(Boolean)).size;

    return { total, completed, planned, totalBudget, countries };
  }, [trips]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips
      .filter((dest) => {
        // Year filter
        if (selectedYear) {
          const year = (
            dest.startDate ? new Date(dest.startDate) : new Date(dest.createdAt)
          )
            .getFullYear()
            .toString();
          if (year !== selectedYear) return false;
        }

        // Travel Type filter
        if (selectedType) {
          const typeLower = selectedType.toLowerCase();
          const tripCatLower = (dest.category || '').toLowerCase();
          if (!tripCatLower.includes(typeLower) && !typeLower.includes(tripCatLower)) return false;
        }

        // Region filter
        if (selectedRegion) {
          const regLower = selectedRegion.toLowerCase();
          const continent = getContinent(dest.country).toLowerCase();
          const brazilRegion = getBrazilRegion(dest.destination).toLowerCase();
          const matchRegion =
            continent === regLower ||
            brazilRegion === regLower ||
            (dest.country && dest.country.toLowerCase() === regLower) ||
            (dest.destination && dest.destination.toLowerCase().includes(regLower));
          if (!matchRegion) return false;
        }

        // Status filter
        if (selectedStatus !== 'all') {
          const isVisited = dest.status === 'visited' || dest.status === 'completed';
          if (selectedStatus === 'completed' && !isVisited) return false;
          if (selectedStatus === 'planned' && isVisited) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = dest.title.toLowerCase().includes(q);
          const matchDest = dest.destination.toLowerCase().includes(q);
          const matchCountry = dest.country.toLowerCase().includes(q);
          const matchCat = dest.category?.toLowerCase().includes(q);
          if (!matchTitle && !matchDest && !matchCountry && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'preco_asc') return (a.budget || 0) - (b.budget || 0);
        if (sortBy === 'preco_desc') return (b.budget || 0) - (a.budget || 0);
        if (sortBy === 'nome') return a.title.localeCompare(b.title);
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [trips, selectedYear, selectedType, selectedRegion, selectedStatus, searchQuery, sortBy]);

  const hasActiveFilters = selectedYear || selectedType || selectedRegion || selectedStatus !== 'all' || searchQuery;

  const clearFilters = () => {
    setSelectedYear('');
    setSelectedType('');
    setSelectedRegion('');
    setSelectedStatus('all');
    setSearchQuery('');
  };

  return (
    <div className="pt-2 px-3 sm:px-6 max-w-[1600px] mx-auto w-full pb-28 text-left animate-in fade-in duration-300">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#007ea7] dark:text-[#a3e635] hover:underline mb-2 cursor-pointer transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Voltar aos Destinos</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2.5">
            <Plane className="w-6 h-6 sm:w-7 sm:h-7 text-[#007ea7] dark:text-[#a3e635]" />
            <span>Gerenciamento de Viagens</span>
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Auditoria, busca e gerenciamento aprofundado de todos os seus roteiros gravados.
          </p>
        </div>

        {onAddNewTrip && (
          <button
            type="button"
            onClick={onAddNewTrip}
            className="px-5 py-2.5 rounded-full bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-[#a3e635] dark:hover:bg-[#b2f042] dark:text-[#001f3f] text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md hover:scale-105 active:scale-95 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Novo Roteiro</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {/* Total */}
        <div className="bg-white/40 dark:bg-[#001f3f]/30 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <Plane className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.total}
          </p>
        </div>

        {/* Concluídas */}
        <div className="bg-white/40 dark:bg-[#001f3f]/30 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.completed}
          </p>
        </div>

        {/* Planejadas */}
        <div className="bg-white/40 dark:bg-[#001f3f]/30 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Planejadas</span>
            <Clock className="w-4 h-4 text-[#007ea7] dark:text-[#a3e635]" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.planned}
          </p>
        </div>

        {/* Países */}
        <div className="bg-white/40 dark:bg-[#001f3f]/30 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Países</span>
            <Globe className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {metrics.countries}
          </p>
        </div>

        {/* Orçamento Consolidado */}
        <div className="col-span-2 sm:col-span-1 bg-white/40 dark:bg-[#001f3f]/30 backdrop-blur-md border border-white/60 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Orçamento Total</span>
            <Coins className="w-4 h-4 text-emerald-600 dark:text-[#a3e635]" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
            R$ {metrics.totalBudget.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Control & Filter Panel */}
      <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] p-4 sm:p-5 shadow-lg mb-6 space-y-4">
        {/* Top Controls: Search, Sort and Clear */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cidade, país ou título da viagem..."
              className="w-full bg-white/70 dark:bg-black/30 border border-white/70 dark:border-white/15 rounded-full text-xs sm:text-sm font-medium text-slate-900 dark:text-white pl-10 pr-4 py-2 focus:outline-none placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Status Selector */}
            <div className="flex items-center bg-white/70 dark:bg-black/30 border border-white/70 dark:border-white/15 rounded-full p-1">
              <button
                type="button"
                onClick={() => setSelectedStatus('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'all'
                    ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('planned')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'planned'
                    ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Planejadas
              </button>
              <button
                type="button"
                onClick={() => setSelectedStatus('completed')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'completed'
                    ? 'bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Concluídas
              </button>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-white/70 dark:bg-black/30 border border-white/70 dark:border-white/15 rounded-full px-3 py-1.5 text-xs font-semibold">
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

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-[#007ea7] dark:text-[#a3e635] hover:underline px-2 cursor-pointer whitespace-nowrap"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges: Ano, Tipo, Região */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/40 dark:border-white/10">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filtros rápidos:
          </span>

          {/* Anos */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => setSelectedYear('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedYear === ''
                  ? 'bg-slate-800 text-white dark:bg-[#a3e635] dark:text-[#001f3f]'
                  : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80'
              }`}
            >
              Todos os Anos
            </button>
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(selectedYear === yr ? '' : yr)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedYear === yr
                    ? 'bg-slate-800 text-white dark:bg-[#a3e635] dark:text-[#001f3f]'
                    : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Tipos */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 ml-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Estilo:
            </span>
            <button
              type="button"
              onClick={() => setSelectedType('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                selectedType === ''
                  ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#001f3f]'
                  : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80'
              }`}
            >
              Todos
            </button>
            {allTravelTypes.slice(0, 5).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(selectedType === type ? '' : type)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                  selectedType === type
                    ? 'bg-[#007ea7] text-white dark:bg-[#a3e635] dark:text-[#001f3f]'
                    : 'bg-white/50 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-white/80'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Glassmorphism Table */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-20 px-6 bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] rounded-[28px] border border-white/60 dark:border-white/10 shadow-lg">
          <Compass className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-bold text-slate-800 dark:text-white mb-1">
            Nenhuma viagem encontrada com os filtros selecionados
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
            Tente remover alguns filtros ou buscar por outro termo.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 rounded-full bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] text-xs font-bold hover:scale-105 transition cursor-pointer"
          >
            Limpar todos os filtros
          </button>
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-[#001f3f]/25 backdrop-blur-[16px] border border-white/60 dark:border-white/10 rounded-[28px] lg:rounded-[32px] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/50 dark:border-white/10 bg-white/30 dark:bg-black/20 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider select-none">
                  <th className="py-4 px-4 sm:px-6">Destino & Roteiro</th>
                  <th className="py-4 px-4 hidden md:table-cell">Tipo / Estilo</th>
                  <th className="py-4 px-4 hidden sm:table-cell">Período</th>
                  <th className="py-4 px-4 hidden lg:table-cell">Viajantes</th>
                  <th className="py-4 px-4">Orçamento</th>
                  <th className="py-4 px-4 hidden sm:table-cell">Status</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/30 dark:divide-white/5 text-xs sm:text-sm font-medium">
                {filteredTrips.map((trip) => {
                  const isFav = !!trip.isFavorite;
                  const peopleCount = trip.participants && trip.participants.length > 0 ? trip.participants.length : 1;
                  const isVisited = trip.status === 'visited' || trip.status === 'completed';

                  return (
                    <tr
                      key={trip.id}
                      onClick={() => onSelectTrip(trip)}
                      className="group hover:bg-white/60 dark:hover:bg-white/10 transition-colors duration-150 cursor-pointer"
                    >
                      {/* 1. Destino & Roteiro */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 border border-white/60 dark:border-white/10 shadow-sm relative">
                            <img
                              src={trip.coverImage}
                              alt={trip.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-[#007ea7] dark:group-hover:text-[#a3e635] transition-colors leading-snug truncate">
                              {trip.title}
                            </h4>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                              <CountryFlag country={trip.country} />
                              <span className="truncate">{trip.destination}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Tipo / Estilo */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 border border-white/60 dark:border-white/10 text-xs font-semibold text-[#007ea7] dark:text-[#a3e635] whitespace-nowrap">
                          {trip.category || 'Geral'}
                        </span>
                      </td>

                      {/* 3. Período */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <div className="flex flex-col text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
                            {trip.startDate ? formatDate(trip.startDate) : 'A definir'}
                          </span>
                          {trip.endDate && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal pl-4.5 whitespace-nowrap">
                              até {formatDate(trip.endDate)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Viajantes */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <Users className="w-3.5 h-3.5 text-[#007ea7] dark:text-[#a3e635] shrink-0" />
                          <span>{peopleCount} pessoas</span>
                        </div>
                      </td>

                      {/* 5. Orçamento */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                          R$ {(trip.budget || 0).toLocaleString('pt-BR')}
                        </span>
                      </td>

                      {/* 6. Status */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap ${
                            isVisited
                              ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/30'
                              : 'bg-[#007ea7]/15 text-[#007ea7] dark:bg-[#a3e635]/15 dark:text-[#a3e635] border border-[#007ea7]/30 dark:border-[#a3e635]/30'
                          }`}
                        >
                          {isVisited ? 'Concluída' : 'Planejada'}
                        </span>
                      </td>

                      {/* 7. Ações */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Favoritar */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(trip);
                            }}
                            className="w-9 h-9 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 border border-white/60 dark:border-white/10 flex items-center justify-center transition shadow-sm cursor-pointer"
                            title="Favoritar"
                          >
                            <Heart
                              className={`w-4 h-4 transition ${
                                isFav
                                  ? 'fill-[#007ea7] text-[#007ea7] dark:fill-[#a3e635] dark:text-[#a3e635]'
                                  : 'text-slate-700 dark:text-white'
                              }`}
                            />
                          </button>

                          {/* Excluir (opcional) */}
                          {onDeleteTrip && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`Deseja realmente excluir a viagem "${trip.title}"?`)) {
                                  onDeleteTrip(trip.id);
                                }
                              }}
                              className="w-9 h-9 rounded-full bg-red-100/70 hover:bg-red-200 text-red-600 dark:bg-red-500/20 dark:hover:bg-red-500/30 dark:text-red-400 flex items-center justify-center transition opacity-80 hover:opacity-100 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Abrir Roteiro */}
                          <div className="w-8 h-8 rounded-full bg-white/40 dark:bg-white/5 group-hover:bg-[#001f3f] group-hover:text-white dark:group-hover:bg-[#a3e635] dark:group-hover:text-[#001f3f] flex items-center justify-center transition ml-1">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
