import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function segregateBrowserHistory(events: any[]) {
  if (!genAI) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const eventsSummary = events.map(e => ({
    type: e.type,
    category: e.category,
    payload: e.payload,
    time: new Date(e.occurredAt).toISOString(),
  }));

  const prompt = `
You are an AI wellness and productivity assistant. 
Review the following raw extension events from a user's recent browser activity over the last 1 hour.

Raw Data Summary:
${JSON.stringify(eventsSummary, null, 2)}

Your task is to segregate and summarize these into cohesive "Activity" logs AND generate "Insights".
Specifically, identify patterns such as:
1. **Academic/Study**: Research, educational sites, university portals.
2. **Stress-Inducing**: Excessive news, high-pressure work, social media arguments.
3. **Sadness/Low Mood**: Somber music, searching for mental health resources, doomscrolling.
4. **Productivity**: Coding, writing, specialized tools.
5. **Relaxation**: Games, light entertainment, mindfulness apps.

Generate ONLY a valid JSON object with exact keys:
{
  "activities": [
    {
      "type": "productivity" | "entertainment" | "education" | "social" | "health" | "stress" | "sad" | "other",
      "title": "Short descriptive title of the session",
      "duration": number (estimated minutes),
      "notes": "A brief objective summary exploring the user's focus and probable emotional state.",
      "intensity": "low" | "medium" | "high"
    }
  ],
  "insights": [
    {
      "type": "mood_pattern" | "health_recommendation" | "technical_insight",
      "title": "Short catchy title",
      "content": "Actionable, helpful AI insight string."
    }
  ]
}
No markdown wrapping, just the raw JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Clean up potential markdown formatting from Gemini
    const cleanJson = text.replace(/```json/gi, "").replace(/```/gi, "").trim();
    const parsed = JSON.parse(cleanJson);
    return {
      activities: Array.isArray(parsed?.activities) ? parsed.activities : [],
      insights: Array.isArray(parsed?.insights) ? parsed.insights : []
    };
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    return { activities: [], insights: [] };
  }
}
