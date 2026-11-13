import { NextRequest, NextResponse } from "next/server";
import { getGameRoomState } from "@/lib/game/game-store";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const playerToken = searchParams.get("playerToken") || undefined;

    if (!code) {
      return NextResponse.json(
        { success: false, error: "El código de sala es obligatorio" },
        { status: 400 }
      );
    }

    const state = await getGameRoomState(code, playerToken);

    if ("error" in state && state.error) {
      return NextResponse.json({ success: false, error: state.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...state,
    });
  } catch (error: any) {
    if (error?.digest === "NEXT_PRERENDER_INTERRUPTED" || error?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("Error getting room state:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Error al obtener estado" },
      { status: 500 }
    );
  }
}
