import { NextResponse } from "next/server";
import { createGameRoom } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const timePerQuestion = typeof body.timePerQuestion === "number" ? body.timePerQuestion : 60;
    const maxPlayers = typeof body.maxPlayers === "number" ? body.maxPlayers : 30;

    const { room, hostToken } = await createGameRoom(timePerQuestion, maxPlayers);

    return NextResponse.json({
      success: true,
      room,
      hostToken,
    });
  } catch (error: any) {
    console.error("Error creating room:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al crear la sala" },
      { status: 500 }
    );
  }
}
