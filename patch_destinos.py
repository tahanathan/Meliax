import re

with open('src/components/DestinosView.tsx', 'r') as f:
    content = f.read()

# 1. Add state variables
state_vars = """
  // Filter States
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [activeYear, setActiveYear] = useState<string>('');
  const [maxBudget, setMaxBudget] = useState<number>(30000);"""
content = re.sub(r'// Filter States\s*const \[maxBudget, setMaxBudget\] = useState<number>\(30000\);', state_vars, content)

# 2. Extract Categories and Years
extract_vars = """  const [sortBy, setSortBy] = useState<'recentes' | 'preco_asc' | 'preco_desc'>('recentes');

  // Dynamic Lists
  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(trips.map(t => t.country || t.destination).filter(Boolean))).sort().slice(0, 10);
  }, [trips]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(trips.map(t => {
      const date = t.startDate ? new Date(t.startDate) : new Date(t.createdAt);
      return date.getFullYear().toString();
    }))).sort((a,b) => Number(b) - Number(a));
  }, [trips]);

  // Filter logic for ALL trips"""
content = re.sub(r'const \[sortBy, setSortBy\] = useState<\'recentes\' \| \'preco_asc\' \| \'preco_desc\'>\(\'recentes\'\);\s*// Filter logic for ALL trips', extract_vars, content)

# 3. Add filtering logic
filter_logic = """        if (dest.budget && dest.budget > maxBudget) return false;
        
        // Region/Category filter
        if (activeCategory) {
          const cat = activeCategory.toLowerCase();
          const matchC = dest.country?.toLowerCase() === cat;
          const matchD = dest.destination?.toLowerCase() === cat;
          if (!matchC && !matchD) return false;
        }

        // Year filter
        if (activeYear) {
          const year = (dest.startDate ? new Date(dest.startDate) : new Date(dest.createdAt)).getFullYear().toString();
          if (year !== activeYear) return false;
        }

        // Adventure Filter"""
content = re.sub(r'if \(dest\.budget && dest\.budget > maxBudget\) return false;\s*// Adventure Filter', filter_logic, content)

# 4. Insert layout structure around the main content
# Replace the end of Header and start of Bento Grid
layout_start = """      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Side: Vertical Year Pill */}
        <div className="md:w-16 lg:w-20 shrink-0 w-full md:sticky md:top-24 z-10">
           <div className="flex flex-row md:flex-col bg-white/65 dark:bg-[#001f3f]/45 backdrop-blur-[15px] border border-white/60 dark:border-white/10 rounded-full p-2 gap-2 shadow-sm overflow-x-auto no-scrollbar justify-start md:justify-center items-center">
             <button
               onClick={() => setActiveYear('')}
               className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${
                 activeYear === '' 
                   ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] shadow-md' 
                   : 'bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/20'
               }`}
             >
               Todos
             </button>
             {availableYears.map(year => (
               <button
                 key={year}
                 onClick={() => setActiveYear(year)}
                 className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                   activeYear === year
                     ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] shadow-md' 
                     : 'bg-white/40 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-white/20'
                 }`}
               >
                 {year}
               </button>
             ))}
           </div>
        </div>

        {/* Main Content (Filters + Grid/List) */}
        <div className="flex-1 w-full min-w-0">
          {/* Category Filter Pills on Top of Main Content */}
          <div className="mb-6 flex gap-2.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory('')}
              className={`${activeCategory === '' ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] shadow-lg font-semibold' : 'bg-white/65 dark:bg-[#001f3f]/45 backdrop-blur-[15px] text-slate-900 dark:text-white border border-white/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-[#001f3f]/70'} px-5 py-2.5 rounded-full text-xs font-semibold transition hover:scale-105 flex items-center gap-2 shrink-0`}
            >
              <Compass className="w-4 h-4" />
              Todas as Regiões
            </button>
            {dynamicCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`${activeCategory === cat ? 'bg-[#007ea7] dark:bg-[#a3e635] text-white dark:text-[#001f3f] shadow-lg font-semibold' : 'bg-white/65 dark:bg-[#001f3f]/45 backdrop-blur-[15px] text-slate-900 dark:text-white border border-white/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-[#001f3f]/70'} px-5 py-2.5 rounded-full text-xs font-semibold transition hover:scale-105 flex items-center gap-2 shrink-0`}
              >
                <MapPin className="w-4 h-4" />
                {cat}
              </button>
            ))}
          </div>

      {/* Bento Grid (Top 7 Recent) */}"""
content = re.sub(r'      </div>\s*\{/\* Bento Grid \(Top 7 Recent\) \*/\}', layout_start, content)

# 5. Close the new divs at the very end
layout_end = """        </div>
      </div>
    </div>
  );
};
"""
content = re.sub(r'    </div>\s*\);\s*};\s*$', layout_end, content)


with open('src/components/DestinosView.tsx', 'w') as f:
    f.write(content)
