const fs = require('fs');
let code = fs.readFileSync('src/components/TripDashboardBento.tsx', 'utf8');

// The map card starts with:
//         <div className="bento-card relative bg-white/60 dark:bg-[#121316]/60 backdrop-blur-[24px] rounded-[24px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#ff5722]/50 transition-all duration-300 group p-0 flex flex-col justify-between min-h-[220px]">
//           {/* Decorative Glassmorphism Mesh Gradients */}

const searchStr = `        <div className="bento-card relative bg-white/60 dark:bg-[#121316]/60 backdrop-blur-[24px] rounded-[24px] border border-white/60 dark:border-white/10 overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl hover:border-[#007ea7]/50 dark:hover:border-[#ff5722]/50 transition-all duration-300 group p-0 flex flex-col justify-between min-h-[220px]">
          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/40 to-transparent dark:from-[#2a1711]/60 dark:via-black/40 dark:to-[#1a1b1e]/40 pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#ff5722]/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-0" />`;

const replacementStr = `        <div className="bento-card relative rounded-[24px] overflow-hidden shadow-lg dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] hover:shadow-2xl transition-all duration-300 group p-0 flex flex-col justify-between min-h-[220px]">`;

code = code.replace(searchStr, replacementStr);
fs.writeFileSync('src/components/TripDashboardBento.tsx', code);
