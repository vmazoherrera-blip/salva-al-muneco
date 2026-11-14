"use client";

import React, { useRef, useState } from "react";
import { LeaderboardEntry } from "@/lib/supabase/types";
import { Trophy, Medal, Crown, Download, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PodiumGraphicProps {
  leaderboard: LeaderboardEntry[];
  roomCode: string;
}

export const PodiumGraphic: React.FC<PodiumGraphicProps> = ({ leaderboard, roomCode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const firstPlace = leaderboard[0];
  const secondPlace = leaderboard[1];
  const thirdPlace = leaderboard[2];

  // Helper for export to PNG
  const handleDownloadPNG = async () => {
    if (!containerRef.current) return;
    setDownloading(true);

    try {
      // Use modern SVG foreignObject / canvas approach to render DOM as image
      const node = containerRef.current;
      const width = node.scrollWidth || 800;
      const height = node.scrollHeight || 1000;

      // Create an SVG with embedded HTML
      const clone = node.cloneNode(true) as HTMLElement;
      // Ensure all computed styles or inline styles work
      const htmlString = new XMLSerializer().serializeToString(clone);

      const svgString = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml">
              ${htmlString}
            </div>
          </foreignObject>
        </svg>
      `;

      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(blob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = width * 2; // high res
        canvas.height = height * 2;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = "#eef4fa";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0);

          const pngData = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `ganador-salva-al-muneco-${roomCode}.png`;
          link.href = pngData;
          link.click();
        }
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
      };

      image.onerror = () => {
        console.error("Canvas draw error, downloading SVG fallback");
        const link = document.createElement("a");
        link.download = `ganador-salva-al-muneco-${roomCode}.svg`;
        link.href = blobURL;
        link.click();
        setDownloading(false);
      };

      image.src = blobURL;
    } catch (e) {
      console.error("Failed to generate image:", e);
      setDownloading(false);
    }
  };

  const getAvgSpeedSec = (entry?: LeaderboardEntry) => {
    if (!entry) return "0.0";
    const answeredCount = entry.correct_count + entry.wrong_count || 1;
    const avgMs = entry.total_time_ms / answeredCount;
    return (avgMs / 1000).toFixed(1);
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Download Action Button */}
      <button
        onClick={handleDownloadPNG}
        disabled={downloading}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#23395b] hover:bg-[#1a2b45] text-white font-medium shadow-md transition-all active:scale-95 disabled:opacity-50"
      >
        <Download className="w-4 h-4" />
        {downloading ? "Generando imagen..." : "Descargar Gráfico Oficial (PNG)"}
      </button>

      {/* The Printable Visual Chart Container */}
      <div
        ref={containerRef}
        id="podium-export-canvas"
        className="w-full max-w-3xl bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-xl text-[#23395b]"
        style={{ backgroundColor: "#ffffff" }}
      >
        {/* Header */}
        <div className="text-center pb-6 border-b border-[#e2ecf5]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#eef4fa] text-[#23395b] text-xs font-bold tracking-wider uppercase mb-2">
            Resultados Oficiales • Sala #{roomCode}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#23395b]">
            Salva al Muñeco: Matrices y Transformaciones
          </h2>
          <p className="text-xs sm:text-sm text-[#5c7285] mt-1">
            Ranking final por supervivencia, aciertos y velocidad de cálculo
          </p>
        </div>

        {/* 1st Place Spotlight Hero Card */}
        {firstPlace && (
          <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#fef7e7] to-[#fffaf0] border-2 border-[#fcd34d] shadow-sm relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-24 h-24 bg-[#fbbf24]/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#fbbf24] flex items-center justify-center text-white shadow-md">
                  <Crown className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#f59e0b] text-white text-xs font-bold tracking-wide uppercase">
                      1º Lugar • Campeón
                    </span>
                    {firstPlace.danger_parts === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#218653] text-white text-xs font-bold">
                        ¡Muñeco Salvado!
                      </span>
                    ) : firstPlace.danger_parts < 6 ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#3b82f6] text-white text-xs font-bold">
                        Sobreviviente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#c43d4d] text-white text-xs font-bold">
                        Eliminado
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-[#1e293b] mt-1">{firstPlace.nickname}</h3>
                  <p className="text-xs text-[#64748b]">
                    Velocidad promedio: <span className="font-semibold">{getAvgSpeedSec(firstPlace)}s</span> por
                    pregunta
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-white rounded-xl border border-[#fde68a] text-center shadow-sm">
                  <span className="block text-2xl font-black text-[#23395b]">
                    {firstPlace.score}
                    <span className="text-xs font-normal text-[#64748b]"> pts</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Puntaje
                  </span>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-[#fde68a] text-center shadow-sm">
                  <span className="block text-2xl font-black text-[#218653]">
                    {firstPlace.correct_count}
                    <span className="text-xs font-normal text-[#64748b]">/10</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Aciertos
                  </span>
                </div>
                <div className="px-4 py-2 bg-white rounded-xl border border-[#fde68a] text-center shadow-sm">
                  <span className="block text-2xl font-black text-[#23395b]">
                    {(firstPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                    Tiempo Total
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepped Podium (Top 3) */}
        <div className="my-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b] text-center mb-6">
            Podio de Honor
          </h4>

          <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-2">
            {/* 2nd Place (Silver - Left) */}
            <div className="flex-1 max-w-[170px] flex flex-col items-center">
              {secondPlace ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#94a3b8] text-white flex items-center justify-center font-bold text-sm shadow-md mb-2">
                    <Medal className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-[#1e293b] truncate max-w-[130px] text-center">
                    {secondPlace.nickname}
                  </span>
                  <span className="text-xs text-[#218653] font-bold">
                    {secondPlace.score} pts • {secondPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    {(secondPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-24 mt-2 rounded-t-2xl bg-gradient-to-b from-[#cbd5e1] to-[#94a3b8] flex flex-col items-center justify-center text-white font-black text-2xl shadow-inner border-t-2 border-white">
                    2
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Plata</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-24 rounded-t-2xl bg-[#f1f5f9] border-dashed border-2 border-[#cbd5e1]" />
              )}
            </div>

            {/* 1st Place (Gold - Center) */}
            <div className="flex-1 max-w-[190px] flex flex-col items-center -mt-6">
              {firstPlace ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#f59e0b] text-white flex items-center justify-center font-black text-base shadow-lg ring-4 ring-[#fef3c7] mb-2">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="font-extrabold text-base text-[#1e293b] truncate max-w-[150px] text-center">
                    {firstPlace.nickname}
                  </span>
                  <span className="text-xs text-[#218653] font-bold">
                    {firstPlace.score} pts • {firstPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    {(firstPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-32 mt-2 rounded-t-2xl bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] flex flex-col items-center justify-center text-white font-black text-3xl shadow-inner border-t-2 border-white">
                    1
                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">Oro</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* 3rd Place (Bronze - Right) */}
            <div className="flex-1 max-w-[170px] flex flex-col items-center">
              {thirdPlace ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#b45309] text-white flex items-center justify-center font-bold text-sm shadow-md mb-2">
                    <Medal className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-sm text-[#1e293b] truncate max-w-[130px] text-center">
                    {thirdPlace.nickname}
                  </span>
                  <span className="text-xs text-[#218653] font-bold">
                    {thirdPlace.score} pts • {thirdPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-[#64748b]">
                    {(thirdPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-16 mt-2 rounded-t-2xl bg-gradient-to-b from-[#d97706] to-[#b45309] flex flex-col items-center justify-center text-white font-black text-xl shadow-inner border-t-2 border-white">
                    3
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Bronce</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-16 rounded-t-2xl bg-[#f1f5f9] border-dashed border-2 border-[#cbd5e1]" />
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Comparative Bar Chart for All Players */}
        <div className="mt-8 pt-6 border-t border-[#e2ecf5]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Comparativa de Rendimiento ({leaderboard.length} Jugadores)
            </h4>
            <div className="flex items-center gap-4 text-xs font-medium text-[#64748b]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#218653]" /> Aciertos (/10)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#23395b]" /> Tiempo total
              </span>
            </div>
          </div>

          {/* Bar rows */}
          <div className="space-y-3">
            {leaderboard.map((player) => {
              const correctPct = (player.correct_count / 10) * 100;
              const isDead = player.status === "eliminado" || player.danger_parts >= 6;
              const isSaved = player.danger_parts === 0;

              return (
                <div
                  key={player.id}
                  className="p-2.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex flex-col gap-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-[#64748b]">#{player.rank}</span>
                      <span className="font-bold text-[#1e293b]">{player.nickname}</span>
                      {isSaved ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#218653] bg-[#e8f7ee] px-1.5 py-0.2 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Salvado
                        </span>
                      ) : isDead ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#c43d4d] bg-[#fde8ea] px-1.5 py-0.2 rounded">
                          <XCircle className="w-3 h-3" /> Eliminado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#2563eb] bg-[#eff6ff] px-1.5 py-0.2 rounded">
                          Vivo ({player.danger_parts}/6)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-semibold text-[#334155]">
                      <span className="font-extrabold text-[#23395b]">{player.score} pts</span>
                      <span className="text-[#218653] font-bold text-xs">{player.correct_count} / 10</span>
                      <span className="inline-flex items-center gap-1 text-[#64748b] text-[11px]">
                        <Clock className="w-3 h-3" />
                        {(player.total_time_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar representation */}
                  <div className="w-full h-3 bg-[#e2ecf5] rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isDead ? "bg-[#c43d4d]" : "bg-[#218653]"
                      }`}
                      style={{ width: `${correctPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-4 border-t border-[#e2ecf5] text-center text-[10px] text-[#94a3b8] flex items-center justify-between">
          <span>Salva al Muñeco • Transformaciones Lineales</span>
          <span>Regla de desempate: 1º Supervivencia, 2º Aciertos, 3º Menor tiempo total</span>
        </div>
      </div>
    </div>
  );
};
