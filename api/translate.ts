import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in environment variables' });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are an expert Bangladeshi Bengali translator.
Translate the following text into natural, colloquial standard spoken Bangladeshi Bengali (চলিত প্রমিত বাংলা).
Return ONLY the translated Bengali text. Do not wrap in quotes or add notes.

Original text:
${text}`,
    });

    const translatedText = response.text?.trim() || text;
    return res.status(200).json({ translatedText });
  } catch (error: any) {
    console.error('Translation error on Vercel:', error);
    return res.status(500).json({ error: error.message || 'Failed to translate' });
  }
}
