import re

with open('src/components/TripFormModal.tsx', 'r') as f:
    content = f.read()

content = content.replace("const [destination, setDestination] = useState('');", "const [destination, setDestination] = useState('');\n  const [stateName, setStateName] = useState('');")
content = content.replace("setDestination(tripToEdit.destination);", "setDestination(tripToEdit.destination);\n      setStateName(tripToEdit.state || '');")
content = content.replace("destination: destination.trim(),\n      country", "destination: destination.trim(),\n      state: stateName.trim() || undefined,\n      country")

# Replace grid-cols-2 with grid-cols-3 for the location block
# Find the exact location block:
#           <div className="grid grid-cols-2 gap-4">
#             <div>
#               <label className="block text-xs font-mono uppercase font-medium text-slate-500 dark:text-slate-400 mb-1">
#                 Destino / Cidade
#               </label>
# It's a grid of 2. Make it 1 grid for mobile, md:grid-cols-3 for desktop maybe?
# Wait, let's just use string replace carefully.

grid_match = '''          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase font-medium text-slate-500 dark:text-slate-400 mb-1">
                Destino / Cidade'''

replacement = '''          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase font-medium text-slate-500 dark:text-slate-400 mb-1">
                Destino / Cidade'''
content = content.replace(grid_match, replacement)

country_field_end = '''              />
            </div>
          </div>'''
state_field = '''              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase font-medium text-slate-500 dark:text-slate-400 mb-1">
                Estado
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="Ex: Bahia, Flórida..."
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-lime-400"
              />
            </div>
          </div>'''

content = content.replace(country_field_end, state_field, 1)

with open('src/components/TripFormModal.tsx', 'w') as f:
    f.write(content)
