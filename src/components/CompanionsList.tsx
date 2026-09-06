import React from 'react';
import { Plus } from 'lucide-react';

interface Props {
  participants?: any[];
  onAddClick?: () => void;
  maxToShow?: number;
  borderColor?: string;
}

export const CompanionsList: React.FC<Props> = ({ 
  participants = [], 
  onAddClick,
  maxToShow = 3,
  borderColor = 'border-white dark:border-slate-900'
}) => {
  const visible = participants.slice(0, maxToShow);
  const remainder = participants.length - maxToShow;

  return (
    <div className="flex -space-x-3 items-center">
      {visible.map((c, i) => (
        <div key={i} className={`w-9 h-9 rounded-full bg-slate-200 border-2 ${borderColor} overflow-hidden shadow-sm`}>
          {c.photoURL || c.icon ? (
            <img src={c.photoURL || c.icon} alt={c.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white">
              {c.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {remainder > 0 && (
        <div className={`w-9 h-9 rounded-full bg-lime-400 border-2 ${borderColor} flex items-center justify-center text-[10px] font-bold text-slate-900 shadow-sm z-10`}>
          +{remainder}
        </div>
      )}
      {onAddClick && (
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddClick(); }}
          className={`w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md border-2 ${borderColor} border-dashed flex items-center justify-center text-slate-700 dark:text-slate-300 transition shadow-sm ml-2 z-20`}
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
