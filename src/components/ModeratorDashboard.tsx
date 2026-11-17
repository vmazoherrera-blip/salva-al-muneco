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
import { ThemeToggle } from "./ThemeToggle";
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
  onStartGame?: (customQuestions?: QuestionData[]) => void;
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
    if (!hasInitializedRef.current && !isDirtyRef.current && masterQuestions && masterQuestions.length > 0) {
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
      const currentHost =
        hostToken ||
        (typeof window !== "undefined" ? localStorage.getItem("doll_host_token_" + room.code) : "") ||
        "";
      const res = await fetch("/api/rooms/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: room.code,
          hostToken: currentHost,
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
    <div className="w-full flex flex-col gap-6 animate-fade-in text-slate-900 dark:text-white">
      {/* Top Banner: Moderator Controls & Status */}
      <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-center shadow-md">
            <Radio className="w-6 h-6 animate-pulse text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-slate-700/60 tracking-wider uppercase">
                Panel del Moderador / Docente
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 font-mono">Sala #{room.code}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              Supervisión en Vivo del Aula
            </h2>
          </div>
        </div>

        {/* Master Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <ThemeToggle />

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-all"
            title="Refrescar estado"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {room.status === "waiting" && (
            <>
              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
                title="Generar 10 nuevas preguntas aleatorias"
              >
                <Shuffle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Aleatorias
              </button>

              <button
                onClick={() => setActiveTab("customizer")}
                className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Personalizar
              </button>

              {onStartGame && (
                <button
                  onClick={() => onStartGame(localQuestions)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-emerald-950/30 transition-all active:scale-95 flex items-center gap-2"
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
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-rose-950/50 transition-all active:scale-95 flex items-center gap-2"
            >
              <StopCircle className="w-4 h-4" />
              Finalizar Partida para Todos
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-slate-900 dark:text-white">{stats?.totalPlayers ?? leaderboard.length}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Alumnos</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {stats?.survivedCount ?? leaderboard.filter((p) => p.danger_parts === 0).length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">¡Muñeco Salvado!</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats?.inProgressCount ??
              leaderboard.filter((p) => p.danger_parts > 0 && p.danger_parts < 6 && p.status !== "eliminado").length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">En Riesgo (1-5)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-rose-600 dark:text-rose-400">
            {stats?.eliminatedCount ??
              leaderboard.filter((p) => p.danger_parts >= 6 || p.status === "eliminado").length}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Ahorcados (6)</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-cyan-600 dark:text-cyan-400">{stats?.averageScore ?? 0}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Puntos Promedio</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-md text-center backdrop-blur-md">
          <span className="block text-2xl font-black text-slate-900 dark:text-white">
            {stats ? (stats.averageTimeMs / 1000).toFixed(1) : "0.0"}s
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tiempo Promedio</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("live_feed")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "live_feed"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Registro en Vivo
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300">
            {events.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "students"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Alumnos ({leaderboard.length})
        </button>

        <button
          onClick={() => setActiveTab("solutions")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "solutions"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Solucionario y Respuestas (10)
        </button>

        <button
          onClick={() => setActiveTab("customizer")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "customizer"
              ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          Diseñador de Preguntas
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`pb-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === "charts"
              ? "border-amber-500 text-amber-600 dark:text-amber-400"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
          }`}
        >
          <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          Gráficas de Rendimiento
        </button>
      </div>

      {/* TAB 1: LIVE FEED */}
      {activeTab === "live_feed" && (
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    eventFilter === f.id
                      ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black shadow-md"
                      : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <p className="text-center py-10 text-sm text-slate-500 dark:text-slate-400">
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
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-200"
                        : isWrong
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-500/40 text-rose-800 dark:text-rose-200"
                        : isJoin
                        ? "bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-200"
                        : "bg-slate-50 dark:bg-slate-950/80 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                      {isWrong && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />}
                      {isJoin && <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                      <span className="font-bold text-slate-900 dark:text-white">{ev.nickname}:</span>
                      <span className="text-slate-700 dark:text-slate-300">{ev.message}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
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
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar alumno por nombre..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
              {filteredStudents.length} de {leaderboard.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider">
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
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80">
                {filteredStudents.map((s, idx) => {
                  const isAlive = s.danger_parts < 6 && s.status !== "eliminado";
                  const isSaved = s.danger_parts === 0;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-slate-500 dark:text-slate-400">#{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {s.nickname}
                        {!s.is_connected && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 font-normal">
                            Desconectado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {isSaved ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/50 text-emerald-800 dark:text-emerald-300 font-bold text-xs inline-flex items-center gap-1">
                            ¡Salvado! (0 piezas)
                          </span>
                        ) : !isAlive ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-500/50 text-rose-800 dark:text-rose-300 font-bold text-xs">
                            Ahorcado (6 piezas)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 font-bold text-xs">
                            Peligro: {s.danger_parts}/6
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        Pregunta {Math.min(10, s.current_question_index + 1)} / 10
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{s.correct_count}</td>
                      <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">{s.wrong_count}</td>
                      <td className="py-3 px-3 text-center font-black text-cyan-600 dark:text-cyan-400">{s.score}</td>
                      <td className="py-3 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                        {(s.total_time_ms / 1000).toFixed(1)}s
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRoomAction("kick", s.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 dark:hover:bg-rose-900/80 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition-colors inline-flex items-center gap-1"
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
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Solucionario Oficial y Respuestas Correctas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Guía completa para el docente con todas las ecuaciones en KaTeX, respuestas correctas destacadas y desarrollo matemático paso a paso.
              </p>
            </div>
            {room.status === "waiting" && (
              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold shadow-xs border border-slate-300 dark:border-slate-700 transition-all flex items-center gap-2"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Generar Otro Conjunto Aleatorio
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6">
            {localQuestions.map((q, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col gap-4"
              >
                {/* Header Question */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700/60 flex items-center justify-center font-black text-xs">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Pregunta {idx + 1} de 10
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                        q.level === "basico"
                          ? "bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300"
                          : q.level === "intermedio"
                          ? "bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300"
                          : "bg-purple-100 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-500/40 text-purple-800 dark:text-purple-300"
                      }`}
                    >
                      {q.level}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                      {q.questionType === "multiple_choice" ? "Opción Múltiple" : "Numérica"}
                    </span>
                  </div>
                </div>

                {/* Prompt */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-slate-200 leading-relaxed">
                  <MathRenderer latex={q.promptLatex} />
                </div>

                {/* Options / Correct Answer */}
                {q.questionType === "multiple_choice" && q.optionsLatex && (
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                      Opciones presentadas a los alumnos:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.optionsLatex.map((opt, optIdx) => {
                        const isCorrect = opt.trim() === q.correctAnswer.trim();
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm transition-all ${
                              isCorrect
                                ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 font-bold text-emerald-800 dark:text-emerald-200 shadow-md"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                                {String.fromCharCode(65 + optIdx)})
                              </span>
                              <MathRenderer latex={opt} />
                            </div>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black text-[11px] shrink-0 flex items-center gap-1 shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
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
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-500 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Respuesta Numérica Correcta:
                    </span>
                    <span className="font-mono font-black text-lg text-emerald-700 dark:text-emerald-300 px-3 py-1 bg-white dark:bg-slate-900 rounded-lg border border-emerald-300 dark:border-emerald-500/30">
                      <MathRenderer latex={q.correctAnswer} />
                    </span>
                  </div>
                )}

                {/* Mathematical Explanation */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Procedimiento y Justificación Paso a Paso:
                  </span>
                  <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
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
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Diseñador de Preguntas de la Partida
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Crea o modifica preguntas en lenguaje natural o con matrices. Tienes total libertad para redactar preguntas sencillas o complejas.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleLoadSimplePreset}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-white border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition-all shadow-xs"
                title="Cargar ejemplo simple tipo 2+2"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Plantilla Simple (2+2)
              </button>

              <button
                type="button"
                onClick={handleClearQuestion}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/80 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-400 dark:hover:border-rose-500/50 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 flex items-center gap-1.5 transition-all"
                title="Borrar todo para escribir desde cero"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Hoja en Blanco
              </button>

              <button
                onClick={handleRegenerateQuestions}
                disabled={actionLoading}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Shuffle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Regenerar Todas
              </button>

              <button
                onClick={handleSaveCustomQuestions}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-1.5 ${
                  saveSuccess
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950"
                    : "bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950"
                }`}
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Save className="w-3.5 h-3.5" />}
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
                    ? "bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 font-black shadow-md shadow-emerald-950/30"
                    : "bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      Panel Matemático Estilo Symbolab (Libertad Total de Redacción)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">Insertar símbolos en:</span>
                      <div className="flex p-0.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setSymbolabTarget("prompt")}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            symbolabTarget === "prompt"
                              ? "bg-slate-800 text-white shadow-xs border border-slate-700/60"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Enunciado
                        </button>
                        <button
                          type="button"
                          onClick={() => setSymbolabTarget("explanation")}
                          className={`px-3 py-1 rounded-lg transition-all ${
                            symbolabTarget === "explanation"
                              ? "bg-slate-800 text-white shadow-xs border border-slate-700/60"
                              : "text-slate-400 hover:text-white"
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
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                          Nivel de Dificultad
                        </label>
                        <select
                          value={currentQ.level}
                          onChange={(e) =>
                            updateCurrentQuestion({ level: e.target.value as any })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        >
                          <option value="basico">Básico (Preguntas 1-3)</option>
                          <option value="intermedio">Intermedio (Preguntas 4-7)</option>
                          <option value="avanzado">Avanzado (Preguntas 8-10)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
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
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                        >
                          <option value="multiple_choice">Selección Múltiple (4 opciones)</option>
                          <option value="numeric">Numérica / Fracción exacta</option>
                        </select>
                      </div>
                    </div>

                    {/* Prompt with Visual Matrix Grid Inspector */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Enunciado de la Pregunta (Lenguaje Natural):
                        </label>
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Escribe texto natural sin pensar en LaTeX
                        </span>
                      </div>

                      {/* Visual Matrix/Vector Inspector for Prompt */}
                      {promptMatrices.length > 0 && (
                        <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 space-y-2.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                              Matrices y Vectores del Enunciado (Edición Numérica Directa):
                            </span>
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold">
                              Escribe solo números en las casillas
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-3 items-center">
                            {promptMatrices.map((item) => (
                              <div
                                key={item.id}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 shadow-xs flex items-center gap-2"
                              >
                                <span className="font-mono font-bold text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-300 dark:border-emerald-500/40">
                                  {item.name}
                                </span>
                                <span className="text-sm font-bold text-slate-400 dark:text-slate-500">=</span>

                                {item.type === "matrix_2x2" && item.matrix && (
                                  <div className="flex items-center">
                                    <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-0.5">⎛</span>
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
                                          className="w-11 h-7 text-center font-bold text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                                        />
                                      ))}
                                    </div>
                                    <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pr-0.5">⎞</span>
                                  </div>
                                )}

                                {item.type === "vector_2d" && item.vector && (
                                  <div className="flex items-center">
                                    <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pl-0.5">⎛</span>
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
                                          className="w-11 h-7 text-center font-bold text-xs bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-900 dark:text-white focus:border-emerald-500 outline-none"
                                        />
                                      ))}
                                    </div>
                                    <span className="text-3xl font-light text-slate-400 dark:text-slate-500 select-none pr-0.5">⎞</span>
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
                        className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Escribe la pregunta en lenguaje natural (ej: ¿Cuánto es 2+2? o determina la rotación)..."
                      />
                    </div>

                    {/* Multiple Choice Options with Natural Visual Editors */}
                    {currentQ.questionType === "multiple_choice" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Opciones de Respuesta:
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">Formato de las 4 opciones:</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newOpts = ["4", "5", "3", "22"];
                                updateCurrentQuestion({
                                  optionsLatex: newOpts,
                                  correctAnswer: newOpts[0],
                                });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-white transition-all shadow-xs"
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
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-white transition-all shadow-xs"
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
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-500 space-y-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                          Respuesta Numérica Correcta:
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            value={currentQ.correctAnswer}
                            onChange={(e) => updateCurrentQuestion({ correctAnswer: e.target.value })}
                            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-emerald-400/50 dark:border-emerald-500/40 bg-white dark:bg-slate-950 font-bold text-base text-emerald-700 dark:text-emerald-300 outline-none shadow-xs focus:border-emerald-500"
                            placeholder="Ej: 5, -2 o 3/4"
                          />
                          <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-emerald-300 dark:border-emerald-500/30 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                            Vista: <MathRenderer latex={currentQ.correctAnswer} />
                          </div>
                        </div>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Escribe directamente el número, negativo o fracción.
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Explicación y Justificación Paso a Paso:
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Usa el panel de Symbolab arriba para insertar fórmulas
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        value={currentQ.explanationLatex}
                        onChange={(e) =>
                          updateCurrentQuestion({ explanationLatex: e.target.value })
                        }
                        className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                        placeholder="Escribe la explicación matemática paso a paso..."
                      />
                    </div>
                  </div>

              {/* Right Column: Live KaTeX Preview */}
              <div className="lg:col-span-5 bg-white/95 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 text-slate-900 dark:text-white">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Vista Previa en Tiempo Real (KaTeX)
                </span>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200">
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
                              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 font-bold text-emerald-800 dark:text-emerald-200"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-slate-400 dark:text-slate-500">
                              {String.fromCharCode(65 + i)})
                            </span>
                            <MathRenderer latex={opt} />
                          </div>
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {currentQ.questionType === "numeric" && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-400 dark:border-emerald-500 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Respuesta correcta: <MathRenderer latex={currentQ.correctAnswer} />
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  <strong className="block text-slate-900 dark:text-white mb-1">Explicación:</strong>
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
        <div className="bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Distribución de Dificultad y Aciertos por Pregunta (1 a 10)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
                <div key={q.questionIndex} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5 flex-wrap gap-2">
                    <span className="text-slate-900 dark:text-white">{topicName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-600 dark:text-emerald-400">✓ {q.correctCount} aciertos</span>
                      <span className="text-rose-600 dark:text-rose-400">✗ {q.wrongCount} fallos</span>
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-cyan-700 dark:text-cyan-300">
                        {q.accuracyPct}% éxito
                      </span>
                    </div>
                  </div>

                  {/* Dual Bar (Green vs Red) */}
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${q.accuracyPct}%` }}
                    />
                    <div
                      className="h-full bg-rose-500 transition-all duration-500"
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
