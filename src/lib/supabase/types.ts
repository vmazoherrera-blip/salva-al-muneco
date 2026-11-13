export type RoomStatus = "waiting" | "playing" | "finished";
export type PlayerStatus = "jugando" | "eliminado" | "terminado";
export type QuestionLevel = "basico" | "intermedio" | "avanzado";
export type QuestionType = "multiple_choice" | "numeric";

export type EventType =
  | "join"
  | "reconnect"
  | "answer_correct"
  | "answer_wrong"
  | "saved"
  | "eliminated"
  | "finished"
  | "kicked";

export interface RoomEvent {
  id: string;
  room_code: string;
  type: EventType;
  player_id: string;
  nickname: string;
  question_index?: number;
  danger_parts?: number;
  score?: number;
  message: string;
  timestamp: string;
}

export interface QuestionAccuracyStat {
  questionIndex: number;
  correctCount: number;
  wrongCount: number;
  totalAnswered: number;
  accuracyPct: number;
}

export interface ModeratorStats {
  totalPlayers: number;
  connectedCount: number;
  survivedCount: number;
  eliminatedCount: number;
  inProgressCount: number;
  averageScore: number;
  averageTimeMs: number;
  questionStats: QuestionAccuracyStat[];
}

export interface Room {
  id: string;
  code: string;
  host_token: string;
  status: RoomStatus;
  time_per_question: number;
  max_players: number;
  created_at: string;
}

export interface Player {
  id: string;
  room_id: string;
  player_token: string;
  nickname: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  danger_parts: number;
  status: PlayerStatus;
  current_question_index: number;
  total_time_ms: number;
  is_connected: boolean;
  updated_at: string;
}

export interface PlayerQuestion {
  id: string;
  player_id: string;
  question_index: number;
  level: QuestionLevel;
  question_type: QuestionType;
  prompt_latex: string;
  options_latex: string[] | null;
  correct_answer: string;
  explanation_latex: string;
  started_at: string | null;
  answered_at: string | null;
  is_correct: boolean | null;
}

export interface PublicPlayer {
  id: string;
  player_token?: string;
  nickname: string;
  score: number;
  correct_count: number;
  wrong_count: number;
  danger_parts: number;
  status: PlayerStatus;
  current_question_index: number;
  total_time_ms: number;
  is_connected: boolean;
}

export interface LeaderboardEntry extends PublicPlayer {
  rank: number;
  survival_status: "survived" | "eliminated" | "in_progress";
}

export type { ClientQuestion } from "../math-engine/generator";
