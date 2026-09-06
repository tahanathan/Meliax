const fs = require('fs');

function fixFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Fix base glass classes
  code = code.replace(/bg-white\/60 dark:bg-\[#121316\]\/60 backdrop-blur-\[24px\]/g, 'bg-white/70 dark:bg-[#001f3f]/55 backdrop-blur-[15px]');

  // Fix mesh gradient 1
  code = code.replace(/dark:from-\[#2a1711\]\/60 dark:via-black\/40 dark:to-\[#1a1b1e\]\/40/g, 'dark:from-[#007ea7]/15 dark:via-[#001f3f]/40 dark:to-transparent');

  // Fix mesh gradient 2
  code = code.replace(/dark:bg-\[#ff5722\]\/30/g, 'dark:bg-[#a3e635]/20');
  
  // Also check if hover colors need adjusting: dark:hover:border-[#ff5722]/50 -> dark:hover:border-[#a3e635]/50
  code = code.replace(/dark:hover:border-\[#ff5722\]\/50/g, 'dark:hover:border-[#a3e635]/50');

  fs.writeFileSync(filePath, code);
}

fixFile('src/components/TripCard.tsx');
fixFile('src/components/TripDashboardBento.tsx');

console.log('Done');
