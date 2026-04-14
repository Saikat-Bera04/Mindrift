"use client";

import { useEffect, useState } from "react";
import { MechanicalCard } from "@/components/ui/mechanics";
import { Phone, ExternalLink, Shield, Info } from "lucide-react";

interface Helpline {
  name: string;
  number: string;
  category: string;
  description: string;
  hours: string;
  region: string;
}

export function SupportResources() {
  const [helplines, setHelplines] = useState<Helpline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHelplines = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/support/helplines`);
        if (res.ok) {
          const data = await res.json();
          setHelplines(data.helplines);
        }
      } catch (error) {
        console.error("Failed to fetch helplines:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHelplines();
  }, []);

  if (loading) {
    return (
      <MechanicalCard className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted-bg rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-12 bg-muted-bg rounded"></div>
            <div className="h-12 bg-muted-bg rounded"></div>
          </div>
        </div>
      </MechanicalCard>
    );
  }

  return (
    <MechanicalCard className="p-6 h-full" withScrews>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
        <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" /> Support Resources
        </h3>
        <span className="text-[10px] text-muted-fg font-mono font-bold px-2 py-0.5 rounded shadow-recessed">
          VERIFIED
        </span>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl mb-4">
          <p className="text-[10px] font-mono text-accent font-bold uppercase tracking-wider flex items-center gap-2 mb-1">
            <Info className="w-3 h-3" /> Quick Tip
          </p>
          <p className="text-xs text-muted-fg">
            If you're feeling overwhelmed, reaching out is the first step towards feeling better. These services are confidential and free.
          </p>
        </div>

        {helplines.map((help, index) => (
          <div 
            key={index}
            className="group p-4 rounded-xl bg-background shadow-card border border-transparent hover:border-accent/20 hover:shadow-floating transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-foreground group-hover:text-accent transition-colors">{help.name}</h4>
                <p className="text-[10px] text-muted-fg font-mono uppercase tracking-wide">{help.region} • {help.hours}</p>
              </div>
              <a 
                href={`tel:${help.number.replace(/-/g, '')}`}
                className="w-8 h-8 rounded-full bg-background shadow-floating flex items-center justify-center text-accent hover:bg-accent hover:text-white transition-all"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
            <p className="text-xs text-muted-fg mb-3 line-clamp-2">{help.description}</p>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded shadow-recessed ${
                help.category === 'suicide' ? 'text-red-500 bg-red-500/5' : 'text-emerald-500 bg-emerald-500/5'
              }`}>
                {help.category}
              </span>
              <button className="text-[10px] font-mono font-bold text-muted-fg hover:text-accent flex items-center gap-1 uppercase tracking-widest">
                Details <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </MechanicalCard>
  );
}
