import { NextResponse } from "next/server";
import { startGameRoom } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, hostToken } = body;

    if (!code || !hostToken) {
      return NextResponse.json(
        { success: false, error: "Código y hostToken son requeridos" },
        { status: 400 }
      );
    }

    const result = await startGameRoom(code, hostToken);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al iniciar la partida" },
      { status: 500 }
    );
  }
}
