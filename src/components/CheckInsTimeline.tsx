import { formatDate } from '../utils';
import React from 'react';
import { CheckIn } from '../types';
import { MapPin, Calendar, ExternalLink, Camera, Trash2, Globe2 } from 'lucide-react';

interface CheckInsTimelineProps {
  checkins: CheckIn[];
  onDeleteCheckin: (checkinId: string) => void;
  onOpenCheckinModal: () => void;
}

export const CheckInsTimeline: React.FC<CheckInsTimelineProps> = ({
  checkins,
  onDeleteCheckin,
  onOpenCheckinModal,
}) => {
  return (
    <div className="bg-white/65 dark:bg-[#001f3f]/45 backdrop-blur-[15px] rounded-2xl p-6 border border-white/60 dark:border-white/10 shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-400/20 border border-lime-400/30 text-lime-700 dark:text-lime-400 text-xs font-bold mb-1">
            <MapPin className="w-3.5 h-3.5" />
            Registro de Presença no Google Maps
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Linha do Tempo de Check-ins</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Acompanhe a cronologia detalhada de cada lugar, restaurante e atração por onde você passou.
          </p>
        </div>

        <button
          onClick={onOpenCheckinModal}
          className="px-5 py-2.5 bg-lime-400 text-slate-950 font-black text-xs rounded-2xl hover:bg-lime-300 transition shadow-lg shadow-lime-400/20 flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <Camera className="w-4 h-4" />
          Novo Check-in
        </button>
      </div>

      {/* Checkins Timeline list */}
      {checkins.length === 0 ? (
        <div className="text-center py-12 px-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lime-600 dark:text-lime-400 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-slate-200">Nenhum check-in registrado ainda</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4 font-medium">
            Registre suas paradas nos pontos turísticos pelo Google Maps para criar um histórico autêntico das suas viagens.
          </p>
          <button
            onClick={onOpenCheckinModal}
            className="px-5 py-2.5 bg-lime-400 text-slate-950 text-xs font-black rounded-2xl hover:bg-lime-300 transition shadow-md"
          >
            Fazer Primeiro Check-in
          </button>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {checkins.map((ck) => {
            const dateStr = formatDate(ck.timestamp);

            return (
              <div key={ck.id} className="relative group">
                {/* Timeline Dot */}
                <span className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-lime-400 border-4 border-[#dce9dc] shadow-md flex items-center justify-center"></span>

                <div className="bg-white/70 dark:bg-[#001f3f]/50 backdrop-blur-[15px] rounded-2xl p-4 border border-white/60 dark:border-white/10 hover:border-lime-400/50 transition shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-lime-600 dark:text-lime-400" />
                          {dateStr}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                        {ck.placeName}
                      </h3>

                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        {ck.address}
                      </p>

                      {ck.note && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mt-2 italic font-medium">
                          "{ck.note}"
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <a
                          href={ck.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-lime-400 text-slate-950 rounded-xl text-xs font-black hover:bg-lime-300 transition"
                        >
                          Google Maps <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => onDeleteCheckin(ck.id)}
                          className="text-xs text-slate-400 hover:text-red-500 font-bold p-1"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>

                    {ck.photoUrl && (
                      <div className="w-full sm:w-32 h-28 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-md bg-slate-100 dark:bg-slate-900">
                        <img
                          src={ck.photoUrl}
                          alt={ck.placeName}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
