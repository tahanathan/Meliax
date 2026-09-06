import React from 'react';
import { Trip } from '../types';
import { CountryFlag } from './CountryFlag';
import { estimateStateFromCity } from '../utils';
import { Star, Heart } from 'lucide-react';

export interface TripCardProps {
  trip: Trip;
  currencySymbol?: string;
  onSelectTrip: (trip: Trip) => void;
  onToggleFavorite?: (trip: Trip) => void;
  onOpenCheckin?: (trip: Trip) => void;
  isFeatured?: boolean;
  className?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  onSelectTrip,
  onToggleFavorite,
  isFeatured = false,
  className = '',
}) => {
  const isFav = !!trip.isFavorite;

  // Cidade e Estado do roteiro
  const cityName = trip.destination || trip.title;
  const stateName = trip.state || estimateStateFromCity(trip.destination) || trip.country;

  return (
    <article
      onClick={() => onSelectTrip(trip)}
      className={`relative rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-md hover:shadow-2xl cursor-pointer transform transition-all duration-300 hover:scale-[1.01] bg-white dark:bg-[#19293A] border border-slate-200/80 dark:border-white/10 p-2.5 sm:p-3 flex flex-col justify-between group h-[300px] sm:h-[340px] md:h-[360px] ${
        isFeatured ? 'col-span-2' : 'col-span-1'
      } ${className}`}
    >
      {/* Imagem Superior */}
      <div className="relative rounded-[20px] sm:rounded-[24px] overflow-hidden flex-1 w-full min-h-0 bg-slate-100 dark:bg-slate-900">
        <img
          src={trip.coverImage}
          alt={cityName}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Rating Pill Superior Esquerdo (Layout da Imagem) */}
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-white/95 dark:bg-[#19293A]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5 shadow-md border border-white/40 dark:border-white/10 z-10 whitespace-nowrap">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
          <span>{trip.rating ? trip.rating.toFixed(1) : '4.8'}</span>
        </div>

        {/* Badge Destaque Opcional */}
        {isFeatured && (
          <div className="absolute top-2.5 left-20 sm:top-3 sm:left-22 bg-[#001f3f] text-white dark:bg-[#a3e635] dark:text-[#001f3f] px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm z-10 whitespace-nowrap">
            Destaque
          </div>
        )}

        {/* Botão de Favorito Superior Direito (50px com Glassmorphism) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(trip);
          }}
          className="absolute top-2.5 right-2.5 w-[50px] h-[50px] rounded-full bg-white/60 dark:bg-white/20 backdrop-blur-md border border-white/50 dark:border-white/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md z-10 cursor-pointer"
          title="Favoritar Roteiro"
        >
          <Heart
            className={`w-5 h-5 transition-all ${
              isFav
                ? 'fill-[#007ea7] text-[#007ea7] dark:fill-[#a3e635] dark:text-[#a3e635]'
                : 'fill-none text-slate-700 dark:text-white'
            }`}
          />
        </button>
      </div>

      {/* Forma Cinza Abaixo da Imagem (Sem inner shadow) */}
      <div className="mt-2.5 sm:mt-3 bg-slate-100/90 dark:bg-[#2A3437] rounded-[20px] sm:rounded-[22px] px-3.5 py-3 sm:px-4 sm:py-3.5 flex flex-col justify-center border border-slate-200/60 dark:border-white/5 shrink-0">
        {/* Nome da Cidade */}
        <h3
          className={`font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-[#007ea7] dark:group-hover:text-[#a3e635] transition-colors ${
            isFeatured ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
          }`}
          title={cityName}
        >
          {cityName}
        </h3>

        {/* Bandeira do país e Estado correspondente */}
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1 min-w-0">
          <CountryFlag country={trip.country} />
          <span className="truncate">{stateName}</span>
        </div>
      </div>
    </article>
  );
};
