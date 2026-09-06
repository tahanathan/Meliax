import { Trip } from '../types';

export const getContinent = (country: string | undefined) => {
  if (!country) return 'Outros';
  const c = country.toLowerCase();
  if (['brasil', 'brazil', 'argentina', 'chile', 'peru', 'colombia', 'uruguai', 'paraguai', 'bolívia', 'equador', 'venezuela', 'guiana', 'suriname'].some(x => c.includes(x))) return 'América do Sul';
  if (['frança', 'france', 'noruega', 'norway', 'ústria', 'austria', 'bélgica', 'belgium', 'suécia', 'sweden', 'suíça', 'switzerland', 'itália', 'italy', 'espanha', 'spain', 'alemanha', 'germany', 'portugal', 'inglaterra', 'uk', 'reino unido', 'holanda', 'netherlands'].some(x => c.includes(x))) return 'Europa';
  if (['japão', 'japan', 'china', 'índia', 'india', 'tailândia', 'thailand', 'indonésia', 'indonesia', 'vietnã', 'vietnam'].some(x => c.includes(x))) return 'Ásia';
  if (['canadá', 'canada', 'eua', 'estados unidos', 'usa', 'méxico', 'mexico'].some(x => c.includes(x))) return 'América do Norte';
  if (['fiji', 'austrália', 'australia', 'nova zelândia', 'new zealand'].some(x => c.includes(x))) return 'Oceania';
  if (['áfrica do sul', 'south africa', 'marrocos', 'morocco', 'egito', 'egypt'].some(x => c.includes(x))) return 'África';
  return 'Outros';
};

export const getBrazilRegion = (destination: string | undefined) => {
  if (!destination) return 'Brasil';
  const d = destination.toLowerCase();
  if (['rio', 'são paulo', 'minas', 'espírito'].some(x => d.includes(x))) return 'Sudeste';
  if (['bahia', 'salvador', 'pernambuco', 'recife', 'ceará', 'fortaleza', 'alagoas', 'maceió', 'maranhão', 'natal', 'rio grande do norte', 'paraíba', 'piauí', 'sergipe'].some(x => d.includes(x))) return 'Nordeste';
  if (['amazonas', 'manaus', 'pará', 'belém', 'acre', 'roraima', 'amapá', 'tocantins'].some(x => d.includes(x))) return 'Norte';
  if (['paraná', 'curitiba', 'santa catarina', 'florianópolis', 'floripa', 'rio grande do sul', 'porto alegre', 'gramado'].some(x => d.includes(x))) return 'Sul';
  if (['goiás', 'mato grosso', 'brasília'].some(x => d.includes(x))) return 'Centro-Oeste';
  return 'Brasil';
};

export const getDynamicCategories = (trips: Trip[]) => {
  const validTrips = trips.filter(t => t.country);
  const countries = Array.from(new Set(validTrips.map(t => t.country!)));
  if (countries.length === 0) return [];
  
  if (countries.length === 1) {
    const country = countries[0].toLowerCase();
    if (country.includes('brasil') || country.includes('brazil')) {
      const regions = Array.from(new Set(validTrips.map(t => getBrazilRegion(t.destination))));
      return regions.filter(Boolean);
    }
    return Array.from(new Set(validTrips.map(t => t.destination))).filter(Boolean) as string[];
  }
  
  const continents = Array.from(new Set(countries.map(c => getContinent(c))));
  if (continents.length > 1) {
    return continents.filter(Boolean);
  }
  
  return countries;
};
