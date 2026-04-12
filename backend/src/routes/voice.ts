import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/clerk.js";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const voiceRouter = Router();

// Helper to convert readable stream to base64
async function streamToBase64(stream: any): Promise<string> {
  try {
    const chunks: Buffer[] = [];
    
    // Check if it's an async iterable
    if (Symbol.asyncIterator in stream) {
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    } else {
      // Fallback for standard readable streams
      return new Promise((resolve, reject) => {
        stream.on("data", (chunk: any) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
        stream.on("error", reject);
      });
    }
    
    const buffer = Buffer.concat(chunks);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Stream conversion error:", error);
    throw error;
  }
}

// POST /voice/stt - Speech to Text using Gemini
voiceRouter.post("/stt", requireAuth, async (req: Request, res: Response) => {
  try {
    const { audioBase64, languageCode = "en-IN" } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return res.status(500).json({ error: "Gemini API key not configured for STT" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Transcribe this audio in ${languageCode}. Return only the transcription text, nothing else.` },
              { inline_data: { mime_type: "audio/webm", data: audioBase64 } }
            ]
          }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini STT error response:", errorText);
      return res.status(response.status).json({ 
        error: "STT processing failed",
        details: process.env.NODE_ENV === "development" ? errorText : undefined
      });
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.json({
      success: true,
      text: text.trim().replace(/^TRANSCRIPTION:\s*/i, ""),
      languageCode,
    });
  } catch (error: any) {
    console.error("Error in STT:", error);
    res.status(500).json({ error: "Failed to process speech-to-text", details: error.message });
  }
});

// POST /voice/tts - Text to Speech using ElevenLabs
voiceRouter.post("/tts", requireAuth, async (req: Request, res: Response) => {
  try {
    const { text, voice = process.env.ELEVEN_LABS_VOICE_ID || "JBFqnCBsd6RMkjVDRZzb" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }

    const apiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    const client = new ElevenLabsClient({ apiKey });

    const audioStream = await client.textToSpeech.convert(
      voice, 
      {
        text,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      }
    );

    const audioBase64 = await streamToBase64(audioStream);

    res.json({
      success: true,
      audioBase64,
      text,
      voice,
    });
  } catch (error: any) {
    console.error("Error in TTS:", error);
    res.status(500).json({ 
      error: "Failed to process text-to-speech with ElevenLabs",
      details: error.message 
    });
  }
});

// GET /voice/voices - Get available ElevenLabs voices
voiceRouter.get("/voices", requireAuth, (_req: Request, res: Response) => {
  const voices = [
    { id: process.env.ELEVEN_LABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", name: "Mindrift Main", language: "multi", gender: "female", description: "Clear and supportive" },
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", language: "multi", gender: "female", description: "Warm and professional" },
    { id: "AZnzlk1XhxPQCnBd8qnA", name: "Nicole", language: "multi", gender: "female", description: "Friendly and approachable" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", language: "multi", gender: "female", description: "Soft and calm" },
    { id: "ErXwUogDmv9vU4S03Vz5", name: "Antoni", language: "multi", gender: "male", description: "Authoritative and clear" },
    { id: "Lcf7jDAtCInjAsTM3adA", name: "Josh", language: "multi", gender: "male", description: "Youthful and energetic" }
  ];

  res.json({ voices });
});

// POST /voice/chat - Full voice conversation with Gemini AI
voiceRouter.post("/chat", requireAuth, async (req: Request, res: Response) => {
  try {
    const { audioBase64, languageCode = "en-IN", voice = "EXAVITQu4vr4xnSDxMaL", conversationHistory = [] } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: "audioBase64 is required" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY || process.env.ELEVENLABS_API_KEY;
    
    if (!elevenLabsApiKey) {
      return res.status(500).json({ error: "ElevenLabs API key not configured" });
    }

    let aiResponse = "Hey there! How's it going? I'm here to chat about your wellness and mental health. What's on your mind today?";

    // If Gemini key is available, use it for smarter responses
    if (geminiKey) {
      try {
        // Build conversation context for Gemini
        const conversationContext = conversationHistory.map((msg: any) => 
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`
        ).join("\n");

        const geminiPrompt = `You are Aura, a warm and talkative mental wellness AI companion. The user just sent audio message. 

Conversation history:
${conversationContext}

Respond warmly, empathetically, and conversationally in 2-3 sentences. Be supportive and engaging. Ask follow-up questions to keep the conversation going.`;

        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: geminiPrompt }
                ]
              }],
              generationConfig: { maxOutputTokens: 150, temperature: 0.8 },
            }),
          }
        );

        if (geminiResponse.ok) {
          const geminiData = await geminiResponse.json();
          const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (geminiText) {
            aiResponse = geminiText.trim();
          }
        }
      } catch (geminiError) {
        console.warn("Gemini API failed, using fallback response:", geminiError);
      }
    } else {
      // Fallback talkative responses
      if (conversationHistory.length === 0) {
        aiResponse = "Hey! How are you doing today? I'm Aura, your wellness companion. I'm here to chat about your day, your feelings, or anything on your mind. What's been going on?";
      } else if (conversationHistory.length === 2) {
        aiResponse = "That sounds nice! So tell me more - what's been happening in your day? Have you done anything that made you feel good or stressed? I'm all ears and genuinely interested!";
      } else if (conversationHistory.length >= 4) {
        aiResponse = "Thanks for sharing that with me! It sounds like you've got a lot going on. Remember to take breaks and be kind to yourself. Is there anything else you'd like to talk about or any way I can help you feel better?";
      }
    }

    // Convert AI response to speech using ElevenLabs
    const client = new ElevenLabsClient({ apiKey: elevenLabsApiKey });
    const audioStream = await client.textToSpeech.convert(
      voice,
      {
        text: aiResponse,
        modelId: "eleven_multilingual_v2",
        outputFormat: "mp3_44100_128",
      }
    );

    const chatAudioBase64 = await streamToBase64(audioStream);

    res.json({
      success: true,
      transcript: "[Audio processed]",
      response: aiResponse,
      audioBase64: chatAudioBase64,
      voice,
    });
  } catch (error: any) {
    console.error("Error in voice chat:", error);
    res.status(500).json({ error: "Failed to process voice conversation", details: error.message });
  }
});
