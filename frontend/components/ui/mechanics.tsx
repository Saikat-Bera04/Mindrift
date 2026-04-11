"use client";

import React, { HTMLAttributes } from "react";

interface MechanicalCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  withScrews?: boolean;
  withVents?: boolean;
}

export function MechanicalCard({ 
  elevated = false, 
  withScrews = true, 
  withVents = false,
  className = "", 
  children, 
  ...props 
}: MechanicalCardProps) {
  return (
    <div 
      className={`
        relative rounded-2xl bg-background
        ${elevated ? 'shadow-floating hover:-translate-y-1' : 'shadow-card hover:-translate-y-1 hover:shadow-floating'}
        transition-all duration-300 ease-out
        ${withScrews ? 'screw-corners' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Vents (top right) */}
      {withVents && (
        <div className="absolute top-4 right-4 flex gap-1 pointer-events-none">
          <div className="h-6 w-1 rounded-full bg-muted-bg shadow-recessed" />
          <div className="h-6 w-1 rounded-full bg-muted-bg shadow-recessed" />
          <div className="h-6 w-1 rounded-full bg-muted-bg shadow-recessed" />
        </div>
      )}
      
      {children}
    </div>
  );
}

export function PhysicalButton({ 
  variant = 'primary',
  className = "", 
  children, 
  ...props 
}: HTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  
  const baseClasses = "relative font-bold uppercase tracking-widest rounded-lg transition-all duration-150 active:translate-y-[2px] min-h-[48px] px-6 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-accent text-white shadow-[4px_4px_8px_rgba(166,50,60,0.4),-4px_-4px_8px_rgba(255,100,110,0.4)] active:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2)] border border-white/20 hover:brightness-110",
    secondary: "bg-background text-foreground shadow-card active:shadow-pressed hover:text-accent",
    ghost: "bg-transparent text-muted-fg hover:bg-muted-bg hover:shadow-recessed active:shadow-pressed"
  };

  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function RecessedInput({ className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input 
      className={`
        w-full h-14 px-6 rounded-lg bg-background shadow-recessed border-none
        font-mono text-foreground placeholder:text-muted-fg/50
        focus:outline-none focus-visible:shadow-[inset_4px_4px_8px_#babecc,inset_-4px_-4px_8px_#ffffff,0_0_0_2px_var(--accent)]
        ${className}
      `}
      {...props}
    />
  );
}
