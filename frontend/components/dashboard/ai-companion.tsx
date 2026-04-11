"use client";

import { useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, ContactShadows, OrbitControls } from "@react-three/drei";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function PlaceholderBot() {
  const meshRef = useRef<any>(null);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t / 4) / 4;
      meshRef.current.position.y = (1 + Math.sin(t / 1.5)) / 10;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.5, 1, 4, 16]} />
        <meshStandardMaterial color="#ff4757" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.2, 0.8, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.2, 0.8, 0.5]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}

export function AICompanion() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'bot', text: string}[]>([
    { role: 'bot', text: 'Hi! I am your AI companion.' }
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: 'I am here to guide you through your Santulan journey!' }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[320px] h-[480px] bg-panel border border-border/20 shadow-floating rounded-2xl flex flex-col overflow-hidden">
          <div className="h-[200px] relative bg-gradient-to-b from-background to-panel border-b border-muted-bg">
            <Canvas camera={{ position: [0, 0, 4], fov: 40 }}>
              <ambientLight intensity={0.5} />
              <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
              <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <PlaceholderBot />
              </Float>
              <ContactShadows position={[0, -0.5, 0]} opacity={0.5} scale={5} blur={2} far={2} />
              <Environment preset="city" />
              <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2} minPolarAngle={Math.PI / 2} />
            </Canvas>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-panel/50">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2.5 rounded-xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-background border border-[#ffffff] text-foreground rounded-bl-none shadow-recessed'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-muted-bg bg-background flex gap-2">
            <Input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Talk to me..." 
              className="bg-panel border-[#ffffff]" 
            />
            <Button size="icon" onClick={handleSend} className="bg-accent hover:bg-accent/90 shrink-0 shadow-floating">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-background border-2 border-accent shadow-[0_4px_12px_rgba(255,71,87,0.3)] flex items-center justify-center text-accent hover:scale-105 transition-transform"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 fill-current" />}
      </button>
    </div>
  );
}
