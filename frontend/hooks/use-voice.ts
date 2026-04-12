"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  voiceChat,
  speechToText,
  textToSpeech,
  audioBlobToBase64,
  playAudio,
  type VoiceChatResponse,
} from "@/lib/voice-service";
import { useAuth } from "@clerk/nextjs";

export type VoiceStatus =
  | "idle"
  | "recording"
  | "processing"
  | "ai-speaking"
  | "error";

export interface VoiceMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export interface UseVoiceOptions {
  languageCode?: string;
  voice?: string;
  onError?: (error: Error) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const { languageCode = "en-IN", voice = "meera", onError } = options;

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const { getToken } = useAuth();

  // Check for browser support
  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false);
      setError(new Error("Browser does not support audio recording"));
    }
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const err = new Error("Audio recording not supported in this browser");
      setError(err);
      onError?.(err);
      return;
    }

    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setStatus("processing");
        stream.getTracks().forEach((track) => track.stop());

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const audioBase64 = await audioBlobToBase64(audioBlob);

          const token = await getToken();
          // Call voice chat API (STT -> AI -> TTS)
          const result: VoiceChatResponse = await voiceChat(
            audioBase64,
            languageCode,
            voice,
            conversationHistoryRef.current,
            token
          );

          if (!result.success) {
            throw new Error("Voice chat processing failed");
          }

          // Add user message
          const userMessage: VoiceMessage = {
            id: crypto.randomUUID(),
            role: "user",
            text: result.transcript,
            timestamp: new Date(),
          };

          // Add AI message
          const aiMessage: VoiceMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            text: result.response,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, userMessage, aiMessage]);
          setCurrentTranscript(result.transcript);

          // Update conversation history
          conversationHistoryRef.current.push(
            { role: "user", content: result.transcript },
            { role: "assistant", content: result.response }
          );

          // Keep history manageable (last 10 exchanges)
          if (conversationHistoryRef.current.length > 20) {
            conversationHistoryRef.current = conversationHistoryRef.current.slice(-20);
          }

          // Play AI response audio
          if (result.audioBase64) {
            setStatus("ai-speaking");
            await playAudio(result.audioBase64);
            setStatus("idle");
          } else {
            setStatus("idle");
          }
        } catch (err) {
          const error = err instanceof Error ? err : new Error("Voice processing failed");
          setError(error);
          setStatus("error");
          onError?.(error);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setStatus("recording");
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start recording");
      setError(error);
      setStatus("error");
      onError?.(error);
    }
  }, [languageCode, voice, onError]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  /**
   * Toggle recording state
   */
  const toggleRecording = useCallback(() => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle" || status === "error") {
      startRecording();
    }
  }, [status, startRecording, stopRecording]);

  /**
   * Cancel current AI speaking
   */
  const cancelSpeaking = useCallback(() => {
    // Stop any ongoing audio playback by reloading the page's audio context
    // (This is a simple way to stop all audio)
    const sounds = document.querySelectorAll("audio");
    sounds.forEach((sound) => {
      sound.pause();
      sound.currentTime = 0;
    });
    setStatus("idle");
  }, []);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setMessages([]);
    conversationHistoryRef.current = [];
    setCurrentTranscript("");
    setStatus("idle");
    setError(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  const isRecording = status === "recording";
  const isAiSpeaking = status === "ai-speaking";
  const isProcessing = status === "processing";

  return {
    // State
    status,
    isRecording,
    isAiSpeaking,
    isProcessing,
    isSupported,
    error,
    messages,
    currentTranscript,

    // Actions
    startRecording,
    stopRecording,
    toggleRecording,
    cancelSpeaking,
    clearConversation,
  };
}
