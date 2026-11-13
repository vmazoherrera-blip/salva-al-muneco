import { NextResponse } from "next/server";
import { createGameRoom, isValidModeratorKey } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const timePerQuestion = typeof body.timePerQuestion === "number" ? body.timePerQuestion : 60;
    const maxPlayers = typeof body.maxPlayers === "number" ? body.maxPlayers : 30;
    const secretKey = typeof body.secretKey === "string" ? body.secretKey : body.moderatorKey;

    if (!isValidModeratorKey(secretKey)) {
      return NextResponse.json(
        {
          success: false,
          error: "Clave secreta incorrecta. Solo docentes o moderadores autorizados pueden crear salas.",
        },
        { status: 403 }
      );
    }

    const { room, hostToken } = await createGameRoom(timePerQuestion, maxPlayers, secretKey);

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
