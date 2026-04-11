"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Mic, MicOff, Settings, Sparkles, Activity } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export default function VoiceCompanionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
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

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Simulate stopping after a while and AI speaking
      setTimeout(() => {
        setIsRecording(false);
        setIsAiSpeaking(true);
        setTimeout(() => setIsAiSpeaking(false), 4000);
      }, 3000);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 3000);
    }
  };

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
            isAiSpeaking ? 'bg-accent/40 scale-150 animate-pulse' : 
            isRecording ? 'bg-green-500/30 scale-125 animate-ping' : 
            'bg-muted-fg/20 scale-100'
          }`} />

          <div className={`
            relative w-full h-full rounded-full border-8 shadow-floating overflow-hidden bg-gradient-to-br from-panel to-muted-bg flex items-center justify-center transition-all duration-500
            ${isAiSpeaking ? 'border-accent shadow-[0_0_40px_rgba(255,71,87,0.5)]' : 'border-background hover:scale-105 hover:border-accent/30'}
          `}>
             <Image 
                src="/ai_voice_avatar.png" 
                alt="Voice AI Avatar" 
                fill
                style={{ objectFit: 'cover' }}
                className={`scale-110 object-top transition-transform duration-[2s] pointer-events-none ${isAiSpeaking ? 'scale-125' : ''}`}
                priority
              />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] mix-blend-overlay pointer-events-none z-20"></div>
          </div>
        </motion.div>

        {/* Status Indicator */}
        <div className="absolute top-8 right-8 flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-md shadow-floating border border-[#ffffff] z-20">
          <div className={`w-3 h-3 rounded-full ${
            isAiSpeaking ? 'bg-accent animate-ping' : 
            isRecording ? 'bg-green-500 animate-pulse' : 
            'bg-muted-fg'
          }`} />
          <span className="font-mono font-bold uppercase text-sm tracking-widest">
            {isAiSpeaking ? 'Aura is Speaking...' : isRecording ? 'Listening...' : 'Standing By'}
          </span>
        </div>

        {/* Dynamic Voice Visualizer Wave (mock) */}
        {(isRecording || isAiSpeaking) && (
          <div className="absolute bottom-40 w-64 h-16 flex items-center justify-center gap-2 z-10 p-4">
            {[...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ height: "4px" }}
                animate={{ height: isAiSpeaking ? ["4px", "40px", "12px", "60px", "4px"] : ["4px", "24px", "8px", "32px", "4px"] }}
                transition={{ 
                  duration: isAiSpeaking ? 0.3 : 0.5, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  delay: i * 0.1 
                }}
                className={`w-2 rounded-full ${isAiSpeaking ? 'bg-accent' : 'bg-green-500'}`}
              />
            ))}
          </div>
        )}

      </div>

      {/* Voice Controls */}
      <div className="h-32 shrink-0 rounded-[30px] bg-background shadow-floating border border-[#ffffff] flex items-center justify-center screw-corners gap-8">
        
        <button 
          onClick={toggleRecording}
          disabled={isAiSpeaking}
          className={`
            relative w-20 h-20 rounded-full flex items-center justify-center shadow-floating border-2 transition-all duration-300
            ${isRecording 
              ? 'bg-red-500 border-red-400 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] scale-110' 
              : isAiSpeaking 
                ? 'bg-muted-bg border-transparent text-muted-fg opacity-50 cursor-not-allowed'
                : 'bg-background border-accent text-accent hover:bg-accent hover:text-white hover:scale-105'
            }
          `}
        >
          {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-20"></div>
          )}
        </button>

        <div className="flex flex-col gap-1 items-start text-left">
          <p className="text-lg font-bold tracking-tight text-foreground">
            {isRecording ? "Tap to Stop" : "Tap to Speak"}
          </p>
          <p className="text-sm font-mono text-muted-fg uppercase tracking-wide">
             {isAiSpeaking ? "Aura is responding..." : "End-to-End Encrypted Voice"}
          </p>
        </div>

      </div>

    </div>
  );
}
