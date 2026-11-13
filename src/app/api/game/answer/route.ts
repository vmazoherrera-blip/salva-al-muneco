import { NextResponse } from "next/server";
import { submitGameAnswer } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, playerToken, questionIndex, answer } = body;

    if (!code || !playerToken || typeof questionIndex !== "number" || answer === undefined) {
      return NextResponse.json(
        { success: false, error: "Datos incompletos para responder" },
        { status: 400 }
      );
    }

    const result = await submitGameAnswer(code, playerToken, questionIndex, String(answer));

    if ("error" in result && result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("Error submitting answer:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al procesar la respuesta" },
      { status: 500 }
    );
  }
}
