import { Trip, CheckIn } from '../types';

export const DEMO_TRIPS: Trip[] = [
  {
    id: 'demo-trip-norway',
    userId: 'demo-user',
    title: 'Expedição Fiordes & Aurora',
    destination: 'Lofoten & Fiordes',
    country: 'Noruega',
    status: 'planned',
    rating: 5,
    startDate: '2025-09-12',
    endDate: '2025-09-22',
    notes: 'Caçada à Aurora Boreal nas ilhas Lofoten, navegação pelos fiordes de Geiranger e caminhada até Reinebringen.',
    coverImage: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Aventura',
    budget: 18500,
    coordinates: { lat: 68.2093, lng: 13.6083 },
    itinerary: [
      {
        id: 'it-no-1',
        day: 1,
        time: '10:00 - 15:00',
        title: 'Chegada em Oslo & Conexão Bodø',
        place: 'Aeroporto Gardermoen (OSL)',
        description: 'Retirada do veículo 4x4 e conferência dos trajes térmicos.',
        location: 'Oslo, Noruega',
        category: 'transport',
        cost: 4200,
        done: true,
        coordinates: { lat: 60.1975, lng: 11.1004 }
      },
      {
        id: 'it-no-2',
        day: 2,
        time: '13:30',
        title: 'Ferry para as Ilhas Lofoten',
        place: 'Moskenes & Vila de Å',
        description: 'Travessia cênica de balsa e hospedagem nas tradicionais cabanas Rorbu à beira-mar.',
        location: 'Lofoten, Noruega',
        category: 'lodging',
        cost: 1800,
        done: false,
        coordinates: { lat: 67.892, lng: 12.98 }
      },
      {
        id: 'it-no-3',
        day: 3,
        time: '21:30',
        title: 'Caçada à Aurora Boreal',
        place: 'Praia de Haukland',
        description: 'Observação astronômica sob céu aberto e registro fotográfico das luzes do norte.',
        location: 'Vestvågøy, Noruega',
        category: 'activity',
        cost: 450,
        done: false,
        coordinates: { lat: 68.199, lng: 13.529 }
      }
    ],
    participants: [
      { name: 'Você' }
    ],
    checkInsCount: 1,
    createdAt: '2025-01-10T12:00:00.000Z',
    updatedAt: '2025-01-10T12:00:00.000Z'
  },
  {
    id: 'demo-trip-tokyo',
    userId: 'demo-user',
    title: 'Tóquio & Kyoto Moderno',
    destination: 'Tóquio & Kyoto',
    country: 'Japão',
    status: 'planned',
    rating: 5,
    startDate: '2025-04-10',
    endDate: '2025-04-20',
    notes: 'Aventura Tecnológica e Tradição milenar. Visita aos templos de Kyoto, Shibuya Sky e gastronomia Kaiseki.',
    coverImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Cultura',
    budget: 25000,
    coordinates: { lat: 35.6762, lng: 139.6503 },
    itinerary: [
      {
        id: 'it-jp-1',
        day: 1,
        time: '09:45 - 14:30',
        title: 'Guarulhos (GRU) para Narita (NRT)',
        place: 'Aeroporto Narita (NRT)',
        description: 'Voo JL 043 • Japan Airlines • Confirmado',
        location: 'Tóquio, Japão',
        category: 'transport',
        cost: 6800,
        done: true,
        coordinates: { lat: 35.772, lng: 140.3929 }
      },
      {
        id: 'it-jp-2',
        day: 1,
        time: '16:00',
        title: 'Hotel Gracery Shinjuku',
        place: 'Hotel Gracery Shinjuku',
        description: 'Quarto Duplo Standard • 5 noites com vista para a cidade',
        location: 'Shinjuku, Tóquio',
        category: 'lodging',
        cost: 4200,
        done: true,
        coordinates: { lat: 35.6953, lng: 139.7022 }
      },
      {
        id: 'it-jp-3',
        day: 2,
        time: '09:00 - 13:00',
        title: 'Santuário Meiji Jingu & Harajuku',
        place: 'Meiji Jingu & Takeshita St',
        description: 'Caminhada matinal pela floresta sagrada e compras no vibrante bairro de Harajuku.',
        location: 'Shibuya, Tóquio',
        category: 'activity',
        cost: 150,
        done: false,
        coordinates: { lat: 35.6764, lng: 139.6993 }
      }
    ],
    participants: [
      { name: 'Você' }
    ],
    checkInsCount: 1,
    createdAt: '2025-01-08T10:00:00.000Z',
    updatedAt: '2025-01-08T10:00:00.000Z'
  },
  {
    id: 'demo-trip-rio',
    userId: 'demo-user',
    title: 'Paraíso Tropical Maravilhoso',
    destination: 'Rio de Janeiro',
    country: 'Brasil',
    state: 'Rio de Janeiro',
    status: 'visited',
    isFavorite: true,
    rating: 5,
    startDate: '2025-01-15',
    endDate: '2025-01-22',
    notes: 'Dias de sol nas praias de Ipanema e Leblon, pôr do sol clássico no Arpoador, Cristo Redentor e gastronomia carioca.',
    coverImage: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1518638150340-f706e86654de?auto=format&fit=crop&w=1200&q=80'
    ],
    category: 'Praia & Sol',
    budget: 6500,
    coordinates: { lat: -22.9068, lng: -43.1729 },
    itinerary: [
      {
        id: 'it-br-1',
        day: 1,
        time: '12:00',
        title: 'Check-in Hotel em Ipanema',
        place: 'Orla de Ipanema',
        description: 'Hospedagem à beira-mar e almoço tradicional no Garota de Ipanema.',
        location: 'Ipanema, Rio de Janeiro',
        category: 'lodging',
        cost: 1600,
        done: true,
        coordinates: { lat: -22.9847, lng: -43.1986 }
      },
      {
        id: 'it-br-2',
        day: 2,
        time: '09:00',
        title: 'Cristo Redentor & Trem do Corcovado',
        place: 'Parque Nacional da Tijuca',
        description: 'Passeio matinal de trem com vista panorâmica de toda a Baía de Guanabara.',
        location: 'Corcovado, Rio de Janeiro',
        category: 'activity',
        cost: 130,
        done: true,
        coordinates: { lat: -22.9519, lng: -43.2105 }
      },
      {
        id: 'it-br-3',
        day: 3,
        time: '17:30',
        title: 'Pôr do Sol na Pedra do Arpoador',
        place: 'Pedra do Arpoador',
        description: 'Tradição carioca de aplaudir o pôr do sol com água de coco gelada.',
        location: 'Arpoador, Rio de Janeiro',
        category: 'activity',
        cost: 30,
        done: true,
        coordinates: { lat: -22.9888, lng: -43.1917 }
      }
    ],
    participants: [
      { name: 'Você' }
    ],
    checkInsCount: 1,
    createdAt: '2025-01-05T09:00:00.000Z',
    updatedAt: '2025-01-05T09:00:00.000Z'
  }
];

export const DEMO_CHECKINS: CheckIn[] = [
  {
    id: 'demo-checkin-1',
    userId: 'demo-user',
    tripId: 'demo-trip-rio',
    placeName: 'Mirante da Pedra do Arpoador',
    address: 'Praia do Arpoador, Rio de Janeiro - RJ, Brasil',
    lat: -22.9888,
    lng: -43.1917,
    note: 'Visual espetacular do Morro Dois Irmãos e pôr do sol inesquecível!',
    photoUrl: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=800&q=80',
    timestamp: '2025-01-17T17:45:00.000Z',
    googleMapsUrl: 'https://maps.google.com/?q=-22.9888,-43.1917'
  },
  {
    id: 'demo-checkin-2',
    userId: 'demo-user',
    tripId: 'demo-trip-tokyo',
    placeName: 'Santuário Meiji Jingu',
    address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japão',
    lat: 35.6764,
    lng: 139.6993,
    note: 'Paz absoluta e energia renovadora no coração de Tóquio.',
    photoUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    timestamp: '2025-04-12T10:15:00.000Z',
    googleMapsUrl: 'https://maps.google.com/?q=35.6764,139.6993'
  },
  {
    id: 'demo-checkin-3',
    userId: 'demo-user',
    tripId: 'demo-trip-norway',
    placeName: 'Praia de Haukland',
    address: 'Uttakleivveien 200, 8370 Leknes, Noruega',
    lat: 68.199,
    lng: 13.529,
    note: 'Primeira visualização das luzes verdes da Aurora Boreal refletindo no mar.',
    photoUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=80',
    timestamp: '2025-09-15T22:00:00.000Z',
    googleMapsUrl: 'https://maps.google.com/?q=68.199,13.529'
  }
];
