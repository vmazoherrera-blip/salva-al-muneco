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
          ctx.fillStyle = "#090d16";
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
        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 border border-slate-700 text-sm"
      >
        <Download className="w-4 h-4 text-emerald-400" />
        {downloading ? "Generando imagen..." : "Descargar Gráfico Oficial (PNG)"}
      </button>

      {/* The Printable Visual Chart Container */}
      <div
        ref={containerRef}
        id="podium-export-canvas"
        className="w-full max-w-3xl bg-slate-900/95 border-2 border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl text-slate-100 backdrop-blur-xl"
        style={{ backgroundColor: "#0b0f19" }}
      >
        {/* Header */}
        <div className="text-center pb-5 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800 text-xs font-bold tracking-wider uppercase mb-2">
            Resultados Oficiales • Sala #{roomCode}
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Salva al Muñeco: Matrices y Transformaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ranking final por supervivencia, aciertos y velocidad de cálculo
          </p>
        </div>

        {/* 1st Place Spotlight Hero Card */}
        {firstPlace && (
          <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-xl shadow-amber-950/30 relative overflow-hidden">
            <div className="absolute -top-3 -right-3 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-950/50">
                  <Crown className="w-9 h-9" />
                </div>
                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black tracking-wide uppercase">
                      1º Lugar • Campeón
                    </span>
                    {firstPlace.danger_parts === 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold">
                        ¡Muñeco Salvado!
                      </span>
                    ) : firstPlace.danger_parts < 6 ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-bold">
                        Sobreviviente
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 text-xs font-bold">
                        Eliminado
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">{firstPlace.nickname}</h3>
                  <p className="text-xs text-slate-400">
                    Velocidad promedio: <span className="font-semibold text-slate-200">{getAvgSpeedSec(firstPlace)}s</span> por
                    pregunta
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="px-3.5 py-2 bg-slate-950/90 rounded-xl border border-amber-500/30 text-center shadow-sm">
                  <span className="block text-2xl font-black text-amber-400">
                    {firstPlace.score}
                    <span className="text-xs font-normal text-slate-400"> pts</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Puntaje
                  </span>
                </div>
                <div className="px-3.5 py-2 bg-slate-950/90 rounded-xl border border-emerald-500/30 text-center shadow-sm">
                  <span className="block text-2xl font-black text-emerald-400">
                    {firstPlace.correct_count}
                    <span className="text-xs font-normal text-slate-400">/10</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Aciertos
                  </span>
                </div>
                <div className="px-3.5 py-2 bg-slate-950/90 rounded-xl border border-slate-700 text-center shadow-sm">
                  <span className="block text-2xl font-black text-slate-200">
                    {(firstPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Tiempo
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stepped Podium (Top 3) */}
        <div className="my-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-5">
            Podio de Honor
          </h4>

          <div className="flex items-end justify-center gap-2.5 sm:gap-6 pt-4 pb-2">
            {/* 2nd Place (Silver - Left) */}
            <div className="flex-1 max-w-[110px] sm:max-w-[170px] flex flex-col items-center">
              {secondPlace ? (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-700 border border-slate-500 text-slate-200 flex items-center justify-center font-bold text-sm shadow-md mb-2">
                    <Medal className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[100px] sm:max-w-[140px] text-center">
                    {secondPlace.nickname}
                  </span>
                  <span className="text-[11px] sm:text-xs text-emerald-400 font-bold">
                    {secondPlace.score} pts • {secondPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(secondPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-24 mt-2 rounded-t-2xl bg-gradient-to-b from-slate-400 to-slate-600 flex flex-col items-center justify-center text-slate-950 font-black text-2xl shadow-inner border-t-2 border-slate-300">
                    2
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Plata</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-24 rounded-t-2xl bg-slate-950/60 border-dashed border-2 border-slate-800" />
              )}
            </div>

            {/* 1st Place (Gold - Center) */}
            <div className="flex-1 max-w-[125px] sm:max-w-[190px] flex flex-col items-center -mt-4 sm:-mt-6">
              {firstPlace ? (
                <>
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-lg shadow-amber-950/50 ring-4 ring-amber-500/30 mb-2">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <span className="font-black text-xs sm:text-base text-white truncate max-w-[115px] sm:max-w-[160px] text-center">
                    {firstPlace.nickname}
                  </span>
                  <span className="text-[11px] sm:text-xs text-amber-400 font-bold">
                    {firstPlace.score} pts • {firstPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(firstPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-32 mt-2 rounded-t-2xl bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] flex flex-col items-center justify-center text-slate-950 font-black text-3xl shadow-inner border-t-2 border-amber-200">
                    1
                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">Oro</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* 3rd Place (Bronze - Right) */}
            <div className="flex-1 max-w-[110px] sm:max-w-[170px] flex flex-col items-center">
              {thirdPlace ? (
                <>
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-800 border border-amber-600 text-amber-200 flex items-center justify-center font-bold text-sm shadow-md mb-2">
                    <Medal className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[100px] sm:max-w-[140px] text-center">
                    {thirdPlace.nickname}
                  </span>
                  <span className="text-[11px] sm:text-xs text-emerald-400 font-bold">
                    {thirdPlace.score} pts • {thirdPlace.correct_count}/10
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {(thirdPlace.total_time_ms / 1000).toFixed(1)}s
                  </span>
                  <div className="w-full h-16 mt-2 rounded-t-2xl bg-gradient-to-b from-[#d97706] to-[#92400e] flex flex-col items-center justify-center text-white font-black text-xl shadow-inner border-t-2 border-amber-400">
                    3
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-90">Bronce</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-16 rounded-t-2xl bg-slate-950/60 border-dashed border-2 border-slate-800" />
              )}
            </div>
          </div>
        </div>

        {/* Horizontal Comparative Bar Chart for All Players */}
        <div className="mt-8 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Comparativa de Rendimiento ({leaderboard.length} Jugadores)
            </h4>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Aciertos (/10)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Tiempo total
              </span>
            </div>
          </div>

          {/* Bar rows */}
          <div className="space-y-2.5">
            {leaderboard.map((player) => {
              const correctPct = (player.correct_count / 10) * 100;
              const isDead = player.status === "eliminado" || player.danger_parts >= 6;
              const isSaved = player.danger_parts === 0;

              return (
                <div
                  key={player.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col gap-1.5 transition-colors"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-bold text-slate-500">#{player.rank}</span>
                      <span className="font-bold text-white">{player.nickname}</span>
                      {isSaved ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Salvado
                        </span>
                      ) : isDead ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-400 bg-rose-950/70 border border-rose-500/30 px-1.5 py-0.5 rounded">
                          <XCircle className="w-3 h-3" /> Eliminado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-400 bg-blue-950/70 border border-blue-500/30 px-1.5 py-0.5 rounded">
                          Vivo ({player.danger_parts}/6)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="font-extrabold text-white">{player.score} pts</span>
                      <span className="text-emerald-400 font-bold text-xs">{player.correct_count} / 10</span>
                      <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        {(player.total_time_ms / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar representation */}
                  <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isDead ? "bg-rose-500" : "bg-emerald-500"
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
        <div className="mt-8 pt-4 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-between">
          <span>Salva al Muñeco • Transformaciones Lineales</span>
          <span>Regla de desempate: 1º Supervivencia, 2º Aciertos, 3º Menor tiempo total</span>
        </div>
      </div>
    </div>
  );
};
