"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HangmanDoll } from "@/components/HangmanDoll";
import { ThemeToggle } from "@/components/ThemeToggle";
import { containsProfanity } from "@/lib/profanity";
import {
  Users,
  Play,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Calculator,
  RotateCcw,
  CheckCircle2,
  Award,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  // Tab: "create" | "join"
  const [activeTab, setActiveTab] = useState<"create" | "join">("join");

  // Form states
  const [joinCode, setJoinCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [moderatorSecretKey, setModeratorSecretKey] = useState("");
  const [timePerQuestion, setTimePerQuestion] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active session reconnection banner
  const [savedSession, setSavedSession] = useState<{ code: string; token: string } | null>(null);

  // Hero doll interactive demo preview state (cycles between 0, 3, 6)
  const [demoPieces, setDemoPieces] = useState(3);

  useEffect(() => {
    try {
      const code = localStorage.getItem("doll_room_code");
      const token = localStorage.getItem("doll_player_token");
      const storedNick = localStorage.getItem("doll_nickname");
      if (storedNick) setNickname(storedNick);
      if (code && token) {
        setSavedSession({ code, token });
      }
    } catch {}
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Por favor ingresa tu apodo de organizador.");
      return;
    }

    if (containsProfanity(nickname)) {
      setError("El apodo contiene palabras inapropiadas o no permitidas. Por favor usa un nombre respetuoso.");
      return;
    }

    const cleanKey = moderatorSecretKey
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    if (cleanKey !== "que increible juego" && cleanKey !== "quiz especial") {
      setError("Clave secreta de moderador incorrecta. Solo docentes autorizados pueden crear salas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          timePerQuestion,
          moderatorSecretKey: moderatorSecretKey.trim(),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "No fue posible crear la sala");
      }

      localStorage.setItem("doll_room_code", data.room.code);
      localStorage.setItem("doll_host_token_" + data.room.code, data.hostToken);
      if (data.hostPlayer?.player_token) {
        localStorage.setItem("doll_player_token_" + data.room.code, data.hostPlayer.player_token);
        localStorage.setItem("doll_player_token", data.hostPlayer.player_token);
      }
      localStorage.setItem("doll_host_token", data.hostToken);
      localStorage.setItem("doll_nickname", nickname.trim());

      router.push(`/sala/${data.room.code}`);
    } catch (err: any) {
      setError(err.message || "Error al crear la sala");
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase();

    if (!cleanCode || cleanCode.length < 4) {
      setError("Ingresa un código de sala válido.");
      return;
    }

    if (!nickname.trim()) {
      setError("Por favor ingresa tu apodo.");
      return;
    }

    if (containsProfanity(nickname)) {
      setError("El apodo contiene palabras inapropiadas o no permitidas. Por favor usa un nombre respetuoso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const existingToken =
        localStorage.getItem("doll_player_token_" + cleanCode) ||
        localStorage.getItem("doll_player_token") ||
        undefined;

      const res = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanCode,
          nickname: nickname.trim(),
          playerToken: existingToken,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "No fue posible unirse a la sala");
      }

      localStorage.setItem("doll_room_code", cleanCode);
      localStorage.setItem("doll_player_token_" + cleanCode, data.playerToken);
      localStorage.setItem("doll_player_token", data.playerToken);
      localStorage.setItem("doll_nickname", nickname.trim());

      router.push(`/sala/${cleanCode}`);
    } catch (err: any) {
      setError(err.message || "Error al unirse a la sala");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-3.5 sm:p-6 lg:p-8">
      {/* Top Navbar Row: Reconnection alert + Theme Toggle */}
      <div className="w-full max-w-5xl flex items-center justify-between gap-3 mb-2 px-1">
        <div className="flex-1">
          {savedSession && (
            <div className="p-3 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/40 shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in backdrop-blur-md">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Sesión activa en sala{" "}
                  <strong className="tracking-widest font-mono text-emerald-900 dark:text-white font-black">
                    #{savedSession.code}
                  </strong>
                </span>
              </div>
              <button
                onClick={() => router.push(`/sala/${savedSession.code}`)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-black transition-all flex items-center gap-1.5 shadow-xs shrink-0"
              >
                Reconectar
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        <div className="shrink-0 ml-auto">
          <ThemeToggle showLabels={true} />
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-5xl my-auto flex flex-col items-center py-2 sm:py-6">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10 px-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 shadow-md text-xs font-bold text-slate-700 dark:text-slate-200 mb-3.5 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Juego Multijugador Educativo en Tiempo Real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight drop-shadow-sm">
            Salva al <span className="text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]">Muñeco</span>
          </h1>
          <p className="mt-2.5 sm:mt-3 text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl mx-auto">
            Domina las <strong className="text-slate-900 dark:text-white">transformaciones lineales</strong> y operaciones matriciales <strong className="text-emerald-600 dark:text-emerald-400">2×2</strong>.
            Cada acierto retira una pieza de peligro; ¡si llegas a 0 piezas salvas al muñeco!
          </p>
        </div>

        {/* Grid: Interactive Doll Hero + Action Card */}
        {/* Mobile First: Form on top (order-1), Doll underneath (order-2); on lg screens, side-by-side */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
          {/* Action Card: Join or Create Room (Primary Mobile Target) */}
          <div className="order-1 lg:order-2 lg:col-span-7 bg-white/95 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("join");
                  setError(null);
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "join"
                    ? "bg-white text-slate-900 shadow-md border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700/60"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
                Unirse a Partida
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("create");
                  setError(null);
                }}
                className={`flex-1 py-3 text-xs sm:text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "create"
                    ? "bg-white text-slate-900 shadow-md border border-slate-200 dark:bg-slate-800 dark:text-white dark:border-slate-700/60"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                <Users className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Crear Sala
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-shake">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB: JOIN ROOM */}
            {activeTab === "join" && (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Código de Sala</span>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">6 caracteres</span>
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="EJ: 9M4K2X"
                    required
                    autoFocus
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 text-2xl font-mono font-black tracking-widest text-center text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 uppercase transition-all outline-none shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Tu Apodo o Nombre Completo
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Laura Mazo"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-slate-300 dark:border-slate-700 focus:border-emerald-500 dark:focus:border-emerald-400 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600 hover:from-emerald-500 hover:to-emerald-600 dark:hover:from-emerald-400 dark:hover:to-emerald-500 text-white dark:text-slate-950 font-black text-base shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {loading ? "Entrando a la sala..." : "Entrar a Jugar Ahora"}
                  </button>
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 pt-1">
                  Acceso directo sin registro ni contraseñas. Admite hasta 30 alumnos.
                </p>
              </form>
            )}

            {/* TAB: CREATE ROOM */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Tu Apodo como Organizador
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Profe_Euler"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      Clave Secreta de Moderador
                    </span>
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">Docentes</span>
                  </label>
                  <input
                    type="password"
                    value={moderatorSecretKey}
                    onChange={(e) => setModeratorSecretKey(e.target.value)}
                    placeholder="Digita la clave secreta autorizada"
                    required
                    className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/90 border-2 border-slate-300 dark:border-slate-700 focus:border-cyan-500 dark:focus:border-cyan-400 text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all outline-none"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Solo docentes con la clave autorizada pueden crear salas y acceder al solucionario y supervisor.
                  </p>

                  <div className="mt-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 text-[11.5px] text-amber-800 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
                    <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <strong className="font-bold text-amber-900 dark:text-amber-100">🌟 Cuestionario Especial Oficial (30 Preguntas):</strong>
                      {" "}Digita la clave <code className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-500/20 font-mono font-black text-amber-900 dark:text-amber-200">quiz especial</code> para activar las 30 preguntas oficiales divididas en 3 rondas (Propiedades, Matrices R² y Matrices R³).
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Tiempo por Pregunta</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">{timePerQuestion} Segundos</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[60, 75, 90].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimePerQuestion(sec)}
                        className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                          timePerQuestion === sec
                            ? "bg-cyan-50 border-cyan-500 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400 shadow-sm"
                            : "bg-slate-100 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>
                    La partida consta de <strong className="text-slate-900 dark:text-white">10 preguntas únicas</strong> generadas con
                    aritmética exacta, matrices y vectores 2×2.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-700 dark:from-cyan-500 dark:to-blue-600 hover:from-cyan-500 hover:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 text-white dark:text-slate-950 font-black text-base shadow-lg shadow-cyan-950/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 disabled:opacity-50"
                  >
                    <Users className="w-5 h-5" />
                    {loading ? "Creando sala..." : "Crear Sala Multijugador"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Left / Secondary Card: Doll Preview & Rules */}
          <div className="order-2 lg:order-1 lg:col-span-5 flex flex-col items-center bg-white/95 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 dark:shadow-black/40 backdrop-blur-xl">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Mecánica Inversa
              </span>
              <div className="flex gap-1.5">
                {[0, 3, 6].map((p) => (
                  <button
                    key={p}
                    onClick={() => setDemoPieces(p)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                      demoPieces === p
                        ? "bg-slate-800 text-white border border-slate-700 dark:bg-slate-700 dark:text-white dark:border-slate-600"
                        : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:text-slate-200 dark:border-slate-800/80"
                    }`}
                  >
                    {p === 0 ? "Salvado" : p === 3 ? "Inicio" : "Peligro"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hangman SVG */}
            <div className="py-2">
              <HangmanDoll dangerParts={demoPieces} size={200} showLabels={true} />
            </div>

            {/* Rules Quick Badges */}
            <div className="w-full mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-emerald-800 dark:text-emerald-300">Acierto:</strong> +1 punto y <strong className="text-emerald-800 dark:text-emerald-300">retira 1 pieza</strong>. Con 0 piezas queda a salvo.
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>
                  <strong className="text-rose-800 dark:text-rose-300">Error o Tiempo:</strong> -1 punto y <strong className="text-rose-800 dark:text-rose-300">suma 1 pieza</strong>. Con 6 piezas queda eliminado.
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong className="text-amber-800 dark:text-amber-300">Podio oficial:</strong> 1º Supervivencia, 2º Aciertos, 3º Rapidez acumulada.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-8 pt-5 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Salva al Muñeco • Matrices & Transformaciones Lineales 2×2</span>
        <span>Aritmética exacta, Anti-trampas Zero-Trust y Sincronización en Vivo</span>
      </footer>
    </main>
  );
}
