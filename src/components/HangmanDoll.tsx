"use client";

import React from "react";

interface HangmanDollProps {
  dangerParts: number; // 0 to 6
  size?: number;
  className?: string;
  showLabels?: boolean;
}

export const HangmanDoll: React.FC<HangmanDollProps> = ({
  dangerParts,
  size = 280,
  className = "",
  showLabels = true,
}) => {
  const parts = Math.max(0, Math.min(6, dangerParts));
  const isSaved = parts === 0;
  const isDead = parts === 6;

  // Determine doll stroke color
  let dollColor = "#23395b"; // default navy
  if (isSaved) dollColor = "#218653"; // emerald green
  if (isDead) dollColor = "#c43d4d"; // alert red

  const gallowsColor = "#8c9ba5";

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 250 290"
        width={size}
        height={(size * 290) / 250}
        className="transition-all duration-500 ease-in-out drop-shadow-sm"
      >
        {/* Gallows structure (Base, Post, Beam, Rope) */}
        <g stroke={gallowsColor} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Base */}
          <path d="M20 265 H205" />
          {/* Vertical Post, Horizontal Beam, Rope drop */}
          <path d="M35 265 V25 H175 V55" />
          {/* Diagonal support bracket */}
          <path d="M35 70 L75 25" strokeWidth="4" />
        </g>

        {/* The Doll Body Parts (Animated in/out based on dangerParts) */}
        <g
          stroke={dollColor}
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="transition-colors duration-500"
        >
          {/* Part 1: Head (circle cx="175" cy="82" r="23") */}
          <circle
            cx="175"
            cy="82"
            r="23"
            fill={isSaved ? "#e8f7ee" : isDead ? "#fde8ea" : "#ffffff"}
            className={`transition-opacity duration-300 ${parts >= 1 ? "opacity-100" : "opacity-0"}`}
          />

          {/* Facial Features when head is visible */}
          {parts >= 1 && (
            <g>
              {isSaved ? (
                // Happy facial expression (Saved!)
                <>
                  {/* Happy curved eyes (arcs) */}
                  <path d="M166 76 Q169 72 172 76" stroke={dollColor} strokeWidth="2.5" fill="none" />
                  <path d="M178 76 Q181 72 184 76" stroke={dollColor} strokeWidth="2.5" fill="none" />
                  {/* Big smile: M164 88 Q175 100 186 88 */}
                  <path d="M164 88 Q175 100 186 88" stroke={dollColor} strokeWidth="3" fill="none" />
                </>
              ) : isDead ? (
                // Dead expression (X eyes, sad mouth)
                <>
                  {/* Left X eye */}
                  <path d="M166 74 L172 80 M172 74 L166 80" stroke={dollColor} strokeWidth="2.5" />
                  {/* Right X eye */}
                  <path d="M178 74 L184 80 M184 74 L178 80" stroke={dollColor} strokeWidth="2.5" />
                  {/* Wavy dead mouth */}
                  <path d="M166 93 Q175 87 184 93" stroke={dollColor} strokeWidth="2.5" fill="none" />
                </>
              ) : (
                // Normal / Concerned expression
                <>
                  <circle cx="168" cy="78" r="2.5" fill={dollColor} stroke="none" />
                  <circle cx="182" cy="78" r="2.5" fill={dollColor} stroke="none" />
                  <path d="M168 91 Q175 88 182 91" stroke={dollColor} strokeWidth="2" fill="none" />
                </>
              )}
            </g>
          )}

          {/* Part 2: Torso (path d="M175 105 V177") */}
          <path
            d="M175 105 V177"
            className={`transition-opacity duration-300 ${parts >= 2 ? "opacity-100" : "opacity-0"}`}
          />

          {/* Part 3: Left Arm (path d="M175 125 L140 155") */}
          <path
            d={isSaved ? "M175 125 L135 110" : "M175 125 L140 155"}
            className={`transition-all duration-300 ${parts >= 3 ? "opacity-100" : "opacity-0"}`}
          />

          {/* Part 4: Right Arm (path d="M175 125 L210 155") */}
          <path
            d={isSaved ? "M175 125 L215 110" : "M175 125 L210 155"}
            className={`transition-all duration-300 ${parts >= 4 ? "opacity-100" : "opacity-0"}`}
          />

          {/* Part 5: Left Leg (path d="M175 177 L145 220") */}
          <path
            d="M175 177 L145 220"
            className={`transition-opacity duration-300 ${parts >= 5 ? "opacity-100" : "opacity-0"}`}
          />

          {/* Part 6: Right Leg (path d="M175 177 L205 220") */}
          <path
            d="M175 177 L205 220"
            className={`transition-opacity duration-300 ${parts >= 6 ? "opacity-100" : "opacity-0"}`}
          />
        </g>
      </svg>

      {/* Status Badges and Counter */}
      {showLabels && (
        <div className="mt-2 flex flex-col items-center gap-1.5 text-center">
          {isSaved ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#e8f7ee] text-[#218653] border border-[#a3e0be] animate-bounce">
              <span className="w-2 h-2 rounded-full bg-[#218653]" />
              ¡Lo salvaste! (0/6 piezas)
            </span>
          ) : isDead ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#fde8ea] text-[#c43d4d] border border-[#f5b3b9]">
              <span className="w-2 h-2 rounded-full bg-[#c43d4d]" />
              Muñeco ahorcado (6/6 piezas)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#eef4fa] text-[#23395b] border border-[#dce6ef]">
              Peligro: <span className="font-bold text-[#c43d4d]">{parts}</span> / 6 piezas
            </span>
          )}

          <div className="w-36 h-2 bg-[#e2ecf5] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isSaved ? "bg-[#218653]" : isDead ? "bg-[#c43d4d]" : "bg-[#f59e0b]"
              }`}
              style={{ width: `${(parts / 6) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
