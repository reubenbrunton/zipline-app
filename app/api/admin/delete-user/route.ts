import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await admin.auth.admin.deleteUser(user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Remove from allowed_emails too
  const { data: profile } = await admin.from("profiles").select("email").eq("id", user_id).single();
  if (profile?.email) {
    await admin.from("allowed_emails").delete().eq("email", profile.email.toLowerCase());
  }

  return NextResponse.json({ success: true });
}
