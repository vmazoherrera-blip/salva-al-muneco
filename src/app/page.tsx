"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HangmanDoll } from "@/components/HangmanDoll";
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
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError("Por favor ingresa tu apodo u organización.");
      return;
    }

    if (!moderatorSecretKey.trim()) {
      setError("Por favor ingresa la clave secreta de moderador.");
      return;
    }

    if (containsProfanity(nickname)) {
      setError("El apodo contiene palabras inapropiadas o no permitidas. Por favor usa un nombre respetuoso.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Room with Moderator Secret Key
      const res = await fetch("/api/rooms/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timePerQuestion,
          secretKey: moderatorSecretKey.trim(),
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "No se pudo crear la sala");
      }

      const roomCode = data.room.code;
      const hostToken = data.hostToken;

      // 2. Join as Host
      const joinRes = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: roomCode,
          nickname: nickname.trim(),
        }),
      });
      const joinData = await joinRes.json();

      if (!joinData.success) {
        throw new Error(joinData.error || "Error al unirse como organizador");
      }

      // Save tokens
      localStorage.setItem("doll_room_code", roomCode);
      localStorage.setItem("doll_host_token_" + roomCode, hostToken);
      localStorage.setItem("doll_player_token", joinData.playerToken);
      localStorage.setItem("doll_nickname", nickname.trim());

      router.push(`/sala/${roomCode}`);
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
      const existingToken = localStorage.getItem("doll_player_token") || undefined;

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
      localStorage.setItem("doll_player_token", data.playerToken);
      localStorage.setItem("doll_nickname", nickname.trim());

      router.push(`/sala/${cleanCode}`);
    } catch (err: any) {
      setError(err.message || "Error al unirse a la sala");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner Reconnection Alert */}
      {savedSession && (
        <div className="w-full max-w-4xl mb-4 p-3.5 rounded-2xl bg-[#ffffff] border border-[#dce6ef] shadow-sm flex items-center justify-between gap-3 text-xs sm:text-sm animate-fade-in">
          <div className="flex items-center gap-2 text-[#23395b]">
            <RotateCcw className="w-4 h-4 text-[#218653]" />
            <span>
              Tienes una sesión guardada en la sala{" "}
              <strong className="tracking-widest font-mono text-sm">#{savedSession.code}</strong>
            </span>
          </div>
          <button
            onClick={() => router.push(`/sala/${savedSession.code}`)}
            className="px-3.5 py-1.5 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            Reconectar
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-5xl my-auto flex flex-col items-center">
        {/* Header Hero */}
        <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#ffffff] border border-[#dce6ef] shadow-xs text-xs font-bold text-[#23395b] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#218653]" />
            Juego Educativo Multijugador en Tiempo Real
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#23395b] tracking-tight">
            Salva al <span className="text-[#218653]">Muñeco</span>
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[#5c7285] font-medium leading-relaxed">
            Domina las <strong>transformaciones lineales</strong> y operaciones matriciales <strong>2×2</strong>. Cada acierto
            retira una pieza de la horca; si llegas a 0 piezas, ¡salvas al muñeco!
          </p>
        </div>

        {/* Grid: Interactive Doll Hero + Action Card */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Doll Preview & Rules */}
          <div className="lg:col-span-5 flex flex-col items-center bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="w-full flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748b]">
                Mecánica Inversa
              </span>
              <div className="flex gap-1">
                {[0, 3, 6].map((p) => (
                  <button
                    key={p}
                    onClick={() => setDemoPieces(p)}
                    className={`px-2 py-0.5 text-[11px] font-bold rounded-lg transition-colors ${
                      demoPieces === p
                        ? "bg-[#23395b] text-white"
                        : "bg-[#eef4fa] text-[#64748b] hover:bg-[#e2ecf5]"
                    }`}
                  >
                    {p === 0 ? "Salvado" : p === 3 ? "Inicio" : "Peligro"}
                  </button>
                ))}
              </div>
            </div>

            {/* Hangman SVG */}
            <HangmanDoll dangerParts={demoPieces} size={220} showLabels={true} />

            {/* Rules Quick Badges */}
            <div className="w-full mt-6 pt-5 border-t border-[#e2ecf5] space-y-2.5 text-xs text-[#5c7285]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#218653] shrink-0" />
                <span>
                  <strong>Acierto:</strong> +1 punto y <strong>retira 1 pieza</strong>. Con 0 piezas queda a salvo.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 text-[#c43d4d] shrink-0" />
                <span>
                  <strong>Error o Tiempo:</strong> -1 punto y <strong>suma 1 pieza</strong>. Con 6 piezas queda eliminado.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-[#f59e0b] shrink-0" />
                <span>
                  <strong>Podio oficial:</strong> 1º Supervivencia, 2º Aciertos, 3º Menor tiempo acumulado.
                </span>
              </div>
            </div>
          </div>

          {/* Right: Join or Create Room Card */}
          <div className="lg:col-span-7 bg-[#ffffff] border-2 border-[#dce6ef] rounded-3xl p-6 sm:p-8 shadow-md">
            {/* Tabs */}
            <div className="flex p-1 bg-[#eef4fa] rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("join");
                  setError(null);
                }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "join"
                    ? "bg-[#ffffff] text-[#23395b] shadow-sm"
                    : "text-[#64748b] hover:text-[#23395b]"
                }`}
              >
                <Play className="w-4 h-4 text-[#218653]" />
                Unirse a Partida
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("create");
                  setError(null);
                }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  activeTab === "create"
                    ? "bg-[#ffffff] text-[#23395b] shadow-sm"
                    : "text-[#64748b] hover:text-[#23395b]"
                }`}
              >
                <Users className="w-4 h-4 text-[#23395b]" />
                Crear Sala
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#fde8ea] border border-[#f5b3b9] text-[#c43d4d] text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB: JOIN ROOM */}
            {activeTab === "join" && (
              <form onSubmit={handleJoinRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Código de Sala (6 letras/números)
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="EJ: 9M4K2X"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] border-2 border-[#dce6ef] focus:border-[#23395b] focus:bg-white text-lg font-mono font-bold tracking-widest text-[#23395b] placeholder:text-[#94a3b8] uppercase transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Tu Apodo o Nombre
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Laura Vanessa Mazo Herrera"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] border-2 border-[#dce6ef] focus:border-[#23395b] focus:bg-white text-base font-semibold text-[#23395b] placeholder:text-[#94a3b8] transition-all outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[#218653] hover:bg-[#1a6e43] text-white font-bold text-base shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    {loading ? "Entrando a la sala..." : "Entrar a Jugar"}
                  </button>
                </div>

                <p className="text-center text-xs text-[#94a3b8] pt-1">
                  Acceso inmediato sin contraseñas. Admite hasta 30 jugadores por sala.
                </p>
              </form>
            )}

            {/* TAB: CREATE ROOM */}
            {activeTab === "create" && (
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                    Tu Apodo como Organizador
                  </label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Ej: Profe_Euler"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] border-2 border-[#dce6ef] focus:border-[#23395b] focus:bg-white text-base font-semibold text-[#23395b] placeholder:text-[#94a3b8] transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#218653]" />
                      Clave Secreta de Moderador / Docente
                    </span>
                    <span className="text-[11px] text-[#218653] font-bold">Autorización Requerida</span>
                  </label>
                  <input
                    type="password"
                    value={moderatorSecretKey}
                    onChange={(e) => setModeratorSecretKey(e.target.value)}
                    placeholder="Ingresa la clave secreta autorizada"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#f8fafc] border-2 border-[#dce6ef] focus:border-[#218653] focus:bg-white text-base font-semibold text-[#23395b] placeholder:text-[#94a3b8] transition-all outline-none"
                  />
                  <p className="text-[11px] text-[#64748b] mt-1">
                    Solo docentes con la clave autorizada pueden crear salas y acceder al panel de supervisión y solucionario.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#64748b] mb-1.5 flex items-center justify-between">
                    <span>Tiempo por Pregunta</span>
                    <span className="font-bold text-[#23395b] font-mono">{timePerQuestion} Segundos</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2">
                    {[60, 75, 90].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setTimePerQuestion(sec)}
                        className={`py-2.5 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                          timePerQuestion === sec
                            ? "bg-[#23395b] text-white border-[#23395b] shadow-sm"
                            : "bg-[#f8fafc] text-[#64748b] border-[#dce6ef] hover:bg-[#eef4fa]"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#eef4fa] border border-[#dce6ef] text-xs text-[#5c7285] flex items-center gap-3">
                  <Calculator className="w-5 h-5 text-[#23395b] shrink-0" />
                  <span>
                    La partida consta de <strong>10 preguntas únicas</strong> de matrices generadas con cálculo exacto
                    y distractores algebraicos.
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl bg-[#23395b] hover:bg-[#1a2b45] text-white font-bold text-base shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Users className="w-5 h-5" />
                    {loading ? "Creando sala..." : "Crear Sala Multijugador"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-12 pt-6 border-t border-[#dce6ef] text-center text-xs text-[#64748b] flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Salva al Muñeco • Matrices & Transformaciones Lineales</span>
        <span>Aritmética exacta, Anti-trampas Zero-Trust y Sincronización en Vivo</span>
      </footer>
    </main>
  );
}
