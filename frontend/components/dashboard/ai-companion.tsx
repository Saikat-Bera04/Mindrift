"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Mic, MicOff, X, Sparkles } from "lucide-react";
import { motion, useMotionValue, useTransform } from "framer-motion";

export function AICompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // Parallax character effect
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useTransform(y, [-100, 100], [15, -15]);
  const rotateY = useTransform(x, [-100, 100], [-15, 15]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setIsAiSpeaking(true);
        setTimeout(() => setIsAiSpeaking(false), 3000);
      }, 2500);
    } else {
      setIsAiSpeaking(true);
      setTimeout(() => setIsAiSpeaking(false), 3000);
    }
  };

  return (
    <motion.div 
      className="fixed z-50 flex flex-col items-end gap-4"
      drag
      dragMomentum={false}
      initial={{ bottom: "1.5rem", right: "1.5rem" }}
      style={{ touchAction: "none" }}
    >
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-[320px] h-[480px] bg-panel border-2 border-[#ffffff] shadow-floating rounded-3xl flex flex-col overflow-hidden screw-corners relative cursor-auto"
          onPointerDownCapture={(e) => e.stopPropagation()} 
        >
          {/* Drag Handle Area */}
          <div className="absolute top-0 left-0 right-0 h-10 flex justify-center z-30 cursor-grab active:cursor-grabbing hover:bg-background/10 transition-colors">
            <div className="w-12 h-1.5 bg-muted-fg/40 rounded-full mt-3 shadow-recessed" />
          </div>

          <div 
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="flex-1 relative bg-gradient-to-b from-background to-panel flex items-center justify-center overflow-hidden"
            style={{ perspective: 1000 }}
          >
            {/* Ambient Background Glow */}
            <div className={`absolute inset-0 rounded-[30px] blur-3xl transition-all duration-300 ${
              isAiSpeaking ? 'bg-accent/30 scale-125 animate-pulse' : 
              isRecording ? 'bg-green-500/20 scale-110 animate-ping' : 
              'bg-transparent'
            }`} />

            <motion.div
              style={{ rotateX, rotateY, z: 100 }}
              className={`relative w-[220px] h-[260px] flex items-center justify-center rounded-[40px] border-[6px] shadow-floating overflow-hidden pointer-events-none select-none transition-colors duration-500 ${
                 isAiSpeaking ? 'border-accent shadow-[0_0_30px_rgba(255,71,87,0.4)]' : 'border-background/50'
              }`}
            >
              <Image 
                src="/ai_voice_avatar.png" 
                alt="Aura" 
                fill
                style={{ objectFit: 'cover' }}
                draggable="false"
                className={`scale-110 pointer-events-none transform transition-transform duration-[2s] ${
                  isAiSpeaking ? 'scale-125' : 'animate-[float_6s_ease-in-out_infinite]'
                }`}
              />
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] mix-blend-overlay z-10 pointer-events-none"></div>
            </motion.div>
          </div>
          
          {/* Status and Visualizer */}
          <div className="h-12 bg-panel/50 border-t border-muted-bg flex items-center justify-center gap-2">
            {(isRecording || isAiSpeaking) && (
               <div className="flex items-center gap-1">
                 {[...Array(6)].map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ height: "4px" }}
                     animate={{ height: isAiSpeaking ? ["4px", "24px", "8px", "32px", "4px"] : ["4px", "16px", "6px", "20px", "4px"] }}
                     transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", delay: i * 0.1 }}
                     className={`w-1.5 rounded-full ${isAiSpeaking ? 'bg-accent' : 'bg-green-500'}`}
                   />
                 ))}
               </div>
            )}
            {!(isRecording || isAiSpeaking) && (
              <span className="text-xs font-mono font-bold text-muted-fg uppercase tracking-widest">Standing By</span>
            )}
          </div>

          <div className="p-4 border-t border-[#ffffff] bg-background flex flex-col items-center justify-center gap-3 pointer-events-auto">
            <button 
              onClick={toggleRecording}
              disabled={isAiSpeaking}
              className={`
                relative w-16 h-16 rounded-full flex items-center justify-center shadow-floating border-2 transition-all duration-300
                ${isRecording 
                  ? 'bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' 
                  : isAiSpeaking 
                    ? 'bg-muted-bg border-transparent text-muted-fg opacity-50 cursor-not-allowed'
                    : 'bg-panel border-accent text-accent hover:bg-accent hover:text-white hover:scale-105'
                }
              `}
            >
              {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping opacity-30"></div>
              )}
            </button>
            <p className="text-xs font-bold font-mono uppercase tracking-widest text-[#2d3436]">
               {isAiSpeaking ? 'Aura responding' : isRecording ? 'Listening...' : 'Voice mode'}
            </p>
          </div>
        </motion.div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-full bg-background border-2 border-[#ffffff] shadow-floating flex items-center justify-center text-accent transition-transform cursor-pointer hover:shadow-[0_4px_16px_rgba(255,71,87,0.4)] relative group"
        onPointerDownCapture={(e) => e.stopPropagation()} 
      >
        <div className="absolute inset-0 rounded-full border border-accent/20 bg-accent/5 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-300" />
        {isOpen ? <X className="w-7 h-7" /> : <Sparkles className="w-7 h-7 fill-current" />}
      </button>
    </motion.div>
  );
}
