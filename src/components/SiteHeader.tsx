import React from 'react';
import { Search, Plus } from 'lucide-react';
import { UserProfile } from '../types';
import { MileaLogo } from './MileaLogo';
import { AuthMenu } from './AuthMenu';

interface SiteHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenTripForm: () => void;
  onOpenSearch?: () => void;
  searchQuery?: string;
  user: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  onOpenCustomization: () => void;
  className?: string;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenTripForm,
  onOpenSearch,
  searchQuery = '',
  user,
  onUserChange,
  onOpenCustomization,
  className = '',
}) => {
  return (
    <header className={`relative z-30 w-full max-w-[1680px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 pt-3 sm:pt-4 pb-2 flex items-center justify-between gap-4 shrink-0 select-none ${className}`}>
      {/* Left: Desktop Navigation Links */}
      <nav className="flex items-center gap-4 sm:gap-6 lg:gap-8 text-xs sm:text-sm font-semibold tracking-normal">
        <button
          onClick={() => onTabChange('home')}
          className={`transition relative py-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'home'
              ? 'text-[#001f3f] dark:text-white font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#001f3f] dark:after:bg-white'
              : 'text-slate-700 hover:text-[#001f3f] dark:text-slate-200 dark:hover:text-white font-medium'
          }`}
        >
          Início
        </button>
        <button
          onClick={() => onTabChange('popular')}
          className={`transition relative py-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'popular'
              ? 'text-[#001f3f] dark:text-white font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#001f3f] dark:after:bg-white'
              : 'text-slate-700 hover:text-[#001f3f] dark:text-slate-200 dark:hover:text-white font-medium'
          }`}
        >
          Destinos
        </button>
        <button
          onClick={() => onTabChange('map')}
          className={`transition relative py-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'map'
              ? 'text-[#001f3f] dark:text-white font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#001f3f] dark:after:bg-white'
              : 'text-slate-700 hover:text-[#001f3f] dark:text-slate-200 dark:hover:text-white font-medium'
          }`}
        >
          Mapa
        </button>
        <button
          onClick={() => onTabChange('bagagem')}
          className={`transition relative py-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'bagagem'
              ? 'text-[#001f3f] dark:text-white font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#001f3f] dark:after:bg-white'
              : 'text-slate-700 hover:text-[#001f3f] dark:text-slate-200 dark:hover:text-white font-medium'
          }`}
        >
          Bagagem
        </button>
        <button
          onClick={() => onTabChange('configuracoes')}
          className={`transition relative py-1 cursor-pointer whitespace-nowrap ${
            activeTab === 'configuracoes'
              ? 'text-[#001f3f] dark:text-white font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#001f3f] dark:after:bg-white'
              : 'text-slate-700 hover:text-[#001f3f] dark:text-slate-200 dark:hover:text-white font-medium'
          }`}
        >
          Configuração
        </button>
      </nav>

      {/* Center: Brand Logo */}
      <div
        onClick={() => onTabChange('home')}
        className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 cursor-pointer text-center flex items-center justify-center group pointer-events-auto"
        title="Diário de Viagens"
      >
        <MileaLogo size="header" color="adaptive" className="hover:scale-105 transition-transform duration-300 drop-shadow-md" />
      </div>

      {/* Right Section: Expanded Search Pill, Action Button, Auth */}
      <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
        {/* Expanded Search Pill Bar */}
        <div className="relative flex items-center">
          <div
            onClick={onOpenSearch}
            className="flex items-center gap-2.5 bg-white/80 hover:bg-white text-slate-800 border border-slate-300 dark:bg-black/40 dark:hover:bg-black/60 dark:text-white dark:border-white/30 backdrop-blur-xl rounded-full px-3.5 sm:px-4 py-2 text-xs sm:text-sm transition cursor-pointer shadow-md w-36 sm:w-48 md:w-60 lg:w-72"
          >
            <Search className="w-3.5 h-3.5 text-slate-600 dark:text-white/80 shrink-0" />
            <span className="truncate font-medium text-slate-700 dark:text-white/90">
              {searchQuery.trim() || 'Buscar por cidade, país...'}
            </span>
          </div>
        </div>

        {/* Primary Action Button (Novo Roteiro) */}
        <button
          onClick={onOpenTripForm}
          className="bg-[#001f3f] hover:bg-[#007ea7] text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-950 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm transition shadow-md hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden xs:inline">Novo Roteiro</span>
          <span className="xs:hidden">Criar</span>
        </button>

        {/* User Profile / Auth trigger */}
        <div className="hidden sm:block">
          <AuthMenu
            user={user}
            onUserChange={onUserChange}
            onOpenSettings={onOpenCustomization}
            isHomeTab={activeTab === 'home'}
          />
        </div>
      </div>
    </header>
  );
};
