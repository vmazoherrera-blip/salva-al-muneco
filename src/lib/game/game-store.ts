import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  Room,
  Player,
  PlayerQuestion,
  LeaderboardEntry,
  RoomEvent,
  ModeratorStats,
  QuestionAccuracyStat,
} from "../supabase/types";
import { generateMatchQuestions } from "../math-engine/generator";
import { validateAnswer } from "../math-engine/validator";

// Server admin client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isRealSupabaseAvailable = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseServiceKey &&
    !supabaseUrl.includes("placeholder-project") &&
    !supabaseServiceKey.includes("placeholder")
  );
};

let adminClient: SupabaseClient | null = null;
if (isRealSupabaseAvailable()) {
  try {
    adminClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.warn("Supabase client init failed, falling back to in-memory store:", e);
  }
}

// ---------------------------------------------------------------------------
// IN-MEMORY STORE (Reliable zero-dependency fallback for local testing & build)
// ---------------------------------------------------------------------------
class MemoryDb {
  rooms = new Map<string, Room>(); // key: code
  players = new Map<string, Player>(); // key: id
  roomPlayers = new Map<string, string[]>(); // key: room_id -> player_id[]
  questions = new Map<string, PlayerQuestion[]>(); // key: player_id -> questions[]
  events = new Map<string, RoomEvent[]>(); // key: code -> events[]

  generateCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}

const memoryDb = new MemoryDb();

// Helper to record room activity events
export function addRoomEvent(code: string, event: Omit<RoomEvent, "id">) {
  const cleanCode = code.trim().toUpperCase();
  const list = memoryDb.events.get(cleanCode) || [];
  const fullEvent: RoomEvent = {
    ...event,
    id: "evt_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
  };
  list.unshift(fullEvent); // newest first
  if (list.length > 200) list.pop(); // keep last 200 events
  memoryDb.events.set(cleanCode, list);
}

export function getRoomEvents(code: string): RoomEvent[] {
  const cleanCode = code.trim().toUpperCase();
  return memoryDb.events.get(cleanCode) || [];
}

// ---------------------------------------------------------------------------
// LEADERBOARD SORTING
// ---------------------------------------------------------------------------
export function sortPlayersForLeaderboard(players: Player[]): LeaderboardEntry[] {
  const sorted = [...players].sort((a, b) => {
    // 1. Survival: Non-eliminated players strictly above eliminated
    const aDead = a.danger_parts >= 6 || a.status === "eliminado";
    const bDead = b.danger_parts >= 6 || b.status === "eliminado";
    if (aDead !== bDead) {
      return aDead ? 1 : -1;
    }

    // 2. Highest correct count
    if (b.correct_count !== a.correct_count) {
      return b.correct_count - a.correct_count;
    }

    // 3. Lowest total_time_ms (speed tie-breaker)
    if (a.total_time_ms !== b.total_time_ms) {
      return a.total_time_ms - b.total_time_ms;
    }

    // 4. Score fallback
    return b.score - a.score;
  });

  return sorted.map((p, idx) => ({
    id: p.id,
    player_token: p.player_token,
    nickname: p.nickname,
    score: p.score,
    correct_count: p.correct_count,
    wrong_count: p.wrong_count,
    danger_parts: p.danger_parts,
    status: p.status,
    current_question_index: p.current_question_index,
    total_time_ms: p.total_time_ms,
    is_connected: p.is_connected,
    rank: idx + 1,
    survival_status:
      p.status === "eliminado" || p.danger_parts >= 6
        ? "eliminated"
        : p.danger_parts === 0
        ? "survived"
        : "in_progress",
  }));
}

// ---------------------------------------------------------------------------
// GAME STORE OPERATIONS
// ---------------------------------------------------------------------------

export async function createGameRoom(timePerQuestion: number = 60, maxPlayers: number = 30) {
  const code = memoryDb.generateCode();
  const hostToken = "host_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const clampedTime = Math.min(120, Math.max(30, timePerQuestion));

  if (isRealSupabaseAvailable() && adminClient) {
    try {
      const { data, error } = await adminClient
        .from("rooms")
        .insert({
          code,
          host_token: hostToken,
          time_per_question: clampedTime,
          max_players: maxPlayers,
          status: "waiting",
        })
        .select()
        .single();

      if (!error && data) {
        return { room: data as Room, hostToken };
      }
    } catch (e) {
      console.warn("Supabase room create failed, using memoryDb:", e);
    }
  }

  // Fallback to in-memory
  const room: Room = {
    id: "room_" + Math.random().toString(36).substring(2, 9),
    code,
    host_token: hostToken,
    status: "waiting",
    time_per_question: clampedTime,
    max_players: maxPlayers,
    created_at: new Date().toISOString(),
  };

  memoryDb.rooms.set(code, room);
  memoryDb.roomPlayers.set(room.id, []);

  addRoomEvent(code, {
    room_code: code,
    type: "join",
    player_id: "host",
    nickname: "Organizador",
    message: `Sala #${code} creada con ${clampedTime}s por pregunta`,
    timestamp: new Date().toISOString(),
  });

  return { room, hostToken };
}

export async function joinGameRoom(code: string, nickname: string, playerToken?: string) {
  const cleanCode = code.trim().toUpperCase();
  const cleanNickname = nickname.trim().slice(0, 30);
  const token = playerToken || "p_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  if (isRealSupabaseAvailable() && adminClient) {
    try {
      const { data: room, error: roomErr } = await adminClient
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (roomErr || !room) {
        return { error: "Sala no encontrada" };
      }

      // Check existing player reconnection
      const { data: existingPlayer } = await adminClient
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .eq("player_token", token)
        .maybeSingle();

      if (existingPlayer) {
        await adminClient
          .from("players")
          .update({ is_connected: true, updated_at: new Date().toISOString() })
          .eq("id", existingPlayer.id);

        addRoomEvent(cleanCode, {
          room_code: cleanCode,
          type: "reconnect",
          player_id: existingPlayer.id,
          nickname: existingPlayer.nickname,
          message: `${existingPlayer.nickname} se ha reconectado a la sala`,
          timestamp: new Date().toISOString(),
        });

        return { room: room as Room, player: existingPlayer as Player, playerToken: token };
      }

      if (room.status !== "waiting") {
        return { error: "La partida ya ha comenzado o ha finalizado" };
      }

      const { count } = await adminClient
        .from("players")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);

      if ((count || 0) >= room.max_players) {
        return { error: "La sala ha alcanzado el límite máximo de jugadores" };
      }

      const { data: newPlayer, error: playerErr } = await adminClient
        .from("players")
        .insert({
          room_id: room.id,
          player_token: token,
          nickname: cleanNickname || "Jugador",
          score: 0,
          correct_count: 0,
          wrong_count: 0,
          danger_parts: 3,
          status: "jugando",
          current_question_index: 0,
          total_time_ms: 0,
          is_connected: true,
        })
        .select()
        .single();

      if (playerErr || !newPlayer) {
        return { error: "Error al unirse a la sala" };
      }

      addRoomEvent(cleanCode, {
        room_code: cleanCode,
        type: "join",
        player_id: newPlayer.id,
        nickname: newPlayer.nickname,
        message: `${newPlayer.nickname} ingresó a la sala`,
        timestamp: new Date().toISOString(),
      });

      return { room: room as Room, player: newPlayer as Player, playerToken: token };
    } catch (e) {
      console.warn("Supabase join failed, falling back to memory:", e);
    }
  }

  // MemoryDb fallback
  const room = memoryDb.rooms.get(cleanCode);
  if (!room) {
    return { error: "Sala no encontrada" };
  }

  const playerIds = memoryDb.roomPlayers.get(room.id) || [];
  const existingId = playerIds.find((pid) => memoryDb.players.get(pid)?.player_token === token);

  if (existingId) {
    const existing = memoryDb.players.get(existingId)!;
    existing.is_connected = true;
    existing.updated_at = new Date().toISOString();

    addRoomEvent(cleanCode, {
      room_code: cleanCode,
      type: "reconnect",
      player_id: existing.id,
      nickname: existing.nickname,
      message: `${existing.nickname} se ha reconectado a la sala`,
      timestamp: new Date().toISOString(),
    });

    return { room, player: existing, playerToken: token };
  }

  if (room.status !== "waiting") {
    return { error: "La partida ya ha comenzado o ha finalizado" };
  }

  if (playerIds.length >= room.max_players) {
    return { error: "La sala está llena (máximo 30 jugadores)" };
  }

  const newPlayer: Player = {
    id: "p_" + Math.random().toString(36).substring(2, 9),
    room_id: room.id,
    player_token: token,
    nickname: cleanNickname || "Jugador",
    score: 0,
    correct_count: 0,
    wrong_count: 0,
    danger_parts: 3,
    status: "jugando",
    current_question_index: 0,
    total_time_ms: 0,
    is_connected: true,
    updated_at: new Date().toISOString(),
  };

  memoryDb.players.set(newPlayer.id, newPlayer);
  playerIds.push(newPlayer.id);
  memoryDb.roomPlayers.set(room.id, playerIds);

  addRoomEvent(cleanCode, {
    room_code: cleanCode,
    type: "join",
    player_id: newPlayer.id,
    nickname: newPlayer.nickname,
    message: `${newPlayer.nickname} ingresó a la sala`,
    timestamp: new Date().toISOString(),
  });

  return { room, player: newPlayer, playerToken: token };
}

export async function startGameRoom(code: string, hostToken: string) {
  const cleanCode = code.trim().toUpperCase();

  if (isRealSupabaseAvailable() && adminClient) {
    try {
      const { data: room, error: roomErr } = await adminClient
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (roomErr || !room) return { error: "Sala no encontrada" };
      if (room.host_token !== hostToken) return { error: "No autorizado como organizador" };
      if (room.status !== "waiting") return { error: "La sala ya ha sido iniciada" };

      // Update room to playing
      await adminClient.from("rooms").update({ status: "playing" }).eq("id", room.id);

      const { data: players } = await adminClient
        .from("players")
        .select("*")
        .eq("room_id", room.id);

      if (players && players.length > 0) {
        const nowIso = new Date().toISOString();
        const allQuestionsToInsert: any[] = [];

        for (const p of players) {
          const generated = generateMatchQuestions();
          for (const q of generated) {
            allQuestionsToInsert.push({
              player_id: p.id,
              question_index: q.questionIndex,
              level: q.level,
              question_type: q.questionType,
              prompt_latex: q.promptLatex,
              options_latex: q.optionsLatex || null,
              correct_answer: q.correctAnswer,
              explanation_latex: q.explanationLatex,
              started_at: q.questionIndex === 0 ? nowIso : null,
              answered_at: null,
              is_correct: null,
            });
          }
        }

        await adminClient.from("player_questions").insert(allQuestionsToInsert);
      }

      addRoomEvent(cleanCode, {
        room_code: cleanCode,
        type: "join",
        player_id: "host",
        nickname: "Organizador",
        message: "¡La partida ha iniciado! 10 preguntas en juego.",
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (e) {
      console.warn("Supabase start failed, using memory:", e);
    }
  }

  // MemoryDb fallback
  const room = memoryDb.rooms.get(cleanCode);
  if (!room) return { error: "Sala no encontrada" };
  if (room.host_token !== hostToken) return { error: "No autorizado como organizador" };
  if (room.status !== "waiting") return { error: "La sala ya ha sido iniciada" };

  room.status = "playing";
  const playerIds = memoryDb.roomPlayers.get(room.id) || [];
  const nowIso = new Date().toISOString();

  for (const pid of playerIds) {
    const generated = generateMatchQuestions();
    const pQuestions: PlayerQuestion[] = generated.map((q) => ({
      id: "q_" + Math.random().toString(36).substring(2, 9),
      player_id: pid,
      question_index: q.questionIndex,
      level: q.level,
      question_type: q.questionType,
      prompt_latex: q.promptLatex,
      options_latex: q.optionsLatex || null,
      correct_answer: q.correctAnswer,
      explanation_latex: q.explanationLatex,
      started_at: q.questionIndex === 0 ? nowIso : null,
      answered_at: null,
      is_correct: null,
    }));
    memoryDb.questions.set(pid, pQuestions);
  }

  addRoomEvent(cleanCode, {
    room_code: cleanCode,
    type: "join",
    player_id: "host",
    nickname: "Organizador",
    message: "¡La partida ha iniciado! 10 preguntas en juego.",
    timestamp: new Date().toISOString(),
  });

  return { success: true };
}

// Compute Question Difficulty Statistics across all players
function calculateQuestionStats(playerIds: string[]): QuestionAccuracyStat[] {
  const stats: QuestionAccuracyStat[] = [];
  for (let idx = 0; idx < 10; idx++) {
    let correct = 0;
    let wrong = 0;
    for (const pid of playerIds) {
      const qList = memoryDb.questions.get(pid) || [];
      const q = qList.find((item) => item.question_index === idx);
      if (q && q.answered_at) {
        if (q.is_correct) correct++;
        else wrong++;
      }
    }
    const total = correct + wrong;
    stats.push({
      questionIndex: idx,
      correctCount: correct,
      wrongCount: wrong,
      totalAnswered: total,
      accuracyPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    });
  }
  return stats;
}

export async function getGameRoomState(code: string, playerToken?: string) {
  const cleanCode = code.trim().toUpperCase();

  if (isRealSupabaseAvailable() && adminClient) {
    try {
      const { data: room, error: roomErr } = await adminClient
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (roomErr || !room) return { error: "Sala no encontrada" };

      const { data: players } = await adminClient
        .from("players")
        .select("*")
        .eq("room_id", room.id);

      const allPlayers: Player[] = (players as Player[]) || [];
      const leaderboard = sortPlayersForLeaderboard(allPlayers);

      let currentPlayer: Player | null = null;
      let currentQuestion: any = null;

      if (playerToken) {
        currentPlayer = allPlayers.find((p) => p.player_token === playerToken) || null;

        if (currentPlayer && room.status === "playing") {
          const { data: qData } = await adminClient
            .from("player_questions")
            .select("question_index, level, question_type, prompt_latex, options_latex, started_at")
            .eq("player_id", currentPlayer.id)
            .eq("question_index", currentPlayer.current_question_index)
            .maybeSingle();

          currentQuestion = qData || null;
        }
      }

      // Check if all players finished or eliminated
      if (
        room.status === "playing" &&
        allPlayers.length > 0 &&
        allPlayers.every((p) => p.status === "eliminado" || p.status === "terminado" || p.current_question_index >= 10)
      ) {
        await adminClient.from("rooms").update({ status: "finished" }).eq("id", room.id);
        room.status = "finished";
      }

      // Moderator stats
      const totalP = allPlayers.length || 1;
      const moderatorStats: ModeratorStats = {
        totalPlayers: allPlayers.length,
        connectedCount: allPlayers.filter((p) => p.is_connected).length,
        survivedCount: allPlayers.filter((p) => p.danger_parts === 0).length,
        eliminatedCount: allPlayers.filter((p) => p.danger_parts >= 6 || p.status === "eliminado").length,
        inProgressCount: allPlayers.filter((p) => p.danger_parts > 0 && p.danger_parts < 6 && p.status !== "eliminado").length,
        averageScore: Math.round((allPlayers.reduce((acc, p) => acc + p.score, 0) / totalP) * 10) / 10,
        averageTimeMs: Math.round(allPlayers.reduce((acc, p) => acc + p.total_time_ms, 0) / totalP),
        questionStats: calculateQuestionStats(allPlayers.map((p) => p.id)),
      };

      return {
        room: room as Room,
        player: currentPlayer,
        leaderboard,
        currentQuestion,
        events: getRoomEvents(cleanCode),
        moderatorStats,
        serverNow: Date.now(),
      };
    } catch (e) {
      console.warn("Supabase getGameRoomState failed, using memory:", e);
    }
  }

  // MemoryDb fallback
  const room = memoryDb.rooms.get(cleanCode);
  if (!room) return { error: "Sala no encontrada" };

  const playerIds = memoryDb.roomPlayers.get(room.id) || [];
  const allPlayers: Player[] = playerIds.map((pid) => memoryDb.players.get(pid)!).filter(Boolean);
  const leaderboard = sortPlayersForLeaderboard(allPlayers);

  let currentPlayer: Player | null = null;
  let currentQuestion: any = null;

  if (playerToken) {
    currentPlayer = allPlayers.find((p) => p.player_token === playerToken) || null;

    if (currentPlayer && room.status === "playing") {
      const qList = memoryDb.questions.get(currentPlayer.id) || [];
      const q = qList.find((item) => item.question_index === currentPlayer!.current_question_index);
      if (q) {
        currentQuestion = {
          question_index: q.question_index,
          level: q.level,
          question_type: q.question_type,
          prompt_latex: q.prompt_latex,
          options_latex: q.options_latex,
          started_at: q.started_at,
        };
      }
    }
  }

  if (
    room.status === "playing" &&
    allPlayers.length > 0 &&
    allPlayers.every((p) => p.status === "eliminado" || p.status === "terminado" || p.current_question_index >= 10)
  ) {
    room.status = "finished";
  }

  const totalP = allPlayers.length || 1;
  const moderatorStats: ModeratorStats = {
    totalPlayers: allPlayers.length,
    connectedCount: allPlayers.filter((p) => p.is_connected).length,
    survivedCount: allPlayers.filter((p) => p.danger_parts === 0).length,
    eliminatedCount: allPlayers.filter((p) => p.danger_parts >= 6 || p.status === "eliminado").length,
    inProgressCount: allPlayers.filter((p) => p.danger_parts > 0 && p.danger_parts < 6 && p.status !== "eliminado").length,
    averageScore: Math.round((allPlayers.reduce((acc, p) => acc + p.score, 0) / totalP) * 10) / 10,
    averageTimeMs: Math.round(allPlayers.reduce((acc, p) => acc + p.total_time_ms, 0) / totalP),
    questionStats: calculateQuestionStats(playerIds),
  };

  return {
    room,
    player: currentPlayer,
    leaderboard,
    currentQuestion,
    events: getRoomEvents(cleanCode),
    moderatorStats,
    serverNow: Date.now(),
  };
}

export async function submitGameAnswer(
  code: string,
  playerToken: string,
  questionIndex: number,
  answer: string
) {
  const cleanCode = code.trim().toUpperCase();

  if (isRealSupabaseAvailable() && adminClient) {
    try {
      const { data: room } = await adminClient
        .from("rooms")
        .select("*")
        .eq("code", cleanCode)
        .single();

      if (!room || room.status !== "playing") {
        return { error: "La sala no está en juego activo" };
      }

      const { data: player } = await adminClient
        .from("players")
        .select("*")
        .eq("room_id", room.id)
        .eq("player_token", playerToken)
        .single();

      if (!player) return { error: "Jugador no encontrado" };
      if (player.status === "eliminado") return { error: "El jugador está eliminado" };
      if (player.current_question_index !== questionIndex) {
        return { error: "Índice de pregunta desincronizado" };
      }

      const { data: question } = await adminClient
        .from("player_questions")
        .select("*")
        .eq("player_id", player.id)
        .eq("question_index", questionIndex)
        .single();

      if (!question) return { error: "Pregunta no encontrada" };
      if (question.answered_at) {
        return { error: "Esta pregunta ya ha sido respondida" };
      }

      const now = Date.now();
      const startedAtMs = question.started_at ? new Date(question.started_at).getTime() : now;
      const elapsedMs = Math.max(0, now - startedAtMs);
      const graceLimitMs = room.time_per_question * 1000 + 2500;
      const isTimeout = elapsedMs > graceLimitMs;

      const isCorrect = !isTimeout && validateAnswer(answer, question.correct_answer, question.question_type);

      let newScore = player.score;
      let newCorrect = player.correct_count;
      let newWrong = player.wrong_count;
      let newDanger = player.danger_parts;
      let newStatus = player.status;

      if (isCorrect) {
        newScore += 1;
        newCorrect += 1;
        newDanger = Math.max(0, newDanger - 1);
      } else {
        newScore = Math.max(0, newScore - 1);
        newWrong += 1;
        newDanger = Math.min(6, newDanger + 1);
      }

      if (newDanger >= 6) {
        newStatus = "eliminado";
      } else if (questionIndex >= 9) {
        newStatus = "terminado";
      }

      const nextIndex = questionIndex + 1;
      const newTotalTimeMs = player.total_time_ms + elapsedMs;

      await adminClient
        .from("player_questions")
        .update({
          answered_at: new Date().toISOString(),
          is_correct: isCorrect,
        })
        .eq("id", question.id);

      if (nextIndex < 10 && newStatus === "jugando") {
        await adminClient
          .from("player_questions")
          .update({ started_at: new Date().toISOString() })
          .eq("player_id", player.id)
          .eq("question_index", nextIndex);
      }

      const { data: updatedPlayer } = await adminClient
        .from("players")
        .update({
          score: newScore,
          correct_count: newCorrect,
          wrong_count: newWrong,
          danger_parts: newDanger,
          status: newStatus,
          current_question_index: nextIndex,
          total_time_ms: newTotalTimeMs,
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.id)
        .select()
        .single();

      // Log event
      if (isCorrect) {
        addRoomEvent(cleanCode, {
          room_code: cleanCode,
          type: "answer_correct",
          player_id: player.id,
          nickname: player.nickname,
          question_index: questionIndex,
          danger_parts: newDanger,
          score: newScore,
          message: `${player.nickname} respondió CORRECTO la Pregunta ${questionIndex + 1} (+1 punto, ${newDanger}/6 peligro)`,
          timestamp: new Date().toISOString(),
        });
        if (newDanger === 0) {
          addRoomEvent(cleanCode, {
            room_code: cleanCode,
            type: "saved",
            player_id: player.id,
            nickname: player.nickname,
            message: `🎉 ¡${player.nickname} ha SALVADO su muñeco! (0/6 peligro)`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        addRoomEvent(cleanCode, {
          room_code: cleanCode,
          type: "answer_wrong",
          player_id: player.id,
          nickname: player.nickname,
          question_index: questionIndex,
          danger_parts: newDanger,
          score: newScore,
          message: `${player.nickname} ${isTimeout ? "agotó el tiempo en" : "falló"} la Pregunta ${questionIndex + 1} (-1 punto, ${newDanger}/6 peligro)`,
          timestamp: new Date().toISOString(),
        });
        if (newDanger >= 6) {
          addRoomEvent(cleanCode, {
            room_code: cleanCode,
            type: "eliminated",
            player_id: player.id,
            nickname: player.nickname,
            message: `💀 ¡El muñeco de ${player.nickname} fue AHORCADO! (Eliminado)`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      return {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanationLatex: question.explanation_latex,
        updatedPlayer: updatedPlayer as Player,
        isTimeout,
        isDollSaved: newDanger === 0,
        isDollDead: newDanger >= 6,
        gameOver: newStatus !== "jugando",
      };
    } catch (e) {
      console.warn("Supabase submitGameAnswer error, using memory:", e);
    }
  }

  // MemoryDb fallback
  const room = memoryDb.rooms.get(cleanCode);
  if (!room || room.status !== "playing") {
    return { error: "La sala no está en juego activo" };
  }

  const playerIds = memoryDb.roomPlayers.get(room.id) || [];
  const player = playerIds.map((pid) => memoryDb.players.get(pid)!).find((p) => p?.player_token === playerToken);

  if (!player) return { error: "Jugador no encontrado" };
  if (player.status === "eliminado") return { error: "El jugador está eliminado" };
  if (player.current_question_index !== questionIndex) {
    return { error: "Índice de pregunta desincronizado" };
  }

  const qList = memoryDb.questions.get(player.id) || [];
  const question = qList.find((q) => q.question_index === questionIndex);

  if (!question) return { error: "Pregunta no encontrada" };
  if (question.answered_at) {
    return { error: "Esta pregunta ya ha sido respondida" };
  }

  const now = Date.now();
  const startedAtMs = question.started_at ? new Date(question.started_at).getTime() : now;
  const elapsedMs = Math.max(0, now - startedAtMs);
  const graceLimitMs = room.time_per_question * 1000 + 2500;
  const isTimeout = elapsedMs > graceLimitMs;

  const isCorrect = !isTimeout && validateAnswer(answer, question.correct_answer, question.question_type);

  if (isCorrect) {
    player.score += 1;
    player.correct_count += 1;
    player.danger_parts = Math.max(0, player.danger_parts - 1);
  } else {
    player.score = Math.max(0, player.score - 1);
    player.wrong_count += 1;
    player.danger_parts = Math.min(6, player.danger_parts + 1);
  }

  if (player.danger_parts >= 6) {
    player.status = "eliminado";
  } else if (questionIndex >= 9) {
    player.status = "terminado";
  }

  const nextIndex = questionIndex + 1;
  player.current_question_index = nextIndex;
  player.total_time_ms += elapsedMs;
  player.updated_at = new Date().toISOString();

  question.answered_at = new Date().toISOString();
  question.is_correct = isCorrect;

  if (nextIndex < 10 && player.status === "jugando") {
    const nextQ = qList.find((q) => q.question_index === nextIndex);
    if (nextQ) {
      nextQ.started_at = new Date().toISOString();
    }
  }

  // Record live events
  if (isCorrect) {
    addRoomEvent(cleanCode, {
      room_code: cleanCode,
      type: "answer_correct",
      player_id: player.id,
      nickname: player.nickname,
      question_index: questionIndex,
      danger_parts: player.danger_parts,
      score: player.score,
      message: `${player.nickname} respondió CORRECTO la Pregunta ${questionIndex + 1} (+1 punto, ${player.danger_parts}/6 peligro)`,
      timestamp: new Date().toISOString(),
    });
    if (player.danger_parts === 0) {
      addRoomEvent(cleanCode, {
        room_code: cleanCode,
        type: "saved",
        player_id: player.id,
        nickname: player.nickname,
        message: `🎉 ¡${player.nickname} ha SALVADO su muñeco! (0/6 peligro)`,
        timestamp: new Date().toISOString(),
      });
    }
  } else {
    addRoomEvent(cleanCode, {
      room_code: cleanCode,
      type: "answer_wrong",
      player_id: player.id,
      nickname: player.nickname,
      question_index: questionIndex,
      danger_parts: player.danger_parts,
      score: player.score,
      message: `${player.nickname} ${isTimeout ? "agotó el tiempo en" : "falló"} la Pregunta ${questionIndex + 1} (-1 punto, ${player.danger_parts}/6 peligro)`,
      timestamp: new Date().toISOString(),
    });
    if (player.danger_parts >= 6) {
      addRoomEvent(cleanCode, {
        room_code: cleanCode,
        type: "eliminated",
        player_id: player.id,
        nickname: player.nickname,
        message: `💀 ¡El muñeco de ${player.nickname} fue AHORCADO! (Eliminado)`,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (nextIndex >= 10 && player.status !== "eliminado") {
    addRoomEvent(cleanCode, {
      room_code: cleanCode,
      type: "finished",
      player_id: player.id,
      nickname: player.nickname,
      message: `🏁 ${player.nickname} completó las 10 preguntas (${player.correct_count}/10 aciertos)`,
      timestamp: new Date().toISOString(),
    });
  }

  return {
    isCorrect,
    correctAnswer: question.correct_answer,
    explanationLatex: question.explanation_latex,
    updatedPlayer: player,
    isTimeout,
    isDollSaved: player.danger_parts === 0,
    isDollDead: player.danger_parts >= 6,
    gameOver: player.status !== "jugando",
  };
}

export async function manageRoomAction(
  code: string,
  hostToken: string,
  action: "finish" | "kick",
  targetPlayerId?: string
) {
  const cleanCode = code.trim().toUpperCase();
  const room = memoryDb.rooms.get(cleanCode);
  if (!room || room.host_token !== hostToken) {
    return { error: "No autorizado" };
  }

  if (action === "finish") {
    room.status = "finished";
    addRoomEvent(cleanCode, {
      room_code: cleanCode,
      type: "finished",
      player_id: "host",
      nickname: "Organizador",
      message: "El organizador ha finalizado la partida.",
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  if (action === "kick" && targetPlayerId) {
    const player = memoryDb.players.get(targetPlayerId);
    if (player) {
      const pIds = memoryDb.roomPlayers.get(room.id) || [];
      memoryDb.roomPlayers.set(
        room.id,
        pIds.filter((id) => id !== targetPlayerId)
      );
      memoryDb.players.delete(targetPlayerId);

      addRoomEvent(cleanCode, {
        room_code: cleanCode,
        type: "kicked",
        player_id: targetPlayerId,
        nickname: player.nickname,
        message: `${player.nickname} fue retirado de la sala por el organizador`,
        timestamp: new Date().toISOString(),
      });
      return { success: true };
    }
  }

  return { error: "Acción no reconocida" };
}
