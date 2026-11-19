"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { HangmanDoll } from "@/components/HangmanDoll";
import { MathRenderer } from "@/components/MathRenderer";
import { PodiumGraphic } from "@/components/PodiumGraphic";
import { ModeratorDashboard } from "@/components/ModeratorDashboard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Room,
  Player,
  LeaderboardEntry,
  RoomEvent,
  ModeratorStats,
} from "@/lib/supabase/types";
import { QuestionData } from "@/lib/math-engine/templates";
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
  const [masterQuestions, setMasterQuestions] = useState<QuestionData[]>([]);
  const [isSpecialQuiz, setIsSpecialQuiz] = useState<boolean>(false);
  const [activeRound, setActiveRound] = useState<1 | 2 | 3 | "all">(1);
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

  // Mobile navigation tab for in-game view: "question" | "doll" | "ranking"
  const [mobileTab, setMobileTab] = useState<"question" | "doll" | "ranking">("question");

  // Fetch latest state from server
  const fetchRoomState = useCallback(async () => {
    if (!roomCode) return;
    try {
      const token =
        localStorage.getItem("doll_player_token_" + roomCode) ||
        localStorage.getItem("doll_player_token") ||
        "";
      const storedNick = localStorage.getItem("doll_nickname") || "";
      const currentHost = hostToken || localStorage.getItem("doll_host_token_" + roomCode) || "";
      const res = await fetch(
        `/api/rooms/state?code=${roomCode}&playerToken=${token}&hostToken=${currentHost}&nickname=${encodeURIComponent(storedNick)}`
      );
      const data = await res.json();

      if (!data.success) {
        if (loading) setError(data.error || "No se pudo cargar la sala");
        return;
      }

      setRoom(data.room);
      setPlayer(data.player);
      if (data.player?.player_token) {
        setPlayerToken(data.player.player_token);
        localStorage.setItem("doll_player_token_" + roomCode, data.player.player_token);
        localStorage.setItem("doll_player_token", data.player.player_token);
      }
      setLeaderboard(data.leaderboard || []);
      setEvents(data.events || []);
      setModeratorStats(data.moderatorStats);
      if (data.masterQuestions) {
        setMasterQuestions((prev) => {
          if (prev && prev.length > 0 && JSON.stringify(prev) === JSON.stringify(data.masterQuestions)) {
            return prev;
          }
          return data.masterQuestions;
        });
      }
      if (typeof data.isSpecialQuiz === "boolean") {
        setIsSpecialQuiz(data.isSpecialQuiz);
      }
      if (data.activeRound) {
        setActiveRound(data.activeRound);
      }
      setCurrentQuestion(data.currentQuestion);

      if (data.serverNow) {
        setServerTimeDelta(data.serverNow - Date.now());
      }
      setLoading(false);
    } catch (err: any) {
      console.error("Error polling room state:", err);
    }
  }, [roomCode, loading, hostToken]);

  // Initial load & host detection
  useEffect(() => {
    const token =
      localStorage.getItem("doll_player_token_" + roomCode) ||
      localStorage.getItem("doll_player_token") ||
      "";
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
  const handleStartGame = async (overrideQuestions?: QuestionData[]) => {
    const storedHostToken = hostToken || localStorage.getItem("doll_host_token_" + roomCode);
    if (!storedHostToken) {
      setError("No tienes permisos de organizador para iniciar");
      return;
    }

    const questionsToSend =
      overrideQuestions && overrideQuestions.length > 0
        ? overrideQuestions
        : masterQuestions && masterQuestions.length > 0
        ? masterQuestions
        : undefined;

    setSubmitting(true);
    try {
      const res = await fetch("/api/rooms/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          hostToken: storedHostToken,
          customQuestions: questionsToSend,
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
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Conectando con la sala #{roomCode}...</p>
      </div>
    );
  }

  // Error Screen
  if (error && !room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/40">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No se pudo acceder a la sala</h2>
        <p className="text-xs text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-md transition-all border border-slate-700"
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
      <div className="flex items-center gap-1 p-1 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-sm">
        <button
          onClick={() => setViewMode("player")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            viewMode === "player"
              ? "bg-slate-800 text-white shadow-xs border border-slate-700/60"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
          Vista Jugador
        </button>
        <button
          onClick={() => setViewMode("moderator")}
          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
            viewMode === "moderator"
              ? "bg-slate-800 text-white shadow-xs border border-slate-700/60"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          Panel Moderador
          {events.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
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
        <div className="flex justify-between items-center mb-6 gap-3 flex-wrap">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            ← Salir al Inicio
          </button>
          <div className="flex items-center gap-2">
            {renderModeratorToggle()}
            <ThemeToggle />
          </div>
        </div>

        <ModeratorDashboard
          room={room}
          leaderboard={leaderboard}
          events={events}
          stats={moderatorStats}
          masterQuestions={masterQuestions}
          hostToken={hostToken}
          isSpecialQuiz={isSpecialQuiz}
          activeRound={activeRound}
          onRefresh={fetchRoomState}
          onStartGame={handleStartGame}
          onQuestionsUpdated={(qs) => setMasterQuestions(qs)}
        />
      </main>
    );
  }

  // =========================================================================
  // VIEW 1: LOBBY (WAITING FOR PLAYERS & HOST TO START)
  // =========================================================================
  if (room?.status === "waiting") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-between p-3.5 sm:p-6 lg:p-8">
        <div className="w-full max-w-4xl my-auto flex flex-col items-center">
          {/* Header row with navigation & theme switcher */}
          <div className="w-full flex justify-between items-center mb-4 gap-3">
            <button
              onClick={() => router.push("/")}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              ← Inicio
            </button>
            <div className="flex items-center gap-2">
              {isHost && renderModeratorToggle()}
              <ThemeToggle />
            </div>
          </div>

          {/* Room Code Card */}
          <div className="w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl text-center mb-5">
            {isSpecialQuiz ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 text-xs font-bold uppercase tracking-wider mb-3 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Cuestionario Especial Oficial • Ronda {activeRound}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-3">
                Lobby de Espera
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">Sala #{roomCode}</h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
              Comparte el código con tus alumnos o compañeros para que ingresen
            </p>

            {/* Copyable Code Box */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="px-6 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-slate-300 dark:border-slate-700 font-mono font-black text-3xl sm:text-4xl tracking-widest text-emerald-600 dark:text-emerald-400 shadow-inner select-all">
                {roomCode}
              </div>
              <button
                onClick={copyRoomCode}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "¡Código Copiado!" : "Copiar Código"}
              </button>
            </div>

            {/* Details badge */}
            <div className="mt-5 flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {room.time_per_question}s por pregunta
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {leaderboard.length} / {room.max_players} jugadores
              </span>
            </div>
          </div>

          {/* Players Roster */}
          <div className="w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl dark:shadow-2xl backdrop-blur-xl mb-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Jugadores Conectados ({leaderboard.length})
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">Máximo 30</span>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-8">Esperando a que ingresen jugadores...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {leaderboard.map((p) => {
                  const isCurrent = p.id === player?.id || (p.player_token ? p.player_token === playerToken : false);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                        isCurrent
                          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold shadow-xs"
                          : "bg-slate-950/80 border-slate-800 text-slate-200"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                          isCurrent ? "bg-emerald-500 text-slate-950" : "bg-slate-850 text-cyan-400 border border-slate-700"
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
                onClick={() => handleStartGame()}
                disabled={submitting}
                className="w-full max-w-md py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-lg shadow-xl shadow-emerald-950/70 transition-all active:scale-95 flex items-center justify-center gap-2.5 disabled:opacity-50 mx-auto"
              >
                <Play className="w-6 h-6 fill-current" />
                {submitting ? "Iniciando partida..." : "Iniciar Partida Ahora"}
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 inline-flex items-center gap-3 text-xs font-semibold text-slate-300 shadow-sm">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
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
    const totalQuestions = masterQuestions?.length || 10;
    const isPlayerDead = player?.status === "eliminado" || (player?.danger_parts ?? 0) >= 6;
    const isPlayerFinished = player?.status === "terminado" || (player?.current_question_index ?? 0) >= totalQuestions;

    return (
      <main className="min-h-screen flex flex-col p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Top Game Bar */}
        <header className="w-full bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xl backdrop-blur-md mb-3 sm:mb-5 flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="font-mono font-bold text-xs uppercase px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
              Sala #{roomCode}
            </span>
            <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              Pregunta {(player?.current_question_index ?? 0) + 1}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> / {totalQuestions}</span>
            </div>
          </div>

          {/* Countdown Clock */}
          {!isPlayerDead && !isPlayerFinished && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl font-mono font-black text-sm sm:text-base border transition-all ${
                timeRemaining <= 10
                  ? "bg-rose-50 text-rose-700 border-rose-400 dark:bg-rose-950/90 dark:text-rose-300 dark:border-rose-500/70 animate-pulse shadow-sm"
                  : "bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-slate-950/90 dark:text-cyan-400 dark:border-cyan-500/40"
              }`}
            >
              <Clock className="w-4 h-4 shrink-0" />
              <span>{timeRemaining}s</span>
            </div>
          )}

          {/* Player Score & Counters + Moderator Toggle + ThemeToggle */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-bold flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
              Puntos: <strong className="text-base text-emerald-600 dark:text-emerald-400">{player?.score ?? 0}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">✓ {player?.correct_count ?? 0}</span>
            <span className="text-rose-600 dark:text-rose-400">✗ {player?.wrong_count ?? 0}</span>

            {isHost && renderModeratorToggle()}
            <ThemeToggle />
          </div>
        </header>

        {/* Mobile Tab Switcher (Visible on mobile/tablet <lg) */}
        <div className="flex lg:hidden p-1 bg-slate-900/90 border border-slate-800 rounded-2xl mb-4 gap-1">
          <button
            onClick={() => setMobileTab("question")}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "question"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🎯 Pregunta</span>
          </button>
          <button
            onClick={() => setMobileTab("doll")}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "doll"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🪢 Muñeco ({player?.danger_parts ?? 3}/6)</span>
          </button>
          <button
            onClick={() => setMobileTab("ranking")}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === "ranking"
                ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span>🏆 Ranking ({leaderboard.length})</span>
          </button>
        </div>

        {/* Main Game Grid: Question + Hangman/Leaderboard */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          {/* Left / Main Column: Question or Status Card */}
          <div
            className={`lg:col-span-8 flex flex-col gap-4 ${
              mobileTab === "question" ? "block" : "hidden lg:flex"
            }`}
          >
            {isPlayerDead ? (
              <div className="bg-slate-900/90 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
                <div className="w-16 h-16 rounded-full bg-rose-950/60 text-rose-400 flex items-center justify-center mx-auto mb-4 border border-rose-500/40">
                  <XCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-rose-400">¡Muñeco Ahorcado!</h2>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  Has acumulado 6 piezas de peligro. Quedaste eliminado de la partida, pero puedes seguir el ranking
                  en vivo mientras los demás jugadores completan sus preguntas.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (room) setRoom({ ...room, status: "finished" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Ver Podio y Resultados Finales
                  </button>
                </div>
              </div>
            ) : isPlayerFinished ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-950/60 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-white">¡Has completado las {totalQuestions} preguntas!</h2>
                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto">
                  Lograste <strong className="text-emerald-400">{player?.correct_count}</strong> aciertos y tu muñeco
                  tiene <strong className="text-cyan-400">{player?.danger_parts}</strong> piezas de peligro. Esperando a
                  que concluyan los demás jugadores de la sala...
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      if (room) setRoom({ ...room, status: "finished" });
                    }}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-md transition-all"
                  >
                    Ver Podio de la Sala
                  </button>
                </div>
              </div>
            ) : currentQuestion ? (
              /* ACTIVE QUESTION CARD */
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-h-[420px]">
                {/* Level Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      currentQuestion.level === "basico"
                        ? "bg-emerald-950/70 text-emerald-400 border border-emerald-500/40"
                        : currentQuestion.level === "intermedio"
                        ? "bg-amber-950/70 text-amber-400 border border-amber-500/40"
                        : "bg-blue-950/70 text-blue-400 border border-blue-500/40"
                    }`}
                  >
                    Nivel {currentQuestion.level}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentQuestion.question_type === "multiple_choice"
                      ? "Selección múltiple (4 opciones)"
                      : "Respuesta numérica"}
                  </span>
                </div>

                {/* Prompt in KaTeX */}
                <div className="my-auto py-3 sm:py-5 overflow-x-auto">
                  <MathRenderer
                    latex={currentQuestion.prompt_latex}
                    displayMode={false}
                    className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed"
                  />
                </div>

                {/* Answer Inputs / Buttons */}
                {!feedback?.show ? (
                  <div className="mt-6 pt-4 border-t border-slate-800">
                    {currentQuestion.question_type === "multiple_choice" &&
                    currentQuestion.options_latex ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {currentQuestion.options_latex.map((opt: string, idx: number) => {
                          const letter = String.fromCharCode(65 + idx);
                          return (
                            <button
                              key={idx}
                              onClick={() => handleAnswerSubmit(opt)}
                              disabled={submitting}
                              className="relative p-4 rounded-2xl bg-slate-950/80 hover:bg-slate-850 border-2 border-slate-800 hover:border-emerald-500/80 text-center font-medium text-sm sm:text-base transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center min-h-[68px] shadow-sm text-white group"
                            >
                              <span className="absolute left-3 top-3 w-6 h-6 rounded-lg bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-slate-400 text-xs font-mono font-black flex items-center justify-center transition-colors">
                                {letter}
                              </span>
                              <div className="w-full px-5 overflow-x-auto">
                                <MathRenderer latex={opt} />
                              </div>
                            </button>
                          );
                        })}
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
                          className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-950/90 border-2 border-slate-700 focus:border-emerald-400 text-lg font-semibold text-white placeholder:text-slate-600 transition-all outline-none"
                        />
                        <button
                          type="submit"
                          disabled={submitting || !numericAnswer.trim()}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-950/70 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Confirmar Respuesta
                        </button>
                      </form>
                    )}
                  </div>
                ) : (
                  /* Step-by-Step Feedback & Explanation */
                  <div
                    className={`mt-6 p-5 sm:p-6 rounded-2xl border-2 transition-all ${
                      feedback.isCorrect
                        ? "bg-emerald-950/60 border-emerald-500/50 shadow-lg shadow-emerald-950/50"
                        : "bg-rose-950/60 border-rose-500/50 shadow-lg shadow-rose-950/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {feedback.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span className="font-extrabold text-emerald-300 text-base">
                            ¡Correcto! (+1 punto, -1 pieza de peligro)
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          <span className="font-extrabold text-rose-300 text-base">
                            Incorrecto o Tiempo agotado (-1 punto, +1 pieza)
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-xs sm:text-sm text-slate-200 mt-3 bg-slate-950/90 p-4 rounded-xl border border-slate-800">
                      <strong className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                        Explicación Matemática:
                      </strong>
                      <MathRenderer latex={feedback.explanationLatex} />
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleNextQuestion}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        Siguiente Pregunta
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-10 text-center">
                <p className="text-xs text-slate-400">Cargando pregunta...</p>
              </div>
            )}
          </div>

          {/* Right Column: Doll SVG & Live Mini Leaderboard */}
          <div
            className={`lg:col-span-4 flex flex-col gap-4 ${
              mobileTab === "question" ? "hidden lg:flex" : "flex"
            }`}
          >
            {/* My Doll Card (Visible on desktop or when mobileTab === 'doll') */}
            {(mobileTab === "doll" || typeof window === "undefined" || true) && (
              <div
                className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl flex flex-col items-center ${
                  mobileTab === "ranking" ? "hidden lg:flex" : "flex"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Estado de tu Muñeco
                </span>
                <HangmanDoll dangerParts={player?.danger_parts ?? 3} size={200} showLabels={true} />
              </div>
            )}

            {/* Live Leaderboard Card (Visible on desktop or when mobileTab === 'ranking') */}
            {(mobileTab === "ranking" || typeof window === "undefined" || true) && (
              <div
                className={`bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-xl ${
                  mobileTab === "doll" ? "hidden lg:block" : "block"
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Ranking en Vivo
                  </h3>
                  <span className="text-[11px] text-slate-400">{leaderboard.length} jugadores</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {leaderboard.map((item) => {
                    const storedNick = typeof window !== "undefined" ? localStorage.getItem("doll_nickname") || "" : "";
                    const isCurrent =
                      item.id === player?.id ||
                      (item.player_token ? item.player_token === playerToken : false) ||
                      (storedNick ? item.nickname.toLowerCase() === storedNick.toLowerCase() : false);
                    const isDead = item.status === "eliminado" || item.danger_parts >= 6;
                    const isSaved = item.danger_parts === 0;

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          isCurrent
                            ? "bg-emerald-950/40 border-emerald-500/50 text-white font-bold shadow-xs"
                            : "bg-slate-950/70 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-4 font-bold text-slate-400 text-center">#{item.rank}</span>
                          <span className="truncate max-w-[100px]">
                            {item.nickname} {isCurrent && "(Tú)"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isSaved ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                              ¡Salvado!
                            </span>
                          ) : isDead ? (
                            <span className="text-[10px] font-bold text-rose-400 bg-rose-950/70 border border-rose-500/30 px-1.5 py-0.5 rounded">
                              Eliminado
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-mono">
                              {item.danger_parts}/6 piezas
                            </span>
                          )}
                          <div className="flex flex-col items-end">
                            <span className="font-extrabold text-white">{item.score} pts</span>
                            <span className="text-[10px] text-emerald-400 font-medium">
                              {item.correct_count}/{totalQuestions}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  }

  // =========================================================================
  // VIEW 3: PODIUM & RESULTS (GAME OVER / PODIUM GRAPHIC)
  // =========================================================================
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-3.5 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl my-auto flex flex-col items-center gap-6">
        {/* Top Header Row with Return, Moderator Switch & ThemeToggle */}
        <div className="w-full flex justify-between items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            ← Inicio
          </button>
          <div className="flex items-center gap-2">
            {isHost && renderModeratorToggle()}
            <ThemeToggle />
          </div>
        </div>

        {/* Top Victory message */}
        <div className="text-center px-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Partida Concluida
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white">
            Podio Oficial y Ganadores
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 max-w-lg mx-auto">
            Supervivencia confirmada • Desempate oficial por aciertos y velocidad de cálculo
          </p>
        </div>

        {/* Podium Graphic with PNG download */}
        <PodiumGraphic leaderboard={leaderboard} roomCode={roomCode} totalQuestions={masterQuestions?.length || 10} />

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 mt-2">
          {isHost && (
            <button
              onClick={() => setViewMode("moderator")}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-950/70 transition-all active:scale-95 flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Ver Solucionario y Estadísticas
            </button>
          )}

          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm shadow-md transition-all active:scale-95"
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
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-slate-300">Cargando sala...</p>
        </div>
      }
    >
      <RoomPageContent />
    </React.Suspense>
  );
}
