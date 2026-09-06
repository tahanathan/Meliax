import re

with open('src/components/TripDashboardBento.tsx', 'r') as f:
    content = f.read()

# I will replace the Notas Rápidas card.
notas_old = '''          {/* Card 6: Notes / Quick Info ("Notas Rápidas") */}
          <div className="bento-card glass-panel rounded-2xl p-6 relative group flex flex-col transition-all duration-300 hover:border-[#a3e635]/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-xs text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#e3e2e5]" />
                Notas Rápidas
              </h3>
              <button
                onClick={() => setIsEditingNotes(true)}
                className="w-8 h-8 rounded-full bg-[#343537] flex items-center justify-center hover:bg-[#a3e635] hover:text-[#121f00] text-white transition-colors cursor-pointer"
                title="Editar Notas"
              >
                <FileEdit className="w-4 h-4" />
              </button>
            </div>

            <div
              onClick={() => setIsEditingNotes(true)}
              className="bg-[#1a1c1e] rounded-xl p-4 border border-white/5 text-sm text-[#c4c6cf] relative overflow-hidden group/note cursor-pointer hover:bg-white/5 transition"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a3e635] rounded-l-xl" />
              <ul className="list-disc pl-5 space-y-2">
                {notesList.map((noteItem, idx) => (
                  <li key={`note-${idx}`} className="leading-relaxed">{noteItem}</li>
                ))}
              </ul>
              
              {notesList.length === 0 && (
                <p className="text-[#c4c6cf]/50 italic">Adicione dicas, itens para levar ou ideias de passeio...</p>
              )}
            </div>
          </div>'''

notas_new = '''          {/* Card 6: Notes / Quick Info ("Notas Rápidas") */}
          <div className="bento-card glass-panel rounded-2xl p-6 relative group flex flex-col transition-all duration-300 hover:border-[#a3e635]/30 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] h-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-xs text-[#c4c6cf] uppercase tracking-wider flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-[#e3e2e5]" />
                Notas Rápidas
              </h3>
            </div>

            <div className="bg-[#1a1c1e] rounded-xl p-4 border border-white/5 relative overflow-hidden group/note flex-1 flex flex-col transition focus-within:border-white/20">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#a3e635] rounded-l-xl" />
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                onBlur={handleSaveNotes}
                placeholder="Adicione dicas, itens para levar ou ideias de passeio..."
                className="w-full h-full bg-transparent border-none text-sm text-[#c4c6cf] focus:outline-none resize-none leading-relaxed ml-2 flex-1"
                rows={5}
              />
            </div>
          </div>'''

content = content.replace(notas_old, notas_new)

# Now I must remove the modal for editing notes completely.
modal_pattern = r'\{isEditingNotes && \(\s*<div className="fixed inset-0.*?</div>\s*\)\}'
content = re.sub(modal_pattern, '', content, flags=re.DOTALL)

with open('src/components/TripDashboardBento.tsx', 'w') as f:
    f.write(content)
