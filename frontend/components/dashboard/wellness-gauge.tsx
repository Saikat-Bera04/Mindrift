"use client";

import { useEffect, useState } from "react";

interface WellnessGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

export function WellnessGauge({ score, size = 260, label = "SYSTEM SCORE" }: WellnessGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = score / 60;
    const timer = setInterval(() => {
      current += step;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const center = size / 2;
  const radius = (size - 40) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const tickCount = 48;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981'; // Green for ok
    if (s >= 50) return '#f59e0b'; // Amber for warning
    if (s >= 25) return '#f97316'; // Orange
    return '#ff4757'; // Signature Accent red for critical
  };

  const mainColor = getColor(score);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-background rounded-full shadow-recessed relative" style={{ width: size + 40, height: size + 40 }}>
      {/* Outer raised ring */}
      <div className="absolute inset-0 m-4 rounded-full shadow-card pointer-events-none" />

      <div className="relative z-10" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <filter id="gauge-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Inner mechanical shadow */}
            <filter id="inner-shadow">
              <feOffset dx="2" dy="2" />
              <feGaussianBlur stdDeviation="3" result="offset-blur" />
              <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
              <feFlood floodColor="black" floodOpacity="0.15" result="color" />
              <feComposite operator="in" in="color" in2="inverse" result="shadow" />
              <feComposite operator="over" in="shadow" in2="SourceGraphic" />
            </filter>
          </defs>

          {/* Deep Groove track */}
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="16" />

          {/* Tick marks - Physical tick marks in groove */}
          {Array.from({ length: tickCount }).map((_, i) => {
            const angle = (i / tickCount) * 360 - 90;
            const rad = (angle * Math.PI) / 180;
            const isLong = i % 4 === 0;
            const innerR = radius - (isLong ? 12 : 8);
            const outerR = radius + (isLong ? 12 : 8);
            const isActive = (i / tickCount) * 100 <= animatedScore;
            return (
              <line
                key={i}
                x1={Number((center + innerR * Math.cos(rad)).toFixed(3))}
                y1={Number((center + innerR * Math.sin(rad)).toFixed(3))}
                x2={Number((center + outerR * Math.cos(rad)).toFixed(3))}
                y2={Number((center + outerR * Math.sin(rad)).toFixed(3))}
                stroke={isActive ? mainColor : 'rgba(0,0,0,0.1)'}
                strokeWidth={isLong ? 3 : 1.5}
                strokeLinecap="round"
                style={{ transition: 'stroke 0.3s ease' }}
              />
            );
          })}

          {/* Progress arc (LED style) */}
          <circle
            cx={center} cy={center} r={radius} fill="none"
            stroke={mainColor} strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            filter="url(#gauge-glow)"
          />

          {/* Center text module */}
          <circle cx={center} cy={center} r={radius - 24} fill="var(--background)" filter="url(#inner-shadow)" />
          
          <text x={center} y={center + 8} textAnchor="middle" fill="#2d3436"
            fontFamily="var(--font-jetbrains), monospace" fontSize="56" fontWeight="800" filter="drop-shadow(0 1px 0px #ffffff)">
            {animatedScore}
          </text>
          <text x={center} y={center + 32} textAnchor="middle" fill="#4a5568"
            fontFamily="var(--font-mono), monospace" fontSize="10" fontWeight="700" letterSpacing="0.1em">
            {label}
          </text>
        </svg>
      </div>
    </div>
  );
}
