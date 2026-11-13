import { NextResponse } from "next/server";
import { joinGameRoom } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, nickname, playerToken } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "El código de sala es obligatorio" },
        { status: 400 }
      );
    }

    if (!nickname || typeof nickname !== "string" || !nickname.trim()) {
      return NextResponse.json(
        { success: false, error: "El apodo es obligatorio" },
        { status: 400 }
      );
    }

    const result = await joinGameRoom(code, nickname, playerToken);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      room: result.room,
      player: result.player,
      playerToken: result.playerToken,
    });
  } catch (error: any) {
    console.error("Error joining room:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al unirse a la sala" },
      { status: 500 }
    );
  }
}
