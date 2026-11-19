import { NextRequest, NextResponse } from "next/server";
import {
  getRoomMasterQuestions,
  setRoomMasterQuestions,
  regenerateRoomMasterQuestions,
  setRoomSpecialQuizRound,
  isRoomSpecialQuiz,
  getRoomSpecialQuizRound,
} from "@/lib/game/game-store";
import { getSpecialQuizRound } from "@/lib/math-engine/special-quiz";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const hostToken = searchParams.get("hostToken");

    if (!code || !hostToken) {
      return NextResponse.json(
        { success: false, error: "Código de sala y hostToken son obligatorios" },
        { status: 400 }
      );
    }

    const questions = await getRoomMasterQuestions(code);
    return NextResponse.json({
      success: true,
      questions,
      isSpecialQuiz: isRoomSpecialQuiz(code),
      activeRound: getRoomSpecialQuizRound(code),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener preguntas" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, hostToken, action, questions, roundNumber } = body;

    if (!code || !hostToken) {
      return NextResponse.json(
        { success: false, error: "Código y hostToken son obligatorios" },
        { status: 400 }
      );
    }

    if (action === "load_round") {
      const targetRound = roundNumber ?? 1;
      const roundQuestions = getSpecialQuizRound(targetRound);
      await setRoomMasterQuestions(code, roundQuestions);
      setRoomSpecialQuizRound(code, targetRound);
      return NextResponse.json({
        success: true,
        questions: roundQuestions,
        activeRound: targetRound,
        isSpecialQuiz: true,
      });
    }

    if (action === "regenerate") {
      const freshQuestions = await regenerateRoomMasterQuestions(code);
      return NextResponse.json({
        success: true,
        questions: freshQuestions,
        isSpecialQuiz: isRoomSpecialQuiz(code),
        activeRound: getRoomSpecialQuizRound(code),
      });
    }

    if (action === "set" && Array.isArray(questions)) {
      await setRoomMasterQuestions(code, questions);
      return NextResponse.json({ success: true, questions });
    }

    return NextResponse.json(
      { success: false, error: "Acción no válida o preguntas inválidas" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar preguntas" },
      { status: 500 }
    );
  }
}
