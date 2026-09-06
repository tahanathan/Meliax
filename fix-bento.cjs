const fs = require('fs');
let code = fs.readFileSync('src/components/TripDashboardBento.tsx', 'utf8');

const baseClass = "bento-card relative bg-white/60 dark:bg-[#121316]/60 backdrop-blur-[24px] rounded-[24px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#ff5722]/50 transition-all duration-300 group";

const getMesh = (color1, color2) => `
      {/* Decorative Glassmorphism Mesh Gradients */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/40 to-transparent dark:from-[${color1}]/60 dark:via-black/40 dark:to-[${color2}]/40 pointer-events-none" />
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#ff5722]/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out" />
      <div className="relative z-10 flex flex-col h-full">`;

// Card 1
code = code.replace(
  /className="bento-card glass-panel rounded-\[24px\] p-6 lg:col-span-2 relative group flex flex-col justify-between overflow-hidden[^"]*"/g,
  `className="${baseClass} p-6 lg:col-span-2 flex flex-col justify-between"`
);

// Card 2
code = code.replace(
  /className="bento-card glass-panel rounded-\[24px\] p-6 relative group flex flex-col items-center justify-between cursor-pointer[^"]*"/g,
  `className="${baseClass} p-6 flex flex-col items-center justify-between cursor-pointer"`
);

// Card 3 (Map)
code = code.replace(
  /className="bento-card glass-panel rounded-\[24px\] p-0 relative group overflow-hidden[^"]*flex flex-col justify-between min-h-\[220px\]"/g,
  `className="${baseClass} p-0 flex flex-col justify-between min-h-[220px]"`
);

// Card 4
code = code.replace(
  /className="bento-card glass-panel rounded-\[24px\] p-6 lg:col-span-2 lg:row-span-2 relative group flex flex-col h-\[600px\] lg:h-auto overflow-hidden[^"]*"/g,
  `className="${baseClass} p-6 lg:col-span-2 lg:row-span-2 flex flex-col h-[600px] lg:h-auto"`
);

// Card 5 & 6
code = code.replace(
  /className="bento-card glass-panel rounded-\[24px\] p-6 relative group flex flex-col[^"]*"/g,
  `className="${baseClass} p-6 flex flex-col"`
);

fs.writeFileSync('src/components/TripDashboardBento.tsx', code);
