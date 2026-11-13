"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { HangmanDoll } from "@/components/HangmanDoll";
import { MathRenderer } from "@/components/MathRenderer";
import { PodiumGraphic } from "@/components/PodiumGraphic";
import { ModeratorDashboard } from "@/components/ModeratorDashboard";
import {
  Room,
  Player,
  LeaderboardEntry,
  RoomEvent,
  ModeratorStats,
} from "@/lib/supabase/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Users,
  Play,
  Clock,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Send,
  AlertCircle,
  Radio,
  Gamepad2,
} from "lucide-react";

function RoomPageContent() {
  const params = useParams();
  const router = useRouter();
  const roomCode = ((params?.code as string) || "").toUpperCase();

  // Local authentication & tokens
  const [playerToken, setPlayerToken] = useState<string>("");
  const [isHost, setIsHost] = useState(false);
  const [hostToken, setHostToken] = useState<string>("");

  // Moderator toggle ("player" or "moderator")
  const [viewMode, setViewMode] = useState<"player" | "moderator">("player");

  // Room state
  const [room, setRoom] = useState<Room | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [moderatorStats, setModeratorStats] = useState<ModeratorStats | undefined>(undefined);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [serverTimeDelta, setServerTimeDelta] = useState<number>(0);

  // UI & flow states
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In-game answer state
  const [numericAnswer, setNumericAnswer] = useState("");
  const [feedback, setFeedback] = useState<{
    show: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    explanationLatex: string;
  } | null>(null);

  // Time remaining state
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const confettiFired = useRef(false);

  // Fetch latest state from server
  const fetchRoomState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const token = localStorage.getItem("doll_player_token") || "";
      const res = await fetch(`/api/rooms/state?code=${roomCode}&playerToken=${token}`);
      const data = await res.json();

      if (!data.success) {
        if (loading) setError(data.error || "No se pudo cargar la sala");
        return;
      }

      setRoom(data.room);
      setPlayer(data.player);
      setLeaderboard(data.leaderboard || []);
      setEvents(data.events || []);
      setModeratorStats(data.moderatorStats);
      setCurrentQuestion(data.currentQuestion);

      if (data.serverNow) {
        setServerTimeDelta(data.serverNow - Date.now());
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Error polling room state:", err);
    }
  }, [roomCode, loading]);

  // Initial load & host detection
  useEffect(() => {
    const token = localStorage.getItem("doll_player_token") || "";
    setPlayerToken(token);

    const storedHostToken = localStorage.getItem("doll_host_token_" + roomCode);
    if (storedHostToken) {
      setIsHost(true);
      setHostToken(storedHostToken);
    }

    fetchRoomState();
  }, [roomCode, fetchRoomState]);

  // Periodic heartbeat polling (every 2s)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRoomState();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchRoomState]);

  // Realtime Supabase subscription if available
  useEffect(() => {
    if (!isSupabaseConfigured() || !roomCode) return;

    const channel = supabase
      .channel(`room_${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "rooms" }, () => {
        fetchRoomState();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "players" }, () => {
        fetchRoomState();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode, fetchRoomState]);

  // Timer countdown calculation
  useEffect(() => {
    if (!room || room.status !== "playing" || !currentQuestion?.started_at || feedback?.show) {
      return;
    }

    const updateTimer = () => {
      const serverNow = Date.now() + serverTimeDelta;
      const startedAtMs = new Date(currentQuestion.started_at).getTime();
      const elapsedSec = (serverNow - startedAtMs) / 1000;
      const totalSec = room.time_per_question;
      const remaining = Math.max(0, Math.ceil(totalSec - elapsedSec));

      setTimeRemaining(remaining);

      // Timeout auto-submit
      if (remaining === 0 && !submitting && !feedback?.show) {
        handleAnswerSubmit("__TIMEOUT__");
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 500);
    return () => clearInterval(timerInterval);
  }, [room, currentQuestion, serverTimeDelta, feedback, submitting]);

  // Confetti effect when game ends or player finishes survived
  useEffect(() => {
    if (room?.status === "finished" && !confettiFired.current) {
      const hasSurvived = player && player.danger_parts < 6;
      if (hasSurvived) {
        confettiFired.current = true;
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    }
  }, [room?.status, player]);

  // Host starts the match
  const handleStartGame = async () => {
    const storedHostToken = hostToken || localStorage.getItem("doll_host_token_" + roomCode);
    if (!storedHostToken) {
      setError("No tienes permisos de organizador para iniciar");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/rooms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          hostToken: storedHostToken,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "No se pudo iniciar la partida");
      }
      await fetchRoomState();
    } catch (e: any) {
      setError(e.message || "Error al iniciar partida");
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Answer
  const handleAnswerSubmit = async (chosenAnswer: string) => {
    if (submitting || !player || !currentQuestion) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          playerToken: player.player_token,
          questionIndex: currentQuestion.question_index,
          answer: chosenAnswer,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Error al enviar la respuesta");
      }

      setFeedback({
        show: true,
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        explanationLatex: data.explanationLatex,
      });

      if (data.updatedPlayer) {
        setPlayer(data.updatedPlayer);
      }

      if (data.isCorrect) {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.7 },
        });
      }
    } catch (e: any) {
      console.error("Submit error:", e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setFeedback(null);
    setNumericAnswer("");
    fetchRoomState();
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading Screen
  if (loading && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-[#23395b] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-[#23395b]">Conectando con la sala #{roomCode}...</p>
      </div>
    );
  }

  // Error Screen
  if (error && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-[#fde8ea] text-[#c43d4d] flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-[#23395b] mb-2">No se pudo acceder a la sala</h2>
        <p className="text-xs text-[#64748b] mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-xl bg-[#23395b] text-white text-sm font-bold shadow-md hover:bg-[#1a2b45] transition-all"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  // Header Bar Navigation with Moderator Toggle
  const renderModeratorToggle = () => {
    if (!isHost) return null;
    return (
      <div className="flex items-center gap-1.5 p-1 bg-[#ffffff] border-2 border-[#dce6ef] rounded-2xl shadow-xs">
        <button
          onClick={() => setViewMode("player")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            viewMode === "player"
              ? "bg-[#23395b] text-white shadow-xs"
              : "text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          Vista Jugador
        </button>
        <button
          onClick={() => setViewMode("moderator")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            viewMode === "moderator"
              ? "bg-[#23395b] text-white shadow-xs"
              : "text-[#64748b] hover:text-[#23395b]"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-[#218653] animate-pulse" />
          Panel Moderador
          {events.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-[#218653]" />
          )}
        </button>
      </div>
    );
  };

  // IF MODERATOR PANEL IS ACTIVE
  if (isHost && viewMode === "moderator" && room) {
    return (
      <main className="min-h-screen flex flex-col p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Navigation Switch Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold text-[#64748b] hover:text-[#23395b] transition-colors"
          >
            ← Salir al Inicio
          </button>
          {renderModeratorToggle()}
        </div>

        <ModeratorDashboard
          room={room}
          leaderboard={leaderboard}
          events={events}
          stats={moderatorStats}
          hostToken={hostToken}
          onRefresh={fetchRoomState}
          onStartGame={handleStartGame}
        />
      </main>
    );
  }

  // =========================================================================
  // VIEW 1: LOBBY (WAITING FOR PLAYERS & HOST TO START)
  // =========================================================================
  if (room?.status === "waiting") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl my-auto flex flex-col items-center">
          {/* Moderator Switch Header if Host */}
          {isHost && (
            <div className="w-full flex justify-end mb-4">
              {renderModeratorToggle()}
            </div>
          )}

          {/* Room Code Card */}
          <div className="w-full bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-sm text-center mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef4fa] text-[#23395b] text-xs font-bold uppercase tracking-wider mb-3">
              Lobby de Espera
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-[#23395b]">Sala #{roomCode}</h1>
            <p className="text-xs sm:text-sm text-[#64748b] mt-1">
              Comparte el código con tus estudiantes o compañeros para unirse
            </p>

            {/* Copyable Code Box */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="px-6 py-3 rounded-2xl bg-[#f8fafc] border-2 border-[#dce6ef] font-mono font-black text-3xl tracking-widest text-[#23395b] shadow-inner select-all">
                {roomCode}
              </div>
              <button
                onClick={copyRoomCode}
                className="px-5 py-3 rounded-2xl bg-[#23395b] hover:bg-[#1a2b45] text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-[#218653]" /> : <Copy className="w-4 h-4" />}
                {copied ? "¡Código Copiado!" : "Copiar Código"}
              </button>
            </div>

            {/* Details badge */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs font-semibold text-[#64748b]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#218653]" />
                {room.time_per_question}s por pregunta
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#23395b]" />
                {leaderboard.length} / {room.max_players} jugadores
              </span>
            </div>
          </div>

          {/* Players Roster */}
          <div className="w-full bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-sm mb-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#e2ecf5] mb-4">
              <h2 className="text-base font-bold text-[#23395b] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#218653]" />
                Jugadores Conectados ({leaderboard.length})
              </h2>
              <span className="text-xs text-[#64748b]">Máximo 30</span>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-center text-xs text-[#94a3b8] py-8">Esperando a que ingresen jugadores...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto pr-1">
                {leaderboard.map((p) => {
                  const isCurrent = p.id === player?.id || (p.player_token ? p.player_token === playerToken : false);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                        isCurrent
                          ? "bg-[#e8f7ee] border-[#218653] text-[#218653] font-bold shadow-xs"
                          : "bg-[#f8fafc] border-[#e2e8f0] text-[#1e293b]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          isCurrent ? "bg-[#218653] text-white" : "bg-[#e2ecf5] text-[#23395b]"
                        }`}
                      >
                        {p.nickname.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="truncate text-xs font-semibold">
                        {p.nickname} {isCurrent && "(Tú)"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Host Action or Waiting Indicator */}
          <div className="w-full text-center">
            {isHost ? (
              <button
                onClick={handleStartGame}
                disabled={submitting}
                className="w-full max-w-md py-4 rounded-2xl bg-[#218653] hover:bg-[#1a6e43] text-white font-black text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 mx-auto"
              >
                <Play className="w-6 h-6 fill-current" />
                {submitting ? "Iniciando partida..." : "Iniciar Partida Ahora"}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-[#ffffff] border-2 border-[#dce6ef] inline-flex items-center gap-3 text-xs font-semibold text-[#5c7285] shadow-xs">
                <span className="w-3 h-3 rounded-full bg-[#f59e0b] animate-ping" />
                Esperando a que el organizador inicie la partida...
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW 2: GAMEPLAY (PLAYING 10 QUESTIONS)
  // =========================================================================
  if (room?.status === "playing") {
    const isPlayerDead = player?.status === "eliminado" || (player?.danger_parts ?? 0) >= 6;
    const isPlayerFinished = player?.status === "terminado" || (player?.current_question_index ?? 0) >= 10;

    return (
      <main className="min-h-screen flex flex-col p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Top Game Bar */}
        <header className="w-full bg-[#ffffff] border-2 border-[#dce6ef] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-sm mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 rounded-lg bg-[#eef4fa] text-[#23395b] border border-[#dce6ef]">
              Sala #{roomCode}
            </span>
            <div className="text-sm sm:text-base font-extrabold text-[#23395b]">
              Pregunta {(player?.current_question_index ?? 0) + 1}
              <span className="text-xs font-normal text-[#64748b]"> / 10</span>
            </div>
          </div>

          {/* Countdown Clock */}
          {!isPlayerDead && !isPlayerFinished && (
            <div
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base border-2 transition-all ${
                timeRemaining <= 10
                  ? "bg-[#fde8ea] text-[#c43d4d] border-[#f5b3b9] animate-pulse"
                  : "bg-[#eef4fa] text-[#23395b] border-[#dce6ef]"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{timeRemaining}s</span>
            </div>
          )}

          {/* Player Score & Counters + Moderator Toggle */}
          <div className="flex items-center gap-3 text-xs sm:text-sm font-bold">
            <span className="px-2.5 py-1 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-[#23395b]">
              Puntos: <strong className="text-base text-[#218653]">{player?.score ?? 0}</strong>
            </span>
            <span className="text-[#218653]">✓ {player?.correct_count ?? 0}</span>
            <span className="text-[#c43d4d]">✗ {player?.wrong_count ?? 0}</span>

            {isHost && renderModeratorToggle()}
          </div>
        </header>

        {/* Main Game Grid: Question + Hangman/Leaderboard */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Main Column: Question or Status Card */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {isPlayerDead ? (
              <div className="bg-[#ffffff] border-2 border-[#f5b3b9] rounded-3xl p-6 sm:p-10 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#fde8ea] text-[#c43d4d] flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-[#c43d4d]">¡Muñeco Ahorcado!</h2>
                <p className="text-sm text-[#64748b] mt-2 max-w-md mx-auto">
                  Has acumulado 6 piezas de peligro. Quedaste eliminado de la partida, pero puedes seguir el ranking
                  en vivo mientras los demás jugadores completan sus preguntas.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (room) setRoom({ ...room, status: "finished" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#23395b] text-white font-bold text-sm shadow-md hover:bg-[#1a2b45] transition-all"
                  >
                    Ver Podio y Resultados Finales
                  </button>
                </div>
              </div>
            ) : isPlayerFinished ? (
              <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-10 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#e8f7ee] text-[#218653] flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-[#23395b]">¡Has completado las 10 preguntas!</h2>
                <p className="text-sm text-[#64748b] mt-2 max-w-md mx-auto">
                  Lograste {player?.correct_count} aciertos y tu muñeco tiene {player?.danger_parts} piezas de peligro.
                  Esperando a que concluyan los demás jugadores de la sala...
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (room) setRoom({ ...room, status: "finished" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#218653] text-white font-bold text-sm shadow-md hover:bg-[#1a6e43] transition-all"
                  >
                    Ver Podio de la Sala
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              /* ACTIVE QUESTION CARD */
              <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[420px]">
                {/* Level Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      currentQuestion.level === "basico"
                        ? "bg-[#e8f7ee] text-[#218653]"
                        : currentQuestion.level === "intermedio"
                        ? "bg-[#fef3c7] text-[#d97706]"
                        : "bg-[#eff6ff] text-[#2563eb]"
                    }`}
                  >
                    Nivel {currentQuestion.level}
                  </span>
                  <span className="text-xs text-[#94a3b8] font-medium">
                    {currentQuestion.question_type === "multiple_choice"
                      ? "Selección múltiple"
                      : "Respuesta numérica"}
                  </span>
                </div>

                {/* Prompt in KaTeX */}
                <div className="my-auto py-4">
                  <MathRenderer
                    latex={currentQuestion.prompt_latex}
                    displayMode={false}
                    className="text-base sm:text-lg font-medium text-[#1e293b] leading-relaxed"
                  />
                </div>

                {/* Answer Inputs / Buttons */}
                {!feedback?.show ? (
                  <div className="mt-6 pt-4 border-t border-[#e2ecf5]">
                    {currentQuestion.question_type === "multiple_choice" &&
                    currentQuestion.options_latex ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options_latex.map((opt: string, idx: number) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerSubmit(opt)}
                            disabled={submitting}
                            className="p-4 rounded-2xl bg-[#f8fafc] hover:bg-[#eef4fa] border-2 border-[#dce6ef] hover:border-[#23395b] text-center font-medium text-sm sm:text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-h-[64px] shadow-xs"
                          >
                            <MathRenderer latex={opt} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (numericAnswer.trim()) {
                            handleAnswerSubmit(numericAnswer);
                          }
                        }}
                        className="flex flex-col sm:flex-row gap-3"
                      >
                        <input
                          type="text"
                          value={numericAnswer}
                          onChange={(e) => setNumericAnswer(e.target.value)}
                          placeholder="Ej: 0.5 o 1/2 o -3"
                          disabled={submitting}
                          required
                          className="flex-1 px-4 py-3.5 rounded-2xl bg-[#f8fafc] border-2 border-[#dce6ef] focus:border-[#23395b] focus:bg-white text-base font-semibold text-[#23395b] placeholder:text-[#94a3b8] transition-all outline-none"
                        />
                        <button
                          type="submit"
                          disabled={submitting || !numericAnswer.trim()}
                          className="px-6 py-3.5 rounded-2xl bg-[#218653] hover:bg-[#1a6e43] text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Confirmar
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Step-by-Step Feedback & Explanation */
                  <div
                    className={`mt-6 p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                      feedback.isCorrect
                        ? "bg-[#e8f7ee] border-[#a3e0be]"
                        : "bg-[#fde8ea] border-[#f5b3b9]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-[#218653]" />
                          <span className="font-extrabold text-[#218653] text-base">
                            ¡Correcto! (+1 punto, -1 pieza de peligro)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-[#c43d4d]" />
                          <span className="font-extrabold text-[#c43d4d] text-base">
                            Incorrecto o Tiempo agotado (-1 punto, +1 pieza)
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-[#1e293b] mt-3 bg-white/70 p-3.5 rounded-xl border border-white">
                      <strong className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1">
                        Explicación Matemática:
                      </strong>
                      <MathRenderer latex={feedback.explanationLatex} />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="px-5 py-2.5 rounded-xl bg-[#23395b] hover:bg-[#1a2b45] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        Siguiente Pregunta
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-10 text-center">
                <p className="text-xs text-[#94a3b8]">Cargando pregunta...</p>
              </div>
            )}
          </div>

          {/* Right Column: Doll SVG & Live Mini Leaderboard */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* My Doll Card */}
            <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 shadow-sm flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b] mb-2">
                Estado de tu Muñeco
              </span>
              <HangmanDoll dangerParts={player?.danger_parts ?? 3} size={200} showLabels={true} />
            </div>

            {/* Live Leaderboard Card */}
            <div className="bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#e2ecf5] mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#23395b] flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[#f59e0b]" />
                  Ranking en Vivo
                </h3>
                <span className="text-[11px] text-[#64748b]">{leaderboard.length} jugadores</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {leaderboard.map((item) => {
                  const isCurrent = item.id === player?.id || (item.player_token ? item.player_token === playerToken : false);
                  const isDead = item.status === "eliminado" || item.danger_parts >= 6;
                  const isSaved = item.danger_parts === 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                        isCurrent
                          ? "bg-[#e8f7ee] border-[#218653] font-bold"
                          : "bg-[#f8fafc] border-[#e2e8f0]"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-4 font-bold text-[#64748b] text-center">#{item.rank}</span>
                        <span className="truncate max-w-[100px]">
                          {item.nickname} {isCurrent && "(Tú)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isSaved ? (
                          <span className="text-[10px] font-bold text-[#218653] bg-[#e8f7ee] px-1.5 py-0.5 rounded">
                            ¡Salvado!
                          </span>
                        ) : isDead ? (
                          <span className="text-[10px] font-bold text-[#c43d4d] bg-[#fde8ea] px-1.5 py-0.5 rounded">
                            Eliminado
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#5c7285] font-mono">
                            {item.danger_parts}/6 piezas
                          </span>
                        )}
                        <span className="font-extrabold text-[#23395b]">{item.correct_count} pts</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW 3: PODIUM & RESULTS (GAME OVER / PODIUM GRAPHIC)
  // =========================================================================
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl my-auto flex flex-col items-center gap-6">
        {/* Moderator Switch Header if Host */}
        {isHost && (
          <div className="w-full flex justify-end">
            {renderModeratorToggle()}
          </div>
        )}

        {/* Top Victory message */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f7ee] text-[#218653] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Partida Concluida
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-[#23395b]">
            Podio Oficial y Ganadores
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b] mt-1">
            Supervivencia confirmada • Desempate oficial por aciertos y velocidad de resolución
          </p>
        </div>

        {/* Podium Graphic with PNG download */}
        <PodiumGraphic leaderboard={leaderboard} roomCode={roomCode} />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-2xl bg-[#ffffff] border-2 border-[#dce6ef] hover:border-[#23395b] text-[#23395b] font-bold text-sm shadow-sm transition-all active:scale-95"
          >
            Volver al Menú Principal
          </button>
        </div>
      </div>
    </main>
  );
}

export default function RoomPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 border-4 border-[#23395b] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-[#23395b]">Cargando sala...</p>
        </div>
      }
    >
      <RoomPageContent />
    </React.Suspense>
  );
}
