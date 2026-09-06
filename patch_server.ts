function cleanAndParseJSON(text: string) {
  try {
    if (!text) return {};
    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        cleanText = match[1];
      }
    }
    return JSON.parse(cleanText);
  } catch (e: any) {
    throw new Error(`Failed to parse JSON: ${e.message}\nText was: ${text.substring(0, 100)}...`);
  }
}
