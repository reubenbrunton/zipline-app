import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST — share a calendar with a user
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calendar_id, calendar_name, calendar_color, shared_with_id } = await req.json();
  if (!calendar_id || !shared_with_id) {
    return NextResponse.json({ error: "calendar_id and shared_with_id required" }, { status: 400 });
  }

  const { error } = await supabase.from("calendar_shares").upsert({
    owner_id: user.id,
    shared_with: shared_with_id,
    calendar_id,
    calendar_name: calendar_name ?? null,
    calendar_color: calendar_color ?? "#6366F1",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — unshare a calendar from a user
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calendar_id, shared_with_id } = await req.json();

  const { error } = await supabase
    .from("calendar_shares")
    .delete()
    .eq("owner_id", user.id)
    .eq("shared_with", shared_with_id)
    .eq("calendar_id", calendar_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// GET — list shares for calendars owned by current user
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("calendar_shares")
    .select("id, calendar_id, calendar_name, calendar_color, shared_with")
    .eq("owner_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ shares: data ?? [] });
}
