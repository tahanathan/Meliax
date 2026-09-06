import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Desktop cards
content = content.replace(
    'className="group/window relative w-[145px] lg:w-[170px] h-[230px] lg:h-[270px] rounded-[50px] overflow-hidden shrink-0 shadow-2xl cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-1 bg-slate-900"',
    'className="group/window relative w-[180px] lg:w-[220px] h-[270px] lg:h-[320px] rounded-[50px] overflow-hidden shrink-0 shadow-2xl cursor-pointer transition-all duration-500 hover:scale-105 hover:-translate-y-1 bg-slate-900"'
)

# Mobile cards
content = content.replace(
    'className="relative w-1/2 h-40 rounded-[50px] overflow-hidden shadow-xl cursor-pointer bg-slate-900 transition-transform active:scale-95"',
    'className="relative w-1/2 h-52 rounded-[50px] overflow-hidden shadow-xl cursor-pointer bg-slate-900 transition-transform active:scale-95"'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

