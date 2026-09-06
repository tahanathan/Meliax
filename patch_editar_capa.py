import re

with open('src/components/TripDetailModal.tsx', 'r') as f:
    content = f.read()

# Replace the Edit button with Editar Capa

edit_btn_old = '''              {onEditTripDetails && (
                <button
                  onClick={() => onEditTripDetails(trip)}
                  className="px-4 py-2 bg-black/60 hover:bg-black/90 backdrop-blur-md text-white rounded-full transition border border-white/20 flex items-center gap-2 text-xs font-bold shadow-lg hover:scale-105 cursor-pointer"
                  title="Editar todos os dados da viagem"
                >
                  <Edit3 className="w-4 h-4 text-[#a3e635]" />
                  <span className="hidden sm:inline">Editar Viagem</span>
                </button>
              )}'''

edit_btn_new = '''              {trip.gallery && trip.gallery.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = trip.gallery!.indexOf(trip.coverImage);
                    const nextIndex = (currentIndex + 1) % trip.gallery!.length;
                    onUpdateTrip({ ...trip, coverImage: trip.gallery![nextIndex] });
                  }}
                  className="px-4 py-2 bg-black/60 hover:bg-black/90 backdrop-blur-md text-white rounded-full transition border border-white/20 flex items-center gap-2 text-xs font-bold shadow-lg hover:scale-105 cursor-pointer"
                  title="Trocar Capa da Viagem"
                >
                  <Edit3 className="w-4 h-4 text-[#a3e635]" />
                  <span className="hidden sm:inline">Editar Capa</span>
                </button>
              )}'''

content = content.replace(edit_btn_old, edit_btn_new)

with open('src/components/TripDetailModal.tsx', 'w') as f:
    f.write(content)
