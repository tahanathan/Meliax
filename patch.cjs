const fs = require('fs');
let code = fs.readFileSync('src/components/TripDetailModal.tsx', 'utf8');

const target = `<div className="flex items-center mt-4">
            <div className="flex -space-x-2">
              {trip.participants?.map((p, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-400 overflow-hidden flex items-center justify-center text-slate-900 text-xs font-bold" title={p.name}>
                  {p.icon ? <img src={p.icon} alt={p.name} className="w-full h-full object-cover" /> : p.name.charAt(0)}
                </div>
              ))}
            </div>
            <button 
              onClick={handlePickContacts}
              className={\`w-8 h-8 rounded-full bg-white/20 border-2 border-white/50 hover:bg-white/40 flex items-center justify-center transition shadow-sm \${trip.participants && trip.participants.length > 0 ? 'ml-2' : ''}\`}
              title="Adicionar Participantes"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>`;

const replace = `<div className="mt-4">
            <CompanionsList participants={trip.participants} onAddClick={handlePickContacts} borderColor="border-white/50" />
          </div>`;

if(code.includes(target)) {
  fs.writeFileSync('src/components/TripDetailModal.tsx', code.replace(target, replace));
  console.log('patched');
} else {
  console.log('target not found');
}
