import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("google_calendar_prefs")
    .select("calendar_ids")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({ calendar_ids: data?.calendar_ids ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { calendar_ids } = await req.json();

  await supabase.from("google_calendar_prefs").upsert({
    user_id: user.id,
    calendar_ids: calendar_ids ?? [],
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
