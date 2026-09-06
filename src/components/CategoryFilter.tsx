import React from 'react';
import { TripCategory } from '../types';
import {
  Compass,
  Building2,
  TreePine,
  User,
  Users,
  Sparkles,
  Utensils,
  Globe2,
  Footprints,
  Waves,
  Bike,
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: TripCategory | 'Todos';
  onSelectCategory: (cat: TripCategory | 'Todos') => void;
}

const CATEGORIES: { name: TripCategory | 'Todos'; label: string; icon: any }[] = [
  { name: 'Todos', label: 'Todos os Destinos', icon: Globe2 },
  { name: 'Aventura', label: 'Hiking & Aventura', icon: Footprints },
  { name: 'Ecoturismo', label: 'Natureza & Biking', icon: Bike },
  { name: 'Cultural', label: 'Cultural & Histórico', icon: Building2 },
  { name: 'Gastronomia', label: 'Gastronomia Local', icon: Utensils },
  { name: 'Luxo', label: 'Resorts & Luxo', icon: Sparkles },
  { name: 'Solo', label: 'Viagem Solo', icon: User },
  { name: 'Família', label: 'Em Família', icon: Users },
];

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Atividades & Estilo de Viagem
        </h3>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className={`pl-[2px] pr-4 py-[2px] rounded-full text-sm font-semibold transition-all shrink-0 flex items-center gap-2.5 border ${
                isSelected
                  ? 'bg-slate-900 dark:bg-lime-400 border-slate-900 dark:border-lime-400 text-white dark:text-slate-950 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className={`p-1.5 rounded-full ${isSelected ? 'bg-slate-800 dark:bg-lime-500 text-lime-400 dark:text-slate-950' : 'bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-lime-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
