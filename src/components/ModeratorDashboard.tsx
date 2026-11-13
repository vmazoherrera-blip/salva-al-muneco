"use client";

import React, { useState } from "react";
import {
  Room,
  Player,
  LeaderboardEntry,
  RoomEvent,
  ModeratorStats,
} from "@/lib/supabase/types";
import {
  Users,
  Activity,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  StopCircle,
  UserX,
  Search,
  Sparkles,
  TrendingUp,
  Clock,
  Radio,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";

interface ModeratorDashboardProps {
  room: Room;
  leaderboard: LeaderboardEntry[];
  events: RoomEvent[];
  stats?: ModeratorStats;
  hostToken: string;
  onRefresh: () => void;
  onStartGame?: () => void;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  room,
  leaderboard,
  events,
  stats,
  hostToken,
  onRefresh,
  onStartGame,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"live_feed" | "students" | "charts">("live_feed");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Manage room action (kick or finish)
  const handleRoomAction = async (action: "kick" | "finish", targetPlayerId?: string) => {
    if (action === "finish" && !confirm("¿Seguro que deseas dar por concluida la partida para todos los alumnos?")) {
      return;
    }
    if (action === "kick" && !confirm("¿Deseas expulsar a este jugador de la sala?")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/rooms/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: room.code,
          hostToken,
          action,
          targetPlayerId,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error || "No se pudo realizar la acción");
      } else {
        onRefresh();
      }
    } catch (e: any) {
      alert(e.message || "Error de red");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter events
  const filteredEvents = events.filter((ev) => {
    if (eventFilter === "answers_correct") return ev.type === "answer_correct" || ev.type === "saved";
    if (eventFilter === "answers_wrong") return ev.type === "answer_wrong" || ev.type === "eliminated";
    if (eventFilter === "connections") return ev.type === "join" || ev.type === "reconnect" || ev.type === "kicked";
    return true;
  });

  // Filter students
  const filteredStudents = leaderboard.filter((p) =>
    p.nickname.toLowerCase().includes(searchStudent.toLowerCase())
  );

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-[#23395b]">
      {/* Top Banner: Moderator Controls & Status */}
      <div className="bg-[#ffffff] border-2 border-[#23395b]/20 rounded-3xl p-5 sm:p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#23395b] text-white flex items-center justify-center shadow-md">
            <Radio className="w-6 h-6 animate-pulse text-[#218653]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#23395b] text-white tracking-wider uppercase">
                Panel del Moderador / Docente
              </span>
              <span className="text-xs font-bold text-[#64748b]">Sala #{room.code}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#23395b] mt-0.5">
              Supervisión en Vivo del Aula
            </h2>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-[#dce6ef] hover:bg-[#eef4fa] text-[#23395b] transition-all"
            title="Refrescar estado"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {room.status === "waiting" && onStartGame && (
            <button
              onClick={onStartGame}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Partida
            </button>
          )}

          {room.status === "playing" && (
            <button
              onClick={() => handleRoomAction("finish")}
              disabled={actionLoading}
              className="px-4 py-2.5 rounded-xl bg-[#c43d4d] hover:bg-[#a82d3c] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Finalizar Partida para Todos
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#23395b]">{stats?.totalPlayers ?? leaderboard.length}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Total Alumnos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#218653]">
            {stats?.survivedCount ?? leaderboard.filter((p) => p.danger_parts === 0).length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#218653]">¡Muñeco Salvado!</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#f59e0b]">
            {stats?.inProgressCount ??
              leaderboard.filter((p) => p.danger_parts > 0 && p.danger_parts < 6 && p.status !== "eliminado").length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#d97706]">En Riesgo (1-5)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#c43d4d]">
            {stats?.eliminatedCount ??
              leaderboard.filter((p) => p.danger_parts >= 6 || p.status === "eliminado").length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#c43d4d]">Ahorcados (6)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#23395b]">{stats?.averageScore ?? 0}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Puntos Promedio</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#dce6ef] shadow-xs text-center">
          <span className="block text-2xl font-black text-[#23395b]">
            {stats ? (stats.averageTimeMs / 1000).toFixed(1) : "0.0"}s
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Tiempo Promedio</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#dce6ef] gap-2">
        <button
          onClick={() => setActiveTab("live_feed")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "live_feed"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Activity className="w-4 h-4 text-[#218653]" />
          Registro en Vivo (Entradas, Aciertos y Fallos)
          <span className="px-2 py-0.5 rounded-full bg-[#eef4fa] text-xs font-mono text-[#23395b]">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "students"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Users className="w-4 h-4 text-[#23395b]" />
          Alumnos en la Sala ({leaderboard.length})
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === "charts"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#f59e0b]" />
          Gráficas de Rendimiento por Pregunta
        </button>
      </div>

      {/* TAB 1: LIVE FEED (WHO ENTERS, WHO EXITS, WHO ANSWERS CORRECT/WRONG) */}
      {activeTab === "live_feed" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-[#e2ecf5]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Filtrar por:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "Todos los eventos" },
                  { id: "answers_correct", label: "Solo Aciertos" },
                  { id: "answers_wrong", label: "Solo Fallos" },
                  { id: "connections", label: "Entradas / Salidas" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setEventFilter(f.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      eventFilter === f.id
                        ? "bg-[#23395b] text-white shadow-xs"
                        : "bg-[#eef4fa] text-[#64748b] hover:bg-[#e2ecf5]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-[#94a3b8] font-medium">Actualización automática cada 2s</span>
          </div>

          {/* Event Stream */}
          {filteredEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#94a3b8]">
              No hay eventos registrados en este filtro todavía.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {filteredEvents.map((ev) => {
                const timeStr = new Date(ev.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                });

                let badgeColor = "bg-[#f1f5f9] text-[#475569] border-[#cbd5e1]";
                let icon = <Activity className="w-4 h-4" />;

                if (ev.type === "answer_correct") {
                  badgeColor = "bg-[#e8f7ee] text-[#218653] border-[#a3e0be]";
                  icon = <CheckCircle2 className="w-4 h-4 text-[#218653]" />;
                } else if (ev.type === "saved") {
                  badgeColor = "bg-[#e8f7ee] text-[#218653] border-[#218653]";
                  icon = <Sparkles className="w-4 h-4 text-[#218653]" />;
                } else if (ev.type === "answer_wrong") {
                  badgeColor = "bg-[#fde8ea] text-[#c43d4d] border-[#f5b3b9]";
                  icon = <XCircle className="w-4 h-4 text-[#c43d4d]" />;
                } else if (ev.type === "eliminated") {
                  badgeColor = "bg-[#7f1d1d] text-white border-black";
                  icon = <AlertTriangle className="w-4 h-4 text-white" />;
                } else if (ev.type === "join") {
                  badgeColor = "bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]";
                  icon = <LogIn className="w-4 h-4 text-[#2563eb]" />;
                } else if (ev.type === "reconnect") {
                  badgeColor = "bg-[#fefce8] text-[#ca8a04] border-[#fef08a]";
                  icon = <RefreshCw className="w-4 h-4 text-[#ca8a04]" />;
                } else if (ev.type === "kicked") {
                  badgeColor = "bg-[#fef2f2] text-[#991b1b] border-[#fecaca]";
                  icon = <UserX className="w-4 h-4 text-[#991b1b]" />;
                }

                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-colors ${badgeColor}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="shrink-0">{icon}</span>
                      <span className="font-semibold text-sm">{ev.message}</span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] opacity-80 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{timeStr}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STUDENTS ROSTER & INDIVIDUAL STATUS */}
      {activeTab === "students" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-[#e2ecf5]">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-[#94a3b8]" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Buscar alumno por nombre..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8fafc] border border-[#dce6ef] text-xs font-semibold text-[#23395b] outline-none focus:border-[#23395b]"
              />
            </div>
            <span className="text-xs text-[#64748b]">Total: {filteredStudents.length}</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e2ecf5] text-[#64748b] font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Posición</th>
                  <th className="py-3 px-3">Alumno</th>
                  <th className="py-3 px-3">Estado Muñeco</th>
                  <th className="py-3 px-3">Progreso</th>
                  <th className="py-3 px-3 text-center">Aciertos</th>
                  <th className="py-3 px-3 text-center">Fallos</th>
                  <th className="py-3 px-3 text-center">Puntos</th>
                  <th className="py-3 px-3 text-center">Tiempo Total</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredStudents.map((s) => {
                  const isDead = s.status === "eliminado" || s.danger_parts >= 6;
                  const isSaved = s.danger_parts === 0;

                  return (
                    <tr key={s.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-3 font-bold text-[#64748b]">#{s.rank}</td>
                      <td className="py-3 px-3 font-bold text-[#1e293b]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.is_connected ? "bg-[#218653]" : "bg-[#94a3b8]"
                            }`}
                          />
                          <span>{s.nickname}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {isSaved ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#218653] bg-[#e8f7ee] px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" /> Salvado (0/6)
                          </span>
                        ) : isDead ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c43d4d] bg-[#fde8ea] px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Ahorcado (6/6)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#d97706] bg-[#fef3c7] px-2 py-0.5 rounded-full">
                            Peligro: {s.danger_parts}/6
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-[#475569]">
                        Pregunta {Math.min(10, s.current_question_index + 1)} / 10
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-[#218653]">{s.correct_count}</td>
                      <td className="py-3 px-3 text-center font-bold text-[#c43d4d]">{s.wrong_count}</td>
                      <td className="py-3 px-3 text-center font-black text-[#23395b]">{s.score}</td>
                      <td className="py-3 px-3 text-center font-mono text-[#64748b]">
                        {(s.total_time_ms / 1000).toFixed(1)}s
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRoomAction("kick", s.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-[#fde8ea] hover:bg-[#fbd5d9] text-[#c43d4d] font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <UserX className="w-3 h-3" />
                          Expulsar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHARTS & DIFFICULTY BY QUESTION */}
      {activeTab === "charts" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#23395b]">
              Distribución de Dificultad y Aciertos por Pregunta (1 a 10)
            </h3>
            <p className="text-xs text-[#64748b]">
              Permite identificar cuáles transformaciones lineales representaron mayor reto para el grupo
            </p>
          </div>

          <div className="space-y-4">
            {(stats?.questionStats || []).map((q) => {
              const topicName = [
                "1. Reflexión X/Y y Escalamiento simple",
                "2. Multiplicación Matriz × Vector",
                "3. Reflexión de Vector (Componente)",
                "4. Escalamiento No Uniforme",
                "5. Rotaciones Notables (90°, 180°, 270°)",
                "6. Determinante de Matriz 2×2",
                "7. Imagen Vectorial T(v)",
                "8. Composición de Matrices B · A",
                "9. Vectores Canónicos y Matriz Asociada",
                "10. Problema Integrador Geométrico",
              ][q.questionIndex];

              return (
                <div key={q.questionIndex} className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0]">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-[#1e293b]">{topicName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[#218653]">✓ {q.correctCount} aciertos</span>
                      <span className="text-[#c43d4d]">✗ {q.wrongCount} fallos</span>
                      <span className="px-2 py-0.5 rounded bg-[#eef4fa] font-mono text-[#23395b]">
                        {q.accuracyPct}% éxito
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar (Green vs Red) */}
                  <div className="w-full h-3 bg-[#e2ecf5] rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-[#218653] transition-all duration-500"
                      style={{ width: `${q.accuracyPct}%` }}
                    />
                    <div
                      className="h-full bg-[#c43d4d] transition-all duration-500"
                      style={{ width: `${100 - q.accuracyPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
