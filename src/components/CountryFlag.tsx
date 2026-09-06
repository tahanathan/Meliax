import React from 'react';

const COUNTRY_CODE_MAP: Record<string, string> = {
  norway: 'no', noruega: 'no',
  austria: 'at', ústria: 'at', áustria: 'at',
  belgium: 'be', bélgica: 'be',
  fiji: 'fj',
  sweden: 'se', suécia: 'se',
  switzerland: 'ch', suiça: 'ch', suíça: 'ch',
  canada: 'ca', canadá: 'ca',
  brazil: 'br', brasil: 'br',
  france: 'fr', frança: 'fr',
  spain: 'es', espanha: 'es',
  maldives: 'mv', maldivas: 'mv',
  japan: 'jp', japão: 'jp',
  italy: 'it', itália: 'it',
  usa: 'us', eua: 'us', 'estados unidos': 'us',
  germany: 'de', alemanha: 'de',
  portugal: 'pt',
  'united kingdom': 'gb', uk: 'gb', 'reino unido': 'gb',
  greece: 'gr', grécia: 'gr',
  argentina: 'ar',
  chile: 'cl',
  peru: 'pe', perú: 'pe',
  mexico: 'mx', méxico: 'mx',
  egypt: 'eg', egito: 'eg',
  thailand: 'th', tailândia: 'th',
  indonesia: 'id', indonésia: 'id',
  iceland: 'is', islândia: 'is',
  'new zealand': 'nz', 'nova zelândia': 'nz',
  australia: 'au', austrália: 'au',
  'south africa': 'za', 'áfrica do sul': 'za',
  turkey: 'tr', turquia: 'tr',
  morocco: 'ma', marrocos: 'ma',
  croatia: 'hr', croácia: 'hr',
  netherlands: 'nl', holanda: 'nl', 'países baixos': 'nl',
  ireland: 'ie', irlanda: 'ie',
  colombia: 'co', colômbia: 'co',
  uruguay: 'uy', uruguai: 'uy',
  paraguay: 'py', paraguai: 'py',
  bolivia: 'bo', bolívia: 'bo',
  china: 'cn',
  india: 'in', índia: 'in',
  russia: 'ru', rússia: 'ru',
};

export const getCountryCode = (countryName: string): string | null => {
  if (!countryName) return null;
  const cleaned = countryName.toLowerCase().trim();
  if (COUNTRY_CODE_MAP[cleaned]) return COUNTRY_CODE_MAP[cleaned];
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (cleaned.includes(key) || key.includes(cleaned)) return code;
  }
  return null;
};

interface CountryFlagProps {
  country: string;
  className?: string;
  showName?: boolean;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ country, className = "w-5 h-3.5", showName = false }) => {
  const code = getCountryCode(country);
  
  if (code) {
    return (
      <span className="inline-flex items-center gap-1.5 shrink-0">
        <img
          src={`https://flagcdn.com/w40/${code}.png`}
          alt={country}
          className={`${className} object-cover rounded-[2px] shadow-sm shrink-0 border border-white/20`}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        {showName && <span>{country}</span>}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 shrink-0">
      <span className="text-xs">🌐</span>
      {showName && <span>{country}</span>}
    </span>
  );
};
