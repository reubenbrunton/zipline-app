import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeamOwnerEmail } from "@/lib/team-admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!isTeamOwnerEmail(user.email)) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, resend_template_id, variables, preview_image_url } = body;

  if (!name?.trim() || !resend_template_id?.trim()) {
    return NextResponse.json({ error: "name and resend_template_id are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("email_templates")
    .insert({ name: name.trim(), description: description?.trim() ?? null, resend_template_id: resend_template_id.trim(), variables: variables ?? [], preview_image_url: preview_image_url?.trim() ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
