export const formatDate = (dateInput: string | Date | number): string => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && dateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateInput.split('-');
    return `${day}-${month}-${year}`;
  }
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Normaliza e converte textos (nomes próprios, cidades, países, títulos) para Title Case
 * (primeira letra maiúscula), preservando preposições pequenas em minúsculo se estiverem no meio.
 */
export function toTitleCase(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  const minorWords = new Set([
    'de', 'da', 'do', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'com', 'por', 'para', 'a', 'o', 'as', 'os', 'of', 'and', 'in', 'on', 'at', 'to', 'for'
  ]);

  return trimmed
    .split(/(\s+|[,.\-/–—])/)
    .map((word, idx, arr) => {
      if (!word || /^[\s,.\-/–—]+$/.test(word)) return word;
      const lower = word.toLowerCase();
      const isFirst = arr.slice(0, idx).filter((w) => /[a-zA-ZÀ-ÿ]/.test(w)).length === 0;
      if (isFirst || !minorWords.has(lower)) {
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }
      return lower;
    })
    .join('');
}

export const BRAZIL_STATES_MAP: Record<string, string> = {
  // Siglas
  ac: 'Acre',
  al: 'Alagoas',
  ap: 'Amapá',
  am: 'Amazonas',
  ba: 'Bahia',
  ce: 'Ceará',
  df: 'Distrito Federal',
  es: 'Espírito Santo',
  go: 'Goiás',
  ma: 'Maranhão',
  mt: 'Mato Grosso',
  ms: 'Mato Grosso do Sul',
  mg: 'Minas Gerais',
  pa: 'Pará',
  pb: 'Paraíba',
  pr: 'Paraná',
  pe: 'Pernambuco',
  pi: 'Piauí',
  rj: 'Rio de Janeiro',
  rn: 'Rio Grande do Norte',
  rs: 'Rio Grande do Sul',
  ro: 'Rondônia',
  rr: 'Roraima',
  sc: 'Santa Catarina',
  sp: 'São Paulo',
  se: 'Sergipe',
  to: 'Tocantins',
  // Nomes por extenso normalizados
  acre: 'Acre',
  alagoas: 'Alagoas',
  amapa: 'Amapá',
  amapá: 'Amapá',
  amazonas: 'Amazonas',
  bahia: 'Bahia',
  ceara: 'Ceará',
  ceará: 'Ceará',
  'distrito federal': 'Distrito Federal',
  brasilia: 'Distrito Federal',
  brasília: 'Distrito Federal',
  'espirito santo': 'Espírito Santo',
  'espírito santo': 'Espírito Santo',
  goias: 'Goiás',
  goiás: 'Goiás',
  maranhao: 'Maranhão',
  maranhão: 'Maranhão',
  'mato grosso': 'Mato Grosso',
  'mato grosso do sul': 'Mato Grosso do Sul',
  'minas gerais': 'Minas Gerais',
  para: 'Pará',
  pará: 'Pará',
  paraiba: 'Paraíba',
  paraíba: 'Paraíba',
  parana: 'Paraná',
  paraná: 'Paraná',
  pernambuco: 'Pernambuco',
  piaui: 'Piauí',
  piauí: 'Piauí',
  'rio de janeiro': 'Rio de Janeiro',
  'rio grande do norte': 'Rio Grande do Norte',
  'rio grande do sul': 'Rio Grande do Sul',
  rondonia: 'Rondônia',
  rondônia: 'Rondônia',
  roraima: 'Roraima',
  'santa catarina': 'Santa Catarina',
  'sao paulo': 'São Paulo',
  'são paulo': 'São Paulo',
  sergipe: 'Sergipe',
  tocantins: 'Tocantins',
};

// Dicionário de cidades famosas e capitais brasileiras para estimativa automática
export const FAMOUS_BRAZILIAN_CITIES_TO_STATE: Record<string, string> = {
  // Capitais
  'sao luis': 'Maranhão',
  'são luís': 'Maranhão',
  'sao luiz': 'Maranhão',
  'são luiz': 'Maranhão',
  'salvador': 'Bahia',
  'fortaleza': 'Ceará',
  'recife': 'Pernambuco',
  'rio de janeiro': 'Rio de Janeiro',
  'sao paulo': 'São Paulo',
  'são paulo': 'São Paulo',
  'belo horizonte': 'Minas Gerais',
  'curitiba': 'Paraná',
  'florianopolis': 'Santa Catarina',
  'florianópolis': 'Santa Catarina',
  'porto alegre': 'Rio Grande do Sul',
  'brasilia': 'Distrito Federal',
  'brasília': 'Distrito Federal',
  'goiania': 'Goiás',
  'goiânia': 'Goiás',
  'manaus': 'Amazonas',
  'belem': 'Pará',
  'belém': 'Pará',
  'vitoria': 'Espírito Santo',
  'vitória': 'Espírito Santo',
  'natal': 'Rio Grande do Norte',
  'maceio': 'Alagoas',
  'maceió': 'Alagoas',
  'joao pessoa': 'Paraíba',
  'joão pessoa': 'Paraíba',
  'teresina': 'Piauí',
  'aracaju': 'Sergipe',
  'campo grande': 'Mato Grosso do Sul',
  'cuiaba': 'Mato Grosso',
  'cuiabá': 'Mato Grosso',
  'palmas': 'Tocantins',
  'porto velho': 'Rondônia',
  'boa vista': 'Roraima',
  'macapa': 'Amapá',
  'macapá': 'Amapá',
  'rio branco': 'Acre',

  // Destinos turísticos populares
  'gramado': 'Rio Grande do Sul',
  'canela': 'Rio Grande do Sul',
  'foz do iguacu': 'Paraná',
  'foz do iguaçu': 'Paraná',
  'buzios': 'Rio de Janeiro',
  'búzios': 'Rio de Janeiro',
  'paraty': 'Rio de Janeiro',
  'angra dos reis': 'Rio de Janeiro',
  'petropolis': 'Rio de Janeiro',
  'petrópolis': 'Rio de Janeiro',
  'lencois maranhenses': 'Maranhão',
  'lençóis maranhenses': 'Maranhão',
  'barreirinhas': 'Maranhão',
  'jericoacoara': 'Ceará',
  'jijoca de jericoacoara': 'Ceará',
  'canoa quebrada': 'Ceará',
  'porto de galinhas': 'Pernambuco',
  'ipojuca': 'Pernambuco',
  'fernando de noronha': 'Pernambuco',
  'maragogi': 'Alagoas',
  'praia da pipa': 'Rio Grande do Norte',
  'tibau do sul': 'Rio Grande do Norte',
  'bonito': 'Mato Grosso do Sul',
  'pantanal': 'Mato Grosso do Sul',
  'jalapao': 'Tocantins',
  'jalapão': 'Tocantins',
  'mateiros': 'Tocantins',
  'chapada dos veadeiros': 'Goiás',
  'alto paraiso': 'Goiás',
  'alto paraíso': 'Goiás',
  'chapada diamantina': 'Bahia',
  'lencois': 'Bahia',
  'lençóis': 'Bahia',
  'porto seguro': 'Bahia',
  'arraial d ajuda': 'Bahia',
  'arraial d\'ajuda': 'Bahia',
  'trancoso': 'Bahia',
  'morro de sao paulo': 'Bahia',
  'morro de são paulo': 'Bahia',
  'itacare': 'Bahia',
  'itacaré': 'Bahia',
  'ilhabela': 'São Paulo',
  'campos do jordao': 'São Paulo',
  'campos do jordão': 'São Paulo',
  'ubatuba': 'São Paulo',
  'sao sebastiao': 'São Paulo',
  'são sebastião': 'São Paulo',
  'guaruja': 'São Paulo',
  'guarujá': 'São Paulo',
  'ouro preto': 'Minas Gerais',
  'tiradentes': 'Minas Gerais',
  'monte verde': 'Minas Gerais',
  'capitolio': 'Minas Gerais',
  'capitólio': 'Minas Gerais',
  'balneario camboriu': 'Santa Catarina',
  'balneário camboriú': 'Santa Catarina',
  'bombinhas': 'Santa Catarina',
  'blumenau': 'Santa Catarina',
  'penha': 'Santa Catarina',
  'caldas novas': 'Goiás',
  'rio quente': 'Goiás',
  'alter do chao': 'Pará',
  'alter do chão': 'Pará',
  'santarem': 'Pará',
  'santarém': 'Pará',
};

/**
 * Estima o Estado brasileiro a partir do texto da cidade ou busca digitada pelo usuário.
 */
export function estimateStateFromCity(input: string): string {
  if (!input || !input.trim()) return '';
  const raw = input.trim();
  const lower = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // 1. Verificar separadores como vírgula ou hífen (ex: "São Luís, MA" ou "Canela - RS")
  const parts = raw.split(/[,–-]/).map((p) => p.trim());
  if (parts.length >= 2) {
    const candidate = parts[1].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (BRAZIL_STATES_MAP[candidate]) {
      return BRAZIL_STATES_MAP[candidate];
    }
  }

  // 2. Verificar preposições comuns como "de", "do", "no", "em"
  const match = raw.match(/^(.*?)\s+(?:do|de|no|em|na)\s+([A-Za-zÀ-ÿ\s]+)$/i);
  if (match) {
    const candidate = match[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (BRAZIL_STATES_MAP[candidate]) {
      return BRAZIL_STATES_MAP[candidate];
    }
  }

  // 3. Verificar cidades conhecidas
  for (const [cityName, stateName] of Object.entries(FAMOUS_BRAZILIAN_CITIES_TO_STATE)) {
    const normCity = cityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (lower === normCity || lower.startsWith(normCity + ' ') || lower.includes(normCity)) {
      return stateName;
    }
  }

  return '';
}

