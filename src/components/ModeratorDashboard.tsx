"use client";

import React, { useState, useEffect } from "react";
import {
  Room,
  LeaderboardEntry,
  RoomEvent,
  ModeratorStats,
} from "@/lib/supabase/types";
import { QuestionData } from "@/lib/math-engine/templates";
import { MathRenderer } from "./MathRenderer";
import { VisualOptionEditor } from "./VisualOptionEditor";
import { SymbolabPanel } from "./SymbolabPanel";
import {
  extractPromptMatrices,
  replacePromptMatrix,
  cleanLatexToNaturalText,
  buildMatrix2x2,
  buildVector2,
} from "@/lib/math-engine/visual-parser";
import {
  Users,
  Activity,
  BarChart3,
  CheckCircle2,
  XCircle,
  Play,
  StopCircle,
  UserX,
  Search,
  Radio,
  RefreshCw,
  BookOpen,
  Edit3,
  Shuffle,
  Save,
  Check,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface ModeratorDashboardProps {
  room: Room;
  leaderboard: LeaderboardEntry[];
  events: RoomEvent[];
  stats?: ModeratorStats;
  masterQuestions?: QuestionData[];
  hostToken: string;
  onRefresh: () => void;
  onStartGame?: () => void;
  onQuestionsUpdated?: (questions: QuestionData[]) => void;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  room,
  leaderboard,
  events,
  stats,
  masterQuestions = [],
  hostToken,
  onRefresh,
  onStartGame,
  onQuestionsUpdated,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<
    "live_feed" | "students" | "charts" | "solutions" | "customizer"
  >("live_feed");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [searchStudent, setSearchStudent] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Question editing state
  const hasInitializedRef = React.useRef(false);
  const isDirtyRef = React.useRef(false);

  const [localQuestions, setLocalQuestions] = useState<QuestionData[]>(() => {
    return (masterQuestions || []).map((q) => ({
      ...q,
      promptLatex: cleanLatexToNaturalText(q.promptLatex),
      explanationLatex: cleanLatexToNaturalText(q.explanationLatex),
    }));
  });
  const [selectedQIndex, setSelectedQIndex] = useState<number>(0);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [symbolabTarget, setSymbolabTarget] = useState<"prompt" | "explanation">("prompt");

  useEffect(() => {
    // Only initialize once when masterQuestions first loads, and NEVER overwrite if user has made edits
    if (!hasInitializedRef.current && masterQuestions && masterQuestions.length > 0) {
      hasInitializedRef.current = true;
      const cleaned = masterQuestions.map((q) => ({
        ...q,
        promptLatex: cleanLatexToNaturalText(q.promptLatex),
        explanationLatex: cleanLatexToNaturalText(q.explanationLatex),
      }));
      setLocalQuestions(cleaned);
    }
  }, [masterQuestions]);

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

  // Regenerate random questions from server
  const handleRegenerateQuestions = async () => {
    if (!confirm("¿Deseas generar un nuevo conjunto de 10 preguntas aleatorias de transformaciones lineales?")) {
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/rooms/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: room.code,
          hostToken,
          action: "regenerate",
        }),
      });
      const data = await res.json();
      if (data.success && data.questions) {
        const cleaned = data.questions.map((q: QuestionData) => ({
          ...q,
          promptLatex: cleanLatexToNaturalText(q.promptLatex),
          explanationLatex: cleanLatexToNaturalText(q.explanationLatex),
        }));
        isDirtyRef.current = false;
        setLocalQuestions(cleaned);
        if (onQuestionsUpdated) onQuestionsUpdated(cleaned);
        alert("¡Preguntas aleatorias generadas exitosamente!");
        onRefresh();
      } else {
        alert(data.error || "Error al regenerar preguntas");
      }
    } catch (e: any) {
      alert(e.message || "Error al comunicar con el servidor");
    } finally {
      setActionLoading(false);
    }
  };

  // Save custom edited questions
  const handleSaveCustomQuestions = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/rooms/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: room.code,
          hostToken,
          action: "set",
          questions: localQuestions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        isDirtyRef.current = false;
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (onQuestionsUpdated) onQuestionsUpdated(localQuestions);
        onRefresh();
      } else {
        alert(data.error || "Error al guardar preguntas personalizadas");
      }
    } catch (e: any) {
      alert(e.message || "Error al guardar preguntas");
    } finally {
      setActionLoading(false);
    }
  };

  // Update a field in the currently selected question
  const updateCurrentQuestion = (patch: Partial<QuestionData>) => {
    isDirtyRef.current = true;
    setLocalQuestions((prev) => {
      const copy = [...prev];
      if (copy[selectedQIndex]) {
        copy[selectedQIndex] = { ...copy[selectedQIndex], ...patch };
      }
      return copy;
    });
  };

  // Set a clean simple question template (e.g. 2+2)
  const handleLoadSimplePreset = () => {
    isDirtyRef.current = true;
    updateCurrentQuestion({
      promptLatex: "¿Cuánto es 2 + 2?",
      questionType: "multiple_choice",
      optionsLatex: ["4", "5", "3", "22"],
      correctAnswer: "4",
      explanationLatex: "2 + 2 es igual a 4.",
    });
  };

  // Clear current question to complete blank slate for total creative freedom
  const handleClearQuestion = () => {
    isDirtyRef.current = true;
    updateCurrentQuestion({
      promptLatex: "",
      questionType: "multiple_choice",
      optionsLatex: ["", "", "", ""],
      correctAnswer: "",
      explanationLatex: "",
    });
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

  const currentQ = localQuestions[selectedQIndex] || localQuestions[0];

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

          {room.status === "waiting" && (
            <>
              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2.5 rounded-xl border border-[#dce6ef] bg-[#f8fafc] hover:bg-[#eef4fa] text-[#23395b] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
                title="Generar 10 nuevas preguntas aleatorias"
              >
                <Shuffle className="w-4 h-4 text-[#218653]" />
                Aleatorias
              </button>

              <button
                onClick={() => setActiveTab("customizer")}
                className="px-3.5 py-2.5 rounded-xl border border-[#23395b]/20 bg-white hover:bg-[#eef4fa] text-[#23395b] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-[#23395b]" />
                Personalizar
              </button>

              {onStartGame && (
                <button
                  onClick={onStartGame}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Partida
                </button>
              )}
            </>
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
      <div className="flex border-b border-[#dce6ef] gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("live_feed")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "live_feed"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Activity className="w-4 h-4 text-[#218653]" />
          Registro en Vivo
          <span className="px-2 py-0.5 rounded-full bg-[#eef4fa] text-xs font-mono text-[#23395b]">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "students"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Users className="w-4 h-4 text-[#23395b]" />
          Alumnos ({leaderboard.length})
        </button>

        <button
          onClick={() => setActiveTab("solutions")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "solutions"
              ? "border-[#218653] text-[#218653]"
              : "border-transparent text-[#64748b] hover:text-[#218653]"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#218653]" />
          Solucionario y Respuestas (10)
        </button>

        <button
          onClick={() => setActiveTab("customizer")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "customizer"
              ? "border-[#23395b] text-[#23395b]"
              : "border-transparent text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Edit3 className="w-4 h-4 text-[#23395b]" />
          Diseñador de Preguntas
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "charts"
              ? "border-[#f59e0b] text-[#d97706]"
              : "border-transparent text-[#64748b] hover:text-[#f59e0b]"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-[#f59e0b]" />
          Gráficas de Rendimiento
        </button>
      </div>

      {/* TAB 1: LIVE FEED */}
      {activeTab === "live_feed" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
              Filtrar eventos por categoría
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: "all", label: "Todos los eventos" },
                { id: "answers_correct", label: "Aciertos y Salvados" },
                { id: "answers_wrong", label: "Fallos y Ahorcados" },
                { id: "connections", label: "Entradas / Salidas" },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setEventFilter(f.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                    eventFilter === f.id
                      ? "bg-[#23395b] text-white"
                      : "bg-[#f8fafc] text-[#64748b] hover:bg-[#eef4fa]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <p className="text-center py-10 text-sm text-[#64748b]">
                No hay eventos registrados en esta categoría aún.
              </p>
            ) : (
              filteredEvents.map((ev) => {
                const isCorrect = ev.type === "answer_correct" || ev.type === "saved";
                const isWrong = ev.type === "answer_wrong" || ev.type === "eliminated";
                const isJoin = ev.type === "join" || ev.type === "reconnect";

                return (
                  <div
                    key={ev.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
                      isCorrect
                        ? "bg-[#e8f5e9]/60 border-[#218653]/30"
                        : isWrong
                        ? "bg-[#fde8ea]/60 border-[#c43d4d]/30"
                        : isJoin
                        ? "bg-[#eef4fa] border-[#dce6ef]"
                        : "bg-white border-[#dce6ef]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-[#218653] shrink-0" />}
                      {isWrong && <XCircle className="w-4 h-4 text-[#c43d4d] shrink-0" />}
                      {isJoin && <Users className="w-4 h-4 text-[#23395b] shrink-0" />}
                      <span className="font-bold text-[#23395b]">{ev.nickname}:</span>
                      <span className="text-[#475569]">{ev.message}</span>
                    </div>
                    <span className="text-[11px] font-mono text-[#94a3b8] shrink-0">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STUDENTS ROSTER */}
      {activeTab === "students" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#f8fafc] border border-[#dce6ef] text-sm text-[#23395b] outline-none"
              />
            </div>
            <span className="text-xs font-bold text-[#64748b] shrink-0">
              {filteredStudents.length} de {leaderboard.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-[#dce6ef] text-[#64748b] font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Pos</th>
                  <th className="py-2.5 px-3">Alumno</th>
                  <th className="py-2.5 px-3">Estado Muñeco</th>
                  <th className="py-2.5 px-3">Progreso</th>
                  <th className="py-2.5 px-3 text-center">Aciertos</th>
                  <th className="py-2.5 px-3 text-center">Fallos</th>
                  <th className="py-2.5 px-3 text-center">Puntaje</th>
                  <th className="py-2.5 px-3 text-center">Tiempo</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredStudents.map((s, idx) => {
                  const isAlive = s.danger_parts < 6 && s.status !== "eliminado";
                  const isSaved = s.danger_parts === 0;

                  return (
                    <tr key={s.id} className="hover:bg-[#f8fafc] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#64748b]">#{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-[#23395b]">
                        {s.nickname}
                        {!s.is_connected && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-normal">
                            Desconectado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isSaved ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#e8f5e9] text-[#218653] font-bold text-xs inline-flex items-center gap-1">
                            ¡Salvado! (0 piezas)
                          </span>
                        ) : !isAlive ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#fde8ea] text-[#c43d4d] font-bold text-xs">
                            Ahorcado (6 piezas)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-[#fffbeb] text-[#d97706] font-bold text-xs">
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

      {/* TAB 3: SOLUCIONARIO Y RESPUESTAS (ANSWER KEY) */}
      {activeTab === "solutions" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e2ecf5]">
            <div>
              <h3 className="text-lg font-black text-[#23395b] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#218653]" />
                Solucionario Oficial y Respuestas Correctas
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Guía completa para el docente con todas las ecuaciones en KaTeX, respuestas correctas destacadas y desarrollo matemático paso a paso.
              </p>
            </div>
            {room.status === "waiting" && (
              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-[#23395b] text-white text-xs font-bold shadow-xs hover:bg-[#1b2c47] transition-all flex items-center gap-2"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#218653]" />
                Generar Otro Conjunto Aleatorio
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {localQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-[#f8fafc] border-2 border-[#dce6ef] hover:border-[#23395b]/30 transition-all flex flex-col gap-4"
              >
                {/* Header Question */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-[#23395b] text-white flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-[#23395b]">
                      Pregunta {idx + 1} de 10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        q.level === "basico"
                          ? "bg-blue-100 text-blue-800"
                          : q.level === "intermedio"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {q.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eef4fa] text-[#23395b]">
                      {q.questionType === "multiple_choice" ? "Opción Múltiple" : "Numérica"}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="p-4 rounded-xl bg-white border border-[#e2ecf5] text-sm text-[#23395b] leading-relaxed">
                  <MathRenderer latex={q.promptLatex} />
                </div>

                {/* Options / Correct Answer */}
                {q.questionType === "multiple_choice" && q.optionsLatex && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2">
                      Opciones presentadas a los alumnos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.optionsLatex.map((opt, optIdx) => {
                        const isCorrect = opt.trim() === q.correctAnswer.trim();
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border-2 flex items-center justify-between gap-3 text-sm transition-all ${
                              isCorrect
                                ? "bg-[#e8f5e9] border-[#218653] font-bold text-[#1a6e43] shadow-xs"
                                : "bg-white border-[#dce6ef] text-[#475569]"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-[#94a3b8]">
                                {String.fromCharCode(65 + optIdx)})
                              </span>
                              <MathRenderer latex={opt} />
                            </div>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-md bg-[#218653] text-white font-bold text-[11px] shrink-0 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Correcta
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {q.questionType === "numeric" && (
                  <div className="p-3.5 rounded-xl bg-[#e8f5e9] border-2 border-[#218653] flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1a6e43]">
                      Respuesta Numérica Correcta:
                    </span>
                    <span className="font-mono font-black text-lg text-[#1a6e43] px-3 py-1 bg-white rounded-lg border border-[#218653]/30">
                      <MathRenderer latex={q.correctAnswer} />
                    </span>
                  </div>
                )}

                {/* Mathematical Explanation */}
                <div className="p-4 rounded-xl bg-[#eef4fa] border border-[#dce6ef]">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#23395b] mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#218653]" />
                    Procedimiento y Justificación Paso a Paso:
                  </span>
                  <div className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                    <MathRenderer latex={q.explanationLatex} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: QUESTION CUSTOMIZER & CREATOR */}
      {activeTab === "customizer" && (
        <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e2ecf5]">
            <div>
              <h3 className="text-lg font-black text-[#23395b] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#23395b]" />
                Diseñador de Preguntas de la Partida
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Crea o modifica las preguntas, ecuaciones en LaTeX, alternativas y explicaciones que responderán los alumnos.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleLoadSimplePreset}
                className="px-3 py-2 rounded-xl bg-[#eef4fa] hover:bg-[#e2ecf5] text-xs font-bold text-[#23395b] flex items-center gap-1.5 transition-all shadow-xs"
                title="Cargar ejemplo simple tipo 2+2"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#218653]" />
                Plantilla Simple (2+2)
              </button>

              <button
                type="button"
                onClick={handleClearQuestion}
                className="px-3 py-2 rounded-xl border border-[#dce6ef] hover:bg-[#fff1f2] hover:border-[#fca5a5] text-xs font-bold text-[#64748b] hover:text-[#e11d48] flex items-center gap-1.5 transition-all"
                title="Borrar todo para escribir desde cero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hoja en Blanco
              </button>

              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl border border-[#dce6ef] hover:bg-[#eef4fa] text-xs font-bold text-[#23395b] flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5 text-[#218653]" />
                Regenerar Todas
              </button>

              <button
                onClick={handleSaveCustomQuestions}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                  saveSuccess
                    ? "bg-[#218653] text-white"
                    : "bg-[#23395b] hover:bg-[#1b2c47] text-white"
                }`}
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                {saveSuccess ? "¡Guardado!" : "Guardar Preguntas"}
              </button>
            </div>
          </div>

          {/* Question Index Selector (1 to 10) */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {localQuestions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedQIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  selectedQIndex === idx
                    ? "bg-[#23395b] text-white shadow-sm"
                    : "bg-[#f8fafc] border border-[#dce6ef] text-[#64748b] hover:bg-[#eef4fa]"
                }`}
              >
                Pregunta {idx + 1}
              </button>
            ))}
          </div>

          {/* Current Question Form */}
          {currentQ && (() => {
            const promptMatrices = extractPromptMatrices(currentQ.promptLatex);

            return (
              <div className="space-y-5">
                {/* Symbolab Virtual Math Panel */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#23395b] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#218653]" />
                      Panel Matemático Estilo Symbolab (Libertad Total de Redacción)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#64748b]">Insertar símbolos en:</span>
                      <div className="flex p-0.5 rounded-xl bg-[#e2ecf5] text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setSymbolabTarget("prompt")}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            symbolabTarget === "prompt"
                              ? "bg-white text-[#23395b] shadow-xs"
                              : "text-[#64748b] hover:text-[#23395b]"
                          }`}
                        >
                          Enunciado
                        </button>
                        <button
                          type="button"
                          onClick={() => setSymbolabTarget("explanation")}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            symbolabTarget === "explanation"
                              ? "bg-white text-[#23395b] shadow-xs"
                              : "text-[#64748b] hover:text-[#23395b]"
                          }`}
                        >
                          Explicación
                        </button>
                      </div>
                    </div>
                  </div>

                  <SymbolabPanel
                    onInsertText={(insertedText) => {
                      if (symbolabTarget === "prompt") {
                        updateCurrentQuestion({
                          promptLatex: (currentQ.promptLatex || "") + insertedText,
                        });
                      } else {
                        updateCurrentQuestion({
                          explanationLatex: (currentQ.explanationLatex || "") + insertedText,
                        });
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Form Fields */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          Nivel de Dificultad
                        </label>
                        <select
                          value={currentQ.level}
                          onChange={(e) =>
                            updateCurrentQuestion({ level: e.target.value as any })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#dce6ef] bg-[#f8fafc] text-xs font-bold text-[#23395b] outline-none"
                        >
                          <option value="basico">Básico (Preguntas 1-3)</option>
                          <option value="intermedio">Intermedio (Preguntas 4-7)</option>
                          <option value="avanzado">Avanzado (Preguntas 8-10)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1">
                          Tipo de Respuesta
                        </label>
                        <select
                          value={currentQ.questionType}
                          onChange={(e) =>
                            updateCurrentQuestion({
                              questionType: e.target.value as any,
                              optionsLatex:
                                e.target.value === "multiple_choice"
                                  ? currentQ.optionsLatex || [currentQ.correctAnswer, "0", "1", "-1"]
                                  : undefined,
                            })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-[#dce6ef] bg-[#f8fafc] text-xs font-bold text-[#23395b] outline-none"
                        >
                          <option value="multiple_choice">Selección Múltiple (4 opciones)</option>
                          <option value="numeric">Numérica / Fracción exacta</option>
                        </select>
                      </div>
                    </div>

                    {/* Prompt with Visual Matrix Grid Inspector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                          Enunciado de la Pregunta (Lenguaje Natural):
                        </label>
                        <span className="text-[11px] text-[#218653] font-semibold">
                          Escribe texto natural sin pensar en LaTeX
                        </span>
                      </div>

                      {/* Visual Matrix/Vector Inspector for Prompt */}
                      {promptMatrices.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border-2 border-[#86efac] space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-[#166534] flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#218653]" />
                              Matrices y Vectores del Enunciado (Edición Numérica Directa):
                            </span>
                            <span className="text-[11px] text-[#15803d] font-semibold">
                              Escribe solo números en las casillas
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 items-center">
                            {promptMatrices.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-white border border-[#bbf7d0] shadow-xs flex items-center gap-2"
                              >
                                <span className="font-mono font-bold text-xs text-[#166534] bg-[#dcfce7] px-2 py-1 rounded-md">
                                  {item.name}
                                </span>
                                <span className="text-sm font-bold text-[#64748b]">=</span>

                                {item.type === "matrix_2x2" && item.matrix && (
                                  <div className="flex items-center">
                                    <span className="text-3xl font-light text-[#64748b] select-none pl-0.5">⎛</span>
                                    <div className="grid grid-cols-2 gap-1 p-0.5">
                                      {(["a", "b", "c", "d"] as const).map((cell) => (
                                        <input
                                          key={cell}
                                          type="text"
                                          value={item.matrix![cell]}
                                          onChange={(e) => {
                                            const updated = { ...item.matrix!, [cell]: e.target.value };
                                            const newRaw = buildMatrix2x2(updated.a, updated.b, updated.c, updated.d);
                                            const newPrompt = replacePromptMatrix(currentQ.promptLatex, item.rawMatch, newRaw);
                                            updateCurrentQuestion({ promptLatex: newPrompt });
                                          }}
                                          className="w-11 h-7 text-center font-bold text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md text-[#23395b] focus:border-[#218653] outline-none"
                                        />
                                      ))}
                                    </div>
                                    <span className="text-3xl font-light text-[#64748b] select-none pr-0.5">⎞</span>
                                  </div>
                                )}

                                {item.type === "vector_2d" && item.vector && (
                                  <div className="flex items-center">
                                    <span className="text-3xl font-light text-[#64748b] select-none pl-0.5">⎛</span>
                                    <div className="grid grid-cols-1 gap-1 p-0.5">
                                      {(["x", "y"] as const).map((cell) => (
                                        <input
                                          key={cell}
                                          type="text"
                                          value={item.vector![cell]}
                                          onChange={(e) => {
                                            const updated = { ...item.vector!, [cell]: e.target.value };
                                            const newRaw = buildVector2(updated.x, updated.y);
                                            const newPrompt = replacePromptMatrix(currentQ.promptLatex, item.rawMatch, newRaw);
                                            updateCurrentQuestion({ promptLatex: newPrompt });
                                          }}
                                          className="w-11 h-7 text-center font-bold text-xs bg-[#f8fafc] border border-[#cbd5e1] rounded-md text-[#23395b] focus:border-[#218653] outline-none"
                                        />
                                      ))}
                                    </div>
                                    <span className="text-3xl font-light text-[#64748b] select-none pr-0.5">⎞</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={currentQ.promptLatex}
                        onChange={(e) => updateCurrentQuestion({ promptLatex: e.target.value })}
                        className="w-full p-3.5 rounded-xl border border-[#dce6ef] bg-[#f8fafc] text-sm text-[#23395b] outline-none focus:border-[#218653]"
                        placeholder="Escribe la pregunta en lenguaje natural (ej: ¿Cuánto es 2+2? o determina la rotación)..."
                      />
                    </div>

                    {/* Multiple Choice Options with Natural Visual Editors */}
                    {currentQ.questionType === "multiple_choice" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                            Opciones de Respuesta:
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-[#64748b]">Formato de las 4 opciones:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = ["4", "5", "3", "22"];
                                updateCurrentQuestion({
                                  optionsLatex: newOpts,
                                  correctAnswer: newOpts[0],
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#eef4fa] hover:bg-[#e2ecf5] text-[11px] font-bold text-[#23395b] transition-all shadow-xs"
                            >
                              Respuestas Simples (ej: 4)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = [
                                  "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}",
                                  "\\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}",
                                  "\\begin{pmatrix} -1 & 0 \\\\ 0 & 1 \\end{pmatrix}",
                                  "\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}",
                                ];
                                updateCurrentQuestion({
                                  optionsLatex: newOpts,
                                  correctAnswer: newOpts[0],
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#eef4fa] hover:bg-[#e2ecf5] text-[11px] font-bold text-[#23395b] transition-all shadow-xs"
                            >
                              Matrices 2×2
                            </button>
                          </div>
                        </div>

                        {(currentQ.optionsLatex || []).map((opt, optIdx) => {
                          const letter = String.fromCharCode(65 + optIdx);
                          const isCorrect = opt.trim() === currentQ.correctAnswer.trim();

                          return (
                            <VisualOptionEditor
                              key={optIdx}
                              letter={letter}
                              value={opt}
                              isCorrect={isCorrect}
                              onMarkCorrect={() => updateCurrentQuestion({ correctAnswer: opt })}
                              onChange={(newLatex) => {
                                const newOptions = [...(currentQ.optionsLatex || [])];
                                newOptions[optIdx] = newLatex;
                                updateCurrentQuestion({
                                  optionsLatex: newOptions,
                                  ...(isCorrect ? { correctAnswer: newLatex } : {}),
                                });
                              }}
                            />
                          );
                        })}
                      </div>
                    )}

                    {/* Numeric Correct Answer */}
                    {currentQ.questionType === "numeric" && (
                      <div className="p-4 rounded-2xl bg-[#e8f5e9]/50 border-2 border-[#218653] space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#1a6e43]">
                          Respuesta Numérica Correcta:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={currentQ.correctAnswer}
                            onChange={(e) => updateCurrentQuestion({ correctAnswer: e.target.value })}
                            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[#218653]/40 bg-white font-bold text-base text-[#1a6e43] outline-none shadow-xs"
                            placeholder="Ej: 5, -2 o 3/4"
                          />
                          <div className="px-3 py-2 rounded-xl bg-white border border-[#218653]/30 text-sm font-bold text-[#1a6e43]">
                            Vista: <MathRenderer latex={currentQ.correctAnswer} />
                          </div>
                        </div>
                        <p className="text-[11px] text-[#218653]">
                          Escribe directamente el número, negativo o fracción.
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b]">
                          Explicación y Justificación Paso a Paso:
                        </label>
                        <span className="text-[11px] text-[#64748b]">
                          Usa el panel de Symbolab arriba para insertar fórmulas
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={currentQ.explanationLatex}
                        onChange={(e) =>
                          updateCurrentQuestion({ explanationLatex: e.target.value })
                        }
                        className="w-full p-3.5 rounded-xl border border-[#dce6ef] bg-[#f8fafc] text-sm text-[#23395b] outline-none focus:border-[#218653]"
                        placeholder="Escribe la explicación matemática paso a paso..."
                      />
                    </div>
                  </div>

              {/* Right Column: Live KaTeX Preview */}
              <div className="lg:col-span-5 bg-[#f8fafc] border-2 border-[#dce6ef] rounded-2xl p-4 sm:p-5 flex flex-col gap-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#218653] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vista Previa en Tiempo Real (KaTeX)
                </span>

                <div className="p-4 rounded-xl bg-white border border-[#e2ecf5] text-sm text-[#23395b]">
                  <MathRenderer latex={currentQ.promptLatex} />
                </div>

                {currentQ.questionType === "multiple_choice" && currentQ.optionsLatex && (
                  <div className="space-y-2">
                    {currentQ.optionsLatex.map((opt, i) => {
                      const isCorrect = opt.trim() === currentQ.correctAnswer.trim();
                      return (
                        <div
                          key={i}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                            isCorrect
                              ? "bg-[#e8f5e9] border-[#218653] font-bold text-[#1a6e43]"
                              : "bg-white border-[#dce6ef] text-[#475569]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-[#94a3b8]">
                              {String.fromCharCode(65 + i)})
                            </span>
                            <MathRenderer latex={opt} />
                          </div>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-[#218653]" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === "numeric" && (
                  <div className="p-3 rounded-xl bg-[#e8f5e9] border border-[#218653] text-xs font-bold text-[#1a6e43]">
                    Respuesta correcta: <MathRenderer latex={currentQ.correctAnswer} />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-[#eef4fa] border border-[#dce6ef] text-xs text-[#334155]">
                  <strong className="block text-[#23395b] mb-1">Explicación:</strong>
                  <MathRenderer latex={currentQ.explanationLatex} />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )}

      {/* TAB 5: CHARTS & DIFFICULTY BY QUESTION */}
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
