import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

// Use standard CommonJS __dirname since esbuild outputs cjs
// We don't need to define it manually.

function cleanAndParseJSON(text: string) {
  try {
    if (!text) return {};
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanText = match[1];
      }
    }
    return JSON.parse(cleanText);
  } catch (e: any) {
    throw new Error(`Failed to parse JSON: ${e.message}`);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI lazily
  let aiClient: GoogleGenAI | null = null;
  function getAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      aiClient = new GoogleGenAI({ apiKey });
    }
    return aiClient;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Weather proxy endpoint to avoid client CORS / fetch failures
  app.get('/api/weather', async (req, res) => {
    const lat = req.query.lat || '-23.5505';
    const lon = req.query.lon || '-46.6333';
    try {
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
        { headers: { 'User-Agent': 'VoyagerTravelApp/1.0' } }
      );
      if (!weatherRes.ok) {
        return res.json({ temperature: 24 });
      }
      const data: any = await weatherRes.json();
      const temp = data?.current_weather?.temperature;
      res.json({ temperature: typeof temp === 'number' ? Math.round(temp) : 24 });
    } catch {
      res.json({ temperature: 24 });
    }
  });

  // Geocoding proxy endpoint with OpenStreetMap and city fallback
  app.get('/api/geocode', async (req, res) => {
    const q = req.query.q as string;
    if (!q || !q.trim()) {
      return res.json({ success: false, results: [] });
    }
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
        { headers: { 'User-Agent': 'VoyagerTravelApp/1.0 (contact@voyager.app)' } }
      );
      if (geoRes.ok) {
        const data = await geoRes.json();
        return res.json({ success: true, results: data });
      }
    } catch {
      // Fallback handled below
    }
    res.json({ success: true, results: [] });
  });

  // Helper function to call Gemini with multi-model fallback and transient error retries (503, 429)
  async function generateGeminiContentWithFallback(
    ai: GoogleGenAI,
    prompt: string,
    config: any
  ): Promise<string> {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });
        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        // Move quickly to next valid model if unavailable or errored
        continue;
      }
    }

    throw lastError || new Error('All Gemini model attempts failed');
  }

  // Helper to generate a fallback itinerary if Gemini is not configured or fails
  function createFallbackItinerary(
    destination: string,
    days: number,
    category: string,
    budget: number,
    state?: string,
    country?: string
  ) {
    const daysArr = Array.from({ length: Math.max(1, days) }, (_, i) => i + 1);
    
    // Coordinate estimator for popular cities
    const coordsMap: Record<string, { lat: number; lng: number; country: string; state?: string }> = {
      canela: { lat: -29.3653, lng: -50.8105, country: 'Brasil', state: 'Rio Grande do Sul' },
      gramado: { lat: -29.3787, lng: -50.8739, country: 'Brasil', state: 'Rio Grande do Sul' },
      'porto alegre': { lat: -30.0346, lng: -51.2177, country: 'Brasil', state: 'Rio Grande do Sul' },
      florianopolis: { lat: -27.5954, lng: -48.5480, country: 'Brasil', state: 'Santa Catarina' },
      florianópolis: { lat: -27.5954, lng: -48.5480, country: 'Brasil', state: 'Santa Catarina' },
      curitiba: { lat: -25.4284, lng: -49.2733, country: 'Brasil', state: 'Paraná' },
      'sao paulo': { lat: -23.5505, lng: -46.6333, country: 'Brasil', state: 'São Paulo' },
      'são paulo': { lat: -23.5505, lng: -46.6333, country: 'Brasil', state: 'São Paulo' },
      'rio de janeiro': { lat: -22.9068, lng: -43.1729, country: 'Brasil', state: 'Rio de Janeiro' },
      salvador: { lat: -12.9777, lng: -38.5016, country: 'Brasil', state: 'Bahia' },
      recife: { lat: -8.0476, lng: -34.8770, country: 'Brasil', state: 'Pernambuco' },
      fortaleza: { lat: -3.7319, lng: -38.5267, country: 'Brasil', state: 'Ceará' },
      natal: { lat: -5.7945, lng: -35.2110, country: 'Brasil', state: 'Rio Grande do Norte' },
      'belo horizonte': { lat: -19.9167, lng: -43.9345, country: 'Brasil', state: 'Minas Gerais' },
      brasilia: { lat: -15.7975, lng: -47.8919, country: 'Brasil', state: 'Distrito Federal' },
      brasília: { lat: -15.7975, lng: -47.8919, country: 'Brasil', state: 'Distrito Federal' },
      'foz do iguacu': { lat: -25.5469, lng: -54.5882, country: 'Brasil', state: 'Paraná' },
      'foz do iguaçu': { lat: -25.5469, lng: -54.5882, country: 'Brasil', state: 'Paraná' },
      'campos do jordao': { lat: -22.7394, lng: -45.5913, country: 'Brasil', state: 'São Paulo' },
      'campos do jordão': { lat: -22.7394, lng: -45.5913, country: 'Brasil', state: 'São Paulo' },
      paraty: { lat: -23.2178, lng: -44.7131, country: 'Brasil', state: 'Rio de Janeiro' },
      buzios: { lat: -22.7469, lng: -41.8817, country: 'Brasil', state: 'Rio de Janeiro' },
      búzios: { lat: -22.7469, lng: -41.8817, country: 'Brasil', state: 'Rio de Janeiro' },
      paris: { lat: 48.8566, lng: 2.3522, country: 'França' },
      tokyo: { lat: 35.6762, lng: 139.6503, country: 'Japão' },
      tóquio: { lat: 35.6762, lng: 139.6503, country: 'Japão' },
      roma: { lat: 41.9028, lng: 12.4964, country: 'Itália' },
      'nova york': { lat: 40.7128, lng: -74.0060, country: 'Estados Unidos' },
      lisboa: { lat: 38.7223, lng: -9.1393, country: 'Portugal' },
      londres: { lat: 51.5074, lng: -0.1278, country: 'Reino Unido' },
      barcelona: { lat: 41.3851, lng: 2.1734, country: 'Espanha' },
      braganca: { lat: -1.0536, lng: -46.7656, country: 'Brasil', state: 'Pará' },
      bragança: { lat: -1.0536, lng: -46.7656, country: 'Brasil', state: 'Pará' },
    };

    const key = destination.toLowerCase().trim();
    const isBrazil = (country && country.toLowerCase().includes('brasil')) || (state && state.toLowerCase().includes('pará')) || key.includes('pará') || key.includes('para');
    
    let matched = coordsMap[key];
    if (!matched) {
      if (key.includes('canela')) {
        matched = { lat: -29.3653, lng: -50.8105, country: 'Brasil', state: 'Rio Grande do Sul' };
      } else if (key.includes('para') || key.includes('pará')) {
        matched = { lat: -1.0536, lng: -46.7656, country: 'Brasil', state: 'Pará' };
      } else if (isBrazil) {
        matched = { lat: -22.9068, lng: -43.1729, country: 'Brasil', state: state || 'Rio de Janeiro' };
      } else {
        matched = { lat: -22.9068, lng: -43.1729, country: country || 'Destino Internacional' };
      }
    }

    const finalCountryName = country || matched.country;
    const finalStateName = state || matched.state || '';
    const locDescription = [destination, finalStateName, finalCountryName].filter(Boolean).join(', ');

    return {
      title: `Roteiro ${category} em ${destination}`,
      destination: destination,
      state: finalStateName,
      country: finalCountryName,
      category: category,
      budget: budget,
      coordinates: { lat: matched.lat, lng: matched.lng },
      notes: `Roteiro de ${days} dias gerado para ${locDescription}. Aproveite passeios incríveis, atrações autênticas da região e gastronomia local!`,
      itinerary: daysArr.flatMap((d) => [
        {
          id: `item-${d}-1-${Date.now()}`,
          day: d,
          time: "09:30",
          place: `Passeio Principal - Dia ${d} em ${destination}`,
          description: `Exploração das principais atrações e pontos turísticos autênticos de ${locDescription}.`,
          location: `Centro / Área Principal, ${destination}`,
          category: 'activity',
          done: false,
          cost: Math.round(budget * 0.15)
        },
        {
          id: `item-${d}-2-${Date.now()}`,
          day: d,
          time: "14:00",
          place: `Atração Cultural / Ponto Turístico - Dia ${d}`,
          description: `Visita a pontos históricos, praças ou belezas naturais em ${destination}.`,
          location: destination,
          category: 'activity',
          done: false,
          cost: Math.round(budget * 0.10)
        },
        {
          id: `item-${d}-3-${Date.now()}`,
          day: d,
          time: "19:30",
          place: `Jantar e Culinária Típica de ${destination}`,
          description: `Experiência gastronômica com sabores tradicionais da culinária de ${finalStateName ? `${destination} (${finalStateName})` : destination}.`,
          location: `Restaurante Local, ${destination}`,
          category: 'food',
          done: false,
          cost: Math.round(budget * 0.20)
        }
      ]),
      recommendedPlaces: [
        {
          name: `Centro Histórico e Turístico de ${destination}`,
          type: "Atração Principal",
          address: `Praça Central, ${locDescription}`,
          lat: matched.lat,
          lng: matched.lng
        }
      ]
    };
  }

  // AI Trip / Itinerary Generator using Gemini with automatic fallback
  app.post('/api/generate-itinerary', async (req, res) => {
    const { destination, state = '', country = '', days = 3, category = 'Aventura', budget = 500, style = 'Equilibrado' } = req.body;
    if (!destination) {
      return res.status(400).json({ error: 'Destino é obrigatório' });
    }

    const fullLocation = [destination, state, country].filter(Boolean).join(', ');

    try {
      const ai = getAI();
      const prompt = `Você é um guia de viagens profissional e especialista em geografia mundial e turismo.
Crie um roteiro de viagem detalhado, autêntico e inspirador.

DADOS DE LOCALIZAÇÃO (TRIANGULAÇÃO OBRIGATÓRIA):
- Cidade / Destino: "${destination}"
- Estado / Província / Região: "${state || 'Identificar e validar geograficamente conforme o país/destino fornecido'}"
- País: "${country || 'Identificar e validar geograficamente conforme a cidade/estado informados'}"
- Duração: ${days} dias
- Categoria de viagem: ${category}
- Orçamento estimado total: R$ ${budget} ou equivalente
- Estilo: ${style}

IMPORTANTE - REGRAS DE TRIANGULAÇÃO GEOGRÁFICA RIGOROSA:
1. Faça a triangulação exata e precisa da Cidade, Estado/Região e País.
2. NUNCA confunda cidades homônimas em diferentes países ou estados!
   - Exemplo crítico: Se a cidade for "Bragança" com estado "Pará" ou país "Brasil" (ou "Bragança do Pará"), você DEVE gerar atrações exclusivamente de Bragança no Pará, Brasil (ex: Praia de Ajuruteua, Marujada de São Benedito, Farol de Ajuruteua, Rio Caeté, Centro Histórico de Bragança/PA, polo gastronômico da farinha de Bragança, peixe frito com açaí) e coordenadas geográficas reais de Bragança/PA (aproximadamente lat: -1.0536, lng: -46.7656), e NUNCA de Bragança em Portugal (como Castelo de Bragança).
   - Se for "Santiago" no Chile, não confunda com Santiago de Compostela na Espanha nem Santiago/RS.
   - Se for "Córdoba" na Argentina, não sugira atrações de Córdoba na Espanha.
3. Todas as atrações (place), descrições (description), notas (notes) e pontos recomendados (recommendedPlaces) DEVEM pertencer e estar situados na localização real triangulada ("${fullLocation}").
4. Forneça coordenadas geográficas reais (lat, lng) precisas para o município e pontos turísticos para que possam ser plotados no mapa interativo.

Retorne ESTRITAMENTE um JSON válido com a seguinte estrutura (sem textos explicativos ao redor, apenas o JSON):
{
  "title": "Tour inesquecível em ${destination}",
  "destination": "${destination}",
  "state": "${state || 'Estado Correto'}",
  "country": "${country || 'País Correto'}",
  "category": "${category}",
  "budget": ${budget},
  "coordinates": { "lat": -1.0536, "lng": -46.7656 },
  "notes": "Uma apresentação atraente e dicas essenciais desta localidade.",
  "itinerary": [
    {
      "id": "item-1",
      "day": 1,
      "time": "09:00",
      "place": "Nome Real da Atração Local",
      "description": "Descrição envolvente do que ver e fazer aqui nesta localidade.",
      "location": "Bairro / Endereço / Referência na cidade triangulada",
      "category": "activity",
      "done": false,
      "cost": 50
    }
  ],
  "recommendedPlaces": [
    {
      "name": "Local Imperdível Real",
      "type": "Restaurante/Praia/Atração/Monumento",
      "address": "Endereço aproximado nesta cidade",
      "lat": -1.0536,
      "lng": -46.7656
    }
  ]
}
Responda em Português.`;

      const text = await generateGeminiContentWithFallback(ai, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.5,
      });

      const parsedData = cleanAndParseJSON(text);
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.warn('Gemini AI call failed or key not configured, using smart itinerary fallback:', error?.message);
      const fallbackData = createFallbackItinerary(destination, days, category, budget, state, country);
      res.json({ success: true, data: fallbackData });
    }
  });

  // AI Place Search & Info proxy
  
  app.post('/api/generate-activities', async (req, res) => {
    const { destination, state = '', country = '', days = 3, category = '' } = req.body;
    if (!destination) {
      return res.status(400).json({ error: 'Destino é obrigatório' });
    }

    const fullLocation = [destination, state, country].filter(Boolean).join(', ');

    try {
      const ai = getAI();
      const prompt = `Você é um guia de viagens profissional e especialista em geografia mundial e turismo.
Crie sugestões de atividades autênticas e precisas para um roteiro de viagem de ${days} dias.

DADOS DE LOCALIZAÇÃO (TRIANGULAÇÃO OBRIGATÓRIA):
- Cidade / Destino: "${destination}"
- Estado / Província / Região: "${state || 'Identificar e validar conforme a cidade e país'}"
- País: "${country || 'Identificar e validar conforme a cidade e estado'}"
${category ? `- Categoria / Tema: "${category}"` : ''}

IMPORTANTE - REGRAS DE TRIANGULAÇÃO GEOGRÁFICA RIGOROSA:
1. Faça a triangulação exata e precisa entre a Cidade, Estado/Região e País.
2. NUNCA confunda cidades homônimas em diferentes países ou estados!
   - Exemplo crítico: Se o destino for "Bragança" com estado "Pará" ou país "Brasil" (ou "Bragança do Pará"), você DEVE gerar atividades exclusivamente de Bragança no Pará, Brasil (ex: Praia de Ajuruteua, Marujada de São Benedito, Farol de Ajuruteua, Rio Caeté, Centro Histórico de Bragança/PA, polo gastronômico da farinha de Bragança, peixe frito com açaí, etc.) e JAMAIS atrações de Bragança em Portugal (como Castelo de Bragança).
   - Se for "Santiago" no Chile, não sugira atividades de Santiago de Compostela na Espanha.
   - Se for "Córdoba" na Argentina, não sugira atrações de Córdoba na Espanha.
3. Todas as atrações (place), descrições (description), locais (location) e referências culinárias/culturais DEVEM pertencer estritamente à cidade e ao estado/país triangulados ("${fullLocation}").

Gere atividades (1 a 3 por dia) e estime o orçamento em R$ para cada uma delas. Estime um budget total razoável.

Retorne ESTRITAMENTE um JSON válido com a seguinte estrutura (sem textos explicativos ao redor, apenas o JSON):
{
  "budget": 2500,
  "itinerary": [
    {
      "id": "item-1",
      "day": 1,
      "time": "09:00",
      "place": "Nome Real da Atração Local",
      "description": "Descrição envolvente do que ver e fazer aqui nesta cidade/estado específico.",
      "location": "Bairro / Endereço / Referência na cidade triangulada",
      "category": "activity",
      "done": false,
      "cost": 50
    }
  ]
}
Responda em Português.`;

      const data = await generateGeminiContentWithFallback(ai, prompt, {
        responseMimeType: 'application/json',
        temperature: 0.5,
      });
      res.json(cleanAndParseJSON(data));
    } catch (error: any) {
      console.warn('Gemini AI activities call failed, using fallback:', error?.message);
      const fallbackDays = Array.from({ length: Math.max(1, days) }, (_, i) => i + 1);
      const locDesc = [destination, state, country].filter(Boolean).join(', ');
      const fallback = {
        budget: Math.max(1000, days * 600),
        itinerary: fallbackDays.flatMap((d) => [
          {
            id: `item-${d}-1-${Date.now()}`,
            day: d,
            time: '09:30',
            place: `Passeio Principal Dia ${d} em ${destination}`,
            description: `Visita guiada pelos principais monumentos e atrações históricas de ${locDesc}.`,
            location: `Centro Histórico, ${destination}`,
            category: 'activity',
            done: false,
            cost: 150,
          },
          {
            id: `item-${d}-2-${Date.now()}`,
            day: d,
            time: '14:30',
            place: `Parque & Ponto Turístico de ${destination}`,
            description: `Caminhada panorâmica com ótimas oportunidades para fotos e compras de artesanato em ${destination}.`,
            location: destination,
            category: 'activity',
            done: false,
            cost: 80,
          },
          {
            id: `item-${d}-3-${Date.now()}`,
            day: d,
            time: '19:30',
            place: `Jantar Típico Gastronômico`,
            description: `Experiência culinária com pratos e sabores tradicionais da região de ${locDesc}.`,
            location: `Restaurante Tradicional, ${destination}`,
            category: 'food',
            done: false,
            cost: 120,
          },
        ]),
      };
      res.json(fallback);
    }
  });

  app.post('/api/place-search', async (req, res) => {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Busca vazia' });
    }

    try {
      const ai = getAI();
      const prompt = `Busque informações turísticas sobre "${query}".
Retorne um JSON válido com a estrutura:
{
  "name": "Nome do Local",
  "city": "Cidade",
  "country": "País",
  "description": "Resumo de 2 frases sobre a importância do local",
  "lat": -22.9519,
  "lng": -43.2105,
  "suggestedRating": 4.8,
  "category": "Cultural"
}
Responda apenas com o JSON em Português.`;

      const text = await generateGeminiContentWithFallback(ai, prompt, {
        responseMimeType: 'application/json',
      });

      const parsedData = cleanAndParseJSON(text);
      res.json({ success: true, data: parsedData });
    } catch (error: any) {
      console.warn('Place search Gemini call failed or key not set, using fallback:', error?.message);
      res.json({
        success: true,
        data: {
          name: query,
          city: query,
          country: "Internacional",
          description: `Excelente destino turístico repleto de opções culturais, gastronômicas e pontos de interesse em ${query}.`,
          lat: -22.9068,
          lng: -43.1729,
          suggestedRating: 4.9,
          category: "Aventura"
        }
      });
    }
  });

  // Serve static assets directory
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
