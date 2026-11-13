import { NextResponse } from "next/server";
import { manageRoomAction } from "@/lib/game/game-store";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { code, hostToken, action, targetPlayerId } = body;

    if (!code || !hostToken || !action) {
      return NextResponse.json(
        { success: false, error: "Parámetros incompletos" },
        { status: 400 }
      );
    }

    const result = await manageRoomAction(code, hostToken, action, targetPlayerId);

    if (result.error) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Error al gestionar la sala" },
      { status: 500 }
    );
  }
}
