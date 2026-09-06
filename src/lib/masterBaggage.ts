import { BaggageItem } from '../types';

export const DEFAULT_MASTER_BAGGAGE: BaggageItem[] = [
  // Eletrônicos
  { id: 'mb-1', category: 'Eletrônicos', name: 'Carregador Portátil (Powerbank)', note: '20000mAh - Carga completa', weightKg: 0.4, packed: true },
  { id: 'mb-2', category: 'Eletrônicos', name: 'Adaptador de Tomada Universal', note: 'Padrão internacional', weightKg: 0.1, packed: true },
  { id: 'mb-3', category: 'Eletrônicos', name: 'Câmera Fotográfica (Mirrorless)', note: 'Não esquecer lentes extras', weightKg: 1.2, packed: false },
  { id: 'mb-4', category: 'Eletrônicos', name: 'Fones de Ouvido Cancelamento de Ruído', note: 'Para o voo', weightKg: 0.3, packed: false },
  { id: 'mb-5', category: 'Eletrônicos', name: 'Kindle / E-reader', note: 'Com livros baixados', weightKg: 0.2, packed: false },

  // Roupas
  { id: 'mb-6', category: 'Roupas', name: 'Casaco Impermeável', note: 'Para frio/chuva', weightKg: 0.8, packed: true },
  { id: 'mb-7', category: 'Roupas', name: 'Tênis de Caminhada Confortável', note: 'Usar no voo', weightKg: 0.9, packed: true },
  { id: 'mb-8', category: 'Roupas', name: 'Camisetas de Algodão (x5)', note: 'Cores neutras', weightKg: 0.7, packed: false },
  { id: 'mb-9', category: 'Roupas', name: 'Calças Jeans / Sarja (x2)', note: 'Peças versáteis', weightKg: 1.0, packed: false },
  { id: 'mb-10', category: 'Roupas', name: 'Roupas Íntimas e Meias (x7)', note: 'Organizar em organizadores', weightKg: 0.5, packed: false },

  // Higiene
  { id: 'mb-11', category: 'Higiene', name: 'Escova e Pasta de Dente', note: 'Estojo de viagem', weightKg: 0.15, packed: false },
  { id: 'mb-12', category: 'Higiene', name: 'Protetor Solar FPS 50', note: 'Frasco de até 100ml', weightKg: 0.1, packed: false },
  { id: 'mb-13', category: 'Higiene', name: 'Shampoo e Condicionador (Frascos Pq)', note: 'Líquidos no voo', weightKg: 0.2, packed: false },
  { id: 'mb-14', category: 'Higiene', name: 'Kit Primeiros Socorros / Remédios', note: 'Analgésicos e curativos', weightKg: 0.25, packed: false },

  // Documentos
  { id: 'mb-15', category: 'Documentos', name: 'Passaporte e RG', note: 'Verificar validade', weightKg: 0.1, packed: true },
  { id: 'mb-16', category: 'Documentos', name: 'Cartões de Crédito / Seguro Viagem', note: 'Cópia impressa + digital', weightKg: 0.05, packed: true },
  { id: 'mb-17', category: 'Documentos', name: 'Comprovante de Passagens e Reservas', note: 'Salvo offline no celular', weightKg: 0.05, packed: true },
];

const MASTER_BAGGAGE_KEY = 'voyager_master_baggage_checklist';

export function getMasterBaggage(): BaggageItem[] {
  try {
    const saved = localStorage.getItem(MASTER_BAGGAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Erro ao ler master baggage:', e);
  }
  return DEFAULT_MASTER_BAGGAGE;
}

export function saveMasterBaggage(items: BaggageItem[]): void {
  try {
    localStorage.setItem(MASTER_BAGGAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar master baggage:', e);
  }
}

export function cloneMasterBaggageToTrip(): BaggageItem[] {
  const master = getMasterBaggage();
  return master.map((item) => ({
    ...item,
    id: `trip-bag-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    packed: false, // reset packed status for new trip
  }));
}
