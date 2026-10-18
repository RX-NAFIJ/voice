export default function handler(req: any, res: any) {
  res.status(200).json({
    status: 'ok',
    message: 'RX NAFIJ AI VOICE API is operational',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
}
