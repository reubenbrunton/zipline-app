import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireTeamOwner } from "../_utils";

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireTeamOwner();
  if (errorResponse) return errorResponse;

  const { user_id, blocked_pages } = await req.json();

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  if (!Array.isArray(blocked_pages)) {
    return NextResponse.json({ error: "blocked_pages must be an array" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ blocked_pages })
    .eq("id", user_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true });
}
