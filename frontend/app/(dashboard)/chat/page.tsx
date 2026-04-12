"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { Mic, MicOff, Settings, Sparkles, Activity, AlertCircle } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useVoice } from "@/hooks/use-voice";

export default function VoiceCompanionPage() {
  const { 
    isRecording, 
    isAiSpeaking, 
    isProcessing,
    isSupported, 
    error, 
    messages,
    currentTranscript,
    toggleRecording,
    cancelSpeaking 
  } = useVoice({
    languageCode: "en-IN",
    voice: "EXAVITQu4vr4xnSDxMaL",
    onError: (err) => console.error("Voice error:", err),
  });
  
  // Parallax character effect
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-500, 500], [10, -10]);
  const rotateY = useTransform(mouseX, [-500, 500], [-10, 10]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(event.clientX - centerX);
    mouseY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // No simulation needed - real voice processing

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full gap-8 max-w-5xl mx-auto p-4 lg:p-8 animate-[fadeIn_0.5s_ease-out]">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Sparkles className="text-accent w-8 h-8" />
            Voice AI Companion
          </h1>
          <p className="text-muted-fg font-mono mt-2 uppercase tracking-wide">Interactive Voice Session</p>
        </div>
        <button className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-background border border-[#ffffff] shadow-floating hover:text-accent font-bold uppercase text-sm">
          <Settings className="w-4 h-4" /> Options
        </button>
      </div>

      {/* Main Interactive Stage */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="flex-1 w-full rounded-[40px] bg-background shadow-recessed border border-[#ffffff] flex flex-col items-center justify-center relative overflow-hidden screw-corners"
        style={{ perspective: 1200 }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-muted-bg/50 z-0"></div>

        {/* 3D Parallax Avatar */}
        <motion.div 
          style={{ rotateX, rotateY }}
          className="relative z-10 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] flex items-center justify-center"
        >
          {/* Audio reactive glow behind character */}
          <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-300 ${
            isAiSpeaking || isProcessing ? 'bg-accent/40 scale-150 animate-pulse' : 
            isRecording ? 'bg-green-500/30 scale-125 animate-ping' : 
            'bg-muted-fg/20 scale-100'
          }`} />

          <div className={`
            relative w-full h-full rounded-full border-8 shadow-floating overflow-hidden bg-gradient-to-br from-panel to-muted-bg flex items-center justify-center transition-all duration-500
            ${isAiSpeaking || isProcessing ? 'border-accent shadow-[0_0_40px_rgba(255,71,87,0.5)]' : 'border-background hover:scale-105 hover:border-accent/30'}
          `}>
             <Image 
                src="/ai_voice_avatar.png" 
                alt="Diva - Voice AI Companion" 
                fill
                style={{ objectFit: 'cover' }}
                className={`scale-110 object-top transition-transform duration-[2s] pointer-events-none ${isAiSpeaking || isProcessing ? 'scale-125' : ''}`}
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] mix-blend-overlay pointer-events-none z-20"></div>
          </div>
        </motion.div>

        {/* Status Indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-md shadow-floating border border-[#ffffff] z-20">
          <div className={`w-3 h-3 rounded-full ${
            isAiSpeaking || isProcessing ? 'bg-accent animate-ping' : 
            isRecording ? 'bg-green-500 animate-pulse' : 
            error ? 'bg-red-500' :
            'bg-muted-fg'
          }`} />
          <span className="font-mono font-bold uppercase text-sm tracking-widest">
            {isAiSpeaking ? 'Diva is Speaking...' : isProcessing ? 'Processing...' : isRecording ? 'Listening...' : error ? 'Error' : 'Standing By'}
          </span>
        </div>

        {/* Dynamic Voice Visualizer Wave */}
        {(isRecording || isAiSpeaking || isProcessing) && (
          <div className="absolute bottom-40 w-64 h-16 flex items-center justify-center gap-2 z-10 p-4">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: "4px" }}
                animate={{ height: isAiSpeaking || isProcessing ? ["4px", "40px", "12px", "60px", "4px"] : ["4px", "24px", "8px", "32px", "4px"] }}
                transition={{ 
                  duration: isAiSpeaking || isProcessing ? 0.3 : 0.5, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.1 
                }}
                className={`w-2 rounded-full ${isAiSpeaking || isProcessing ? 'bg-accent' : 'bg-green-500'}`}
              />
            ))}
          </div>
        )}

        {/* Transcript Display */}
        {currentTranscript && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-32 w-80 max-w-full px-4">
            <div className="bg-background/90 backdrop-blur-md rounded-2xl p-4 shadow-floating border border-[#ffffff]">
              <p className="text-xs font-mono text-muted-fg uppercase tracking-wide mb-1">You said:</p>
              <p className="text-sm text-foreground">{currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {(error || !isSupported) && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 mt-32 w-80 max-w-full px-4">
            <div className="bg-red-50 rounded-2xl p-4 shadow-floating border border-red-100 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">Voice Error</p>
                <p className="text-xs text-red-600 mt-1">
                  {!isSupported ? "Your browser doesn't support voice recording. Please use Chrome or Edge." : error?.message}
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Voice Controls */}
      <div className="h-32 shrink-0 rounded-[30px] bg-background shadow-floating border border-[#ffffff] flex items-center justify-center screw-corners gap-8">
        
        <button 
          onClick={toggleRecording}
          disabled={isAiSpeaking || isProcessing || !isSupported}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center shadow-floating border-2 transition-all duration-300
            ${isRecording 
              ? 'bg-red-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110' 
              : isAiSpeaking || isProcessing
                ? 'bg-muted-bg border-transparent text-muted-fg opacity-50 cursor-not-allowed'
                : !isSupported
                  ? 'bg-muted-bg border-transparent text-muted-fg opacity-50 cursor-not-allowed'
                  : 'bg-background border-accent text-accent hover:bg-accent hover:text-white hover:scale-105'
            }
          `}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : isProcessing ? <Sparkles className="w-8 h-8 animate-pulse" /> : <Mic className="w-8 h-8" />}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></div>
          )}
        </button>

        <div className="flex flex-col gap-1 items-start text-left">
          <p className="text-lg font-bold tracking-tight text-foreground">
            {isRecording ? "Tap to Stop" : isProcessing ? "Processing..." : "Tap to Speak"}
          </p>
          <p className="text-sm font-mono text-muted-fg uppercase tracking-wide">
             {isAiSpeaking ? "Diva is responding..." : isProcessing ? "Sarvam AI processing..." : "End-to-End Encrypted Voice"}
          </p>
        </div>

      </div>

    </div>
  );
}
