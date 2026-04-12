import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/clerk.js";

export const voiceRouter = Router();

const SARVAM_API_BASE = "https://api.sarvam.ai";

// GET /voice/health - Health check for Sarvam API
voiceRouter.get("/health", (_req: Request, res: Response) => {
  const apiKey = process.env.SARVAM_API_KEY;
  res.json({
    status: "ok",
    sarvam: {
      configured: !!apiKey,
      keyLength: apiKey?.length || 0,
    },
    gemini: {
      configured: !!process.env.GEMINI_API_KEY,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /voice/stt - Speech to Text using Sarvam AI
voiceRouter.post("/stt", requireAuth, async (req: Request, res: Response) => {
  try {
    const { audioBase64, languageCode = "en-IN" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Sarvam API key not configured" });
    }

    // Validate and clean base64
    if (!audioBase64 || typeof audioBase64 !== "string") {
      return res.status(400).json({ error: "Invalid audioBase64 format" });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[\w.-]+;(?:codecs=[^;]+;)?base64,/, "");
    
    // Normalize language code (Sarvam might use different format)
    const normalizedLanguageCode = languageCode.split("-")[0] || "en";

    console.log(`STT request: language=${normalizedLanguageCode}, audio_size=${cleanBase64.length} bytes`);

    const response = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": apiKey,
      },
      body: JSON.stringify({
        audio: cleanBase64,
        language_code: normalizedLanguageCode,
        model: "saarika:v2",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const statusCode = response.status;
      console.error(`Sarvam STT error (${statusCode}):`, errorText);
      return res.status(response.status).json({ 
        error: "STT processing failed", 
        status: statusCode,
        details: errorText.substring(0, 500) // Limit error text
      });
    }

    const data = await response.json();
    res.json({
      success: true,
      text: data.transcript || data.text || "",
      languageCode,
    });
  } catch (error) {
    console.error("Error in STT:", error);
    res.status(500).json({ 
      error: "Failed to process speech-to-text",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// POST /voice/tts - Text to Speech using Sarvam AI
voiceRouter.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, languageCode = "en-IN", voice = "meera" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Sarvam API key not configured" });
    }

    const normalizedLanguageCode = languageCode.split("-")[0] || "en";

    console.log(`TTS request: text_length=${text.length}, voice=${voice}, language=${normalizedLanguageCode}`);

    const response = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": apiKey,
      },
      body: JSON.stringify({
        text,
        target_language_code: normalizedLanguageCode,
        speaker: voice,
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const statusCode = response.status;
      console.error(`Sarvam TTS error (${statusCode}):`, errorText);
      return res.status(response.status).json({ 
        error: "TTS processing failed", 
        status: statusCode,
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    
    // Sarvam returns audio as base64 encoded string
    res.json({
      success: true,
      audioBase64: data.audios?.[0] || data.audio || "",
      languageCode,
      voice,
      text,
    });
  } catch (error) {
    console.error("Error in TTS:", error);
    res.status(500).json({ 
      error: "Failed to process text-to-speech",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /voice/voices - Get available voices
voiceRouter.get("/voices", requireAuth, (_req: Request, res: Response) => {
  const voices = [
    { id: "meera", name: "Meera", language: "hi-IN", gender: "female", description: "Warm and friendly" },
    { id: "pavithra", name: "Pavithra", language: "ta-IN", gender: "female", description: "Soft and clear" },
    { id: "mukesh", name: "Mukesh", language: "hi-IN", gender: "male", description: "Professional and authoritative" },
    { id: "arjun", name: "Arjun", language: "hi-IN", gender: "male", description: "Youthful and energetic" },
    { id: "arvind", name: "Arvind", language: "ta-IN", gender: "male", description: "Calm and composed" },
    { id: "amol", name: "Amol", language: "mr-IN", gender: "male", description: "Friendly and approachable" },
    { id: "amartya", name: "Amartya", language: "bn-IN", gender: "male", description: "Scholarly and articulate" },
    { id: "diya", name: "Diya", language: "gu-IN", gender: "female", description: "Cheerful and lively" },
  ];

  res.json({ voices });
});

// POST /voice/chat - Full voice conversation (STT -> AI -> TTS)
voiceRouter.post("/chat", requireAuth, async (req: Request, res: Response) => {
  try {
    const { audioBase64, languageCode = "en-IN", voice = "meera", conversationHistory = [] } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Sarvam API key not configured" });
    }

    const cleanBase64 = audioBase64.replace(/^data:audio\/[\w.-]+;(?:codecs=[^;]+;)?base64,/, "");
    const normalizedLanguageCode = languageCode.split("-")[0] || "en";

    // Step 1: Convert speech to text
    const sttResponse = await fetch(`${SARVAM_API_BASE}/speech-to-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": apiKey,
      },
      body: JSON.stringify({
        audio: cleanBase64,
        language_code: normalizedLanguageCode,
        model: "saarika:v2",
      }),
    });

    if (!sttResponse.ok) {
      const errorText = await sttResponse.text();
      console.error("Sarvam STT error:", errorText);
      return res.status(sttResponse.status).json({ error: "Speech recognition failed" });
    }

    const sttData = await sttResponse.json();
    const userText = sttData.transcript || sttData.text || "";

    if (!userText.trim()) {
      return res.status(400).json({ error: "No speech detected" });
    }

    // Step 2: Get AI response (using Gemini or fallback)
    let aiResponse = "";
    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (geminiKey) {
      try {
        // Build conversation context for Gemini
        const systemPrompt = "You are Aura, a compassionate mental wellness AI companion. Provide supportive, empathetic responses. Keep responses concise (2-3 sentences) for voice interaction.";
        
        // Convert conversation history to Gemini format (proper format with system instruction)
        const geminiContents = [
          ...conversationHistory.flatMap((msg: any) => [
            { role: msg.role === "assistant" ? "model" : "user", parts: [{ text: msg.content }] }
          ]),
          { role: "user", parts: [{ text: userText }] }
        ];

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: systemPrompt }],
              },
              contents: geminiContents,
              generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7,
              },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!aiResponse.trim()) {
            console.warn("Empty response from Gemini API");
          }
        } else {
          const errorText = await geminiResponse.text();
          console.error("Gemini API error:", errorText);
          throw new Error(`Gemini API error: ${errorText}`);
        }
      } catch (aiError) {
        console.error("AI response error:", aiError);
      }
    }

    // Fallback response if AI fails
    if (!aiResponse) {
      aiResponse = "I'm here to support you. Thank you for sharing that with me. Would you like to talk more about how you're feeling?";
    }

    // Step 3: Convert AI response to speech
    const ttsResponse = await fetch(`${SARVAM_API_BASE}/text-to-speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "API-Subscription-Key": apiKey,
      },
      body: JSON.stringify({
        text: aiResponse,
        target_language_code: normalizedLanguageCode,
        speaker: voice,
        pitch: 0,
        pace: 1.0,
        loudness: 1.0,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v1",
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("Sarvam TTS error:", errorText);
      return res.status(ttsResponse.status).json({ 
        error: "Text-to-speech failed",
        text: aiResponse,
        transcript: userText,
      });
    }

    const ttsData = await ttsResponse.json();

    res.json({
      success: true,
      transcript: userText,
      response: aiResponse,
      audioBase64: ttsData.audios?.[0] || ttsData.audio || "",
      languageCode,
      voice,
    });
  } catch (error) {
    console.error("Error in voice chat:", error);
    res.status(500).json({ error: "Failed to process voice conversation" });
  }
});
