const fs = require('fs');
let code = fs.readFileSync('src/components/TripDashboardBento.tsx', 'utf8');

const mesh = `
          {/* Decorative Glassmorphism Mesh Gradients */}
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/40 to-transparent dark:from-[#2a1711]/60 dark:via-black/40 dark:to-[#1a1b1e]/40 pointer-events-none" />
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#007ea7]/10 dark:bg-[#ff5722]/30 rounded-full blur-[60px] pointer-events-none group-hover:scale-125 transition-transform duration-700 ease-out z-0" />
`;

// Find all `<div className="bento-card ...">` and insert the mesh right after it.
code = code.replace(/(<div className="bento-card[^"]*">)/g, `$1\n${mesh}`);

fs.writeFileSync('src/components/TripDashboardBento.tsx', code);
