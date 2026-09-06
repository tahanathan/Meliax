import re

with open("server.ts", "r") as f:
    content = f.read()

new_endpoint = """
  app.post('/api/generate-activities', async (req, res) => {
    const { destination, days = 3 } = req.body;
    if (!destination) {
      return res.status(400).json({ error: 'Destino é obrigatório' });
    }

    try {
      const ai = getAI();
      const prompt = `Você é um guia de viagens profissional e especialista em turismo mundial.
Apenas crie sugestões de atividades para um roteiro de viagem em "${destination}" que durará ${days} dias.
Gere atividades (1 a 3 por dia) e estime o orçamento em R$ para cada uma delas. Estime um budget total razoável.

Retorne ESTRITAMENTE um JSON válido com a seguinte estrutura (sem textos explicativos ao redor, apenas o JSON):
{
  "budget": 2500,
  "itinerary": [
    {
      "id": "item-1",
      "day": 1,
      "time": "09:00",
      "place": "Nome do Ponto Turístico Principal",
      "description": "Descrição envolvente do que ver e fazer aqui.",
      "done": false,
      "cost": 50
    }
  ]
}
Responda em Português.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });
      const data = response.text();
      res.json(JSON.parse(data || '{}'));
    } catch (error: any) {
      console.error('Erro na API /generate-activities:', error);
      res.status(500).json({ error: 'Falha ao gerar atividades.' });
    }
  });
"""

# Insert the new endpoint before the app.post('/api/place-search'...
content = content.replace("app.post('/api/place-search'", new_endpoint + "\n  app.post('/api/place-search'")

with open("server.ts", "w") as f:
    f.write(content)
