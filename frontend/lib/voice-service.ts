"use client";

import { getBackendOrigin } from "./backend-url";

const API_BASE = `${getBackendOrigin()}/voice`;

export interface VoiceChatResponse {
  success: boolean;
  transcript: string;
  response: string;
  audioBase64: string;
  languageCode: string;
  voice: string;
}

export interface STTResponse {
  success: boolean;
  text: string;
  languageCode: string;
}

export interface TTSResponse {
  success: boolean;
  audioBase64: string;
  languageCode: string;
  voice: string;
  text: string;
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: string;
  description: string;
}

/**
 * Get available voices from Sarvam AI
 */
export async function getVoices(token?: string | null): Promise<Voice[]> {
  const response = await fetch(`${API_BASE}/voices`, {
    headers: token ? { "Authorization": `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error("Failed to fetch voices");
  }

  const data = await response.json();
  return data.voices;
}

/**
 * Convert speech (audio base64) to text using Sarvam AI STT
 */
export async function speechToText(
  audioBase64: string,
  languageCode = "en-IN",
  token?: string | null
): Promise<STTResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/stt`, {
    method: "POST",
    headers,
    body: JSON.stringify({ audioBase64, languageCode }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`STT failed: ${error}`);
  }

  return response.json();
}

/**
 * Convert text to speech using Sarvam AI TTS
 */
export async function textToSpeech(
  text: string,
  languageCode = "en-IN",
  voice = "21m00Tcm4TlvDq8ikWAM",
  token?: string | null
): Promise<TTSResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/tts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, languageCode, voice }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS failed: ${error}`);
  }

  return response.json();
}

/**
 * Full voice conversation: STT -> AI -> TTS
 */
export async function voiceChat(
  audioBase64: string,
  languageCode = "en-IN",
  voice = "21m00Tcm4TlvDq8ikWAM",
  conversationHistory: Array<{ role: string; content: string }> = [],
  token?: string | null
): Promise<VoiceChatResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      audioBase64,
      languageCode,
      voice,
      conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voice chat failed: ${error}`);
  }

  return response.json();
}

/**
 * Convert audio blob to base64 string
 */
export function audioBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Play audio from base64 string
 */
export function playAudio(base64Audio: string, mimeType = "audio/mp3"): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
    audio.onended = () => resolve();
    audio.onerror = (err) => reject(err);
    audio.play();
  });
}
