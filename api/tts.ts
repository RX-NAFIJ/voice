import { GoogleGenAI } from '@google/genai';

async function generateWithRetry(fn: () => Promise<any>, retries = 2, delayMs = 600): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    if (
      retries > 0 &&
      (err.status === 503 ||
        err.message?.includes('503') ||
        err.message?.includes('demand') ||
        err.status === 429)
    ) {
      await new Promise((r) => setTimeout(r, delayMs));
      return generateWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(500).json({
        error: 'Vercel-এ GEMINI_API_KEY পাওয়া যায়নি! অনুগ্রহ করে Vercel Settings > Environment Variables-এ গিয়ে GEMINI_API_KEY যুক্ত করুন।',
      });
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
    const {
      text,
      voiceId = 'male',
      voiceName = 'Fenrir',
      emotion = 'normal',
      language = 'bn',
      autoTranslate = false,
      customPromptStyle,
    } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for speech synthesis' });
    }

    let spokenText = text.trim();
    let wasTranslated = false;

    // Check if autoTranslate to Bengali is requested
    const hasEnglish = /[a-zA-Z]/.test(spokenText);
    if (autoTranslate && language === 'bn' && hasEnglish) {
      try {
        const transRes = await generateWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: `Translate the following English or Banglish message into natural, modern standard Bangladeshi Bengali spoken text.
Return ONLY the clean Bengali translation without quotes:
${spokenText}`,
          })
        );
        const translated = transRes.text?.trim();
        if (translated) {
          spokenText = translated;
          wasTranslated = true;
        }
      } catch (transErr) {
        console.warn('Auto-translate failed, using original text:', transErr);
      }
    }

    const emotionStyles: Record<string, string> = {
      normal: 'natural, calm, conversational tone with balanced cadence',
      happy: 'cheerful, smiling, joyful, uplifting and warm tone with vibrant rhythm',
      sad: 'soft, melancholic, reflective, gentle and emotionally moving tone',
      angry: 'firm, intense, serious, authoritative and assertive tone',
      excited: 'energetic, enthusiastic, dynamic, upbeat and thrilled tone',
    };

    const baseVoicePersonas: Record<string, string> = {
      male: 'Natural mature Bangladeshi male voice. Confident, articulate, warm and trustworthy broadcaster tone.',
      female: 'Natural mature Bangladeshi female voice. Melodious, clear, engaging and warm tone.',
      cute_girl: 'Sweet, youthful, charming and cute Bangladeshi young female voice. Cheerful, friendly and gentle.',
      deep_voice: 'Deep resonant baritone Bangladeshi male voice. Authoritative, rich, calm, cinematic and powerful.',
    };

    const chosenEmotionDesc = emotionStyles[emotion] || emotionStyles.normal;
    const chosenVoicePersona = baseVoicePersonas[voiceId] || baseVoicePersonas.male;

    const styleInstruction = customPromptStyle
      ? `${customPromptStyle}. Delivered ${chosenEmotionDesc}. Clear authentic pronunciation.`
      : `${chosenVoicePersona} Speak in authentic Bangladeshi Bengali phonetics, delivered ${chosenEmotionDesc}.`;

    const validPrebuiltVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    let selectedVoice = voiceName;
    if (!validPrebuiltVoices.includes(selectedVoice)) {
      if (voiceId === 'female') selectedVoice = 'Kore';
      else if (voiceId === 'cute_girl') selectedVoice = 'Zephyr';
      else if (voiceId === 'deep_voice') selectedVoice = 'Charon';
      else selectedVoice = 'Fenrir';
    }

    // Call Gemini 3.8 Flash Lite TTS
    const ttsResponse = await generateWithRetry(() =>
      ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spokenText,
                speechMetadata: {
                  style: styleInstruction,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      })
    );

    const candidate = ttsResponse.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData?.data);
    const audioBase64 = audioPart?.inlineData?.data;

    if (!audioBase64) {
      throw new Error('No audio data received from Gemini TTS model');
    }

    return res.status(200).json({
      audioBase64,
      mimeType: audioPart?.inlineData?.mimeType || 'audio/wav',
      spokenText,
      wasTranslated,
      voiceUsed: selectedVoice,
      emotion,
    });
  } catch (error: any) {
    console.error('Vercel TTS error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate speech on Vercel',
      details: error.toString(),
    });
  }
}
