import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isTeamOwnerEmail } from "@/lib/team-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null, denied: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  if (!isTeamOwnerEmail(user.email)) return { supabase: null, user: null, denied: NextResponse.json({ error: "Admin only" }, { status: 403 }) };
  return { supabase, user, denied: null };
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, denied } = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  const { name, description, resend_template_id, variables, preview_image_url } = body;

  const patch: Record<string, unknown> = {};
  if (name !== undefined) patch.name = name.trim();
  if (description !== undefined) patch.description = description?.trim() ?? null;
  if (resend_template_id !== undefined) patch.resend_template_id = resend_template_id.trim();
  if (variables !== undefined) patch.variables = variables;
  if (preview_image_url !== undefined) patch.preview_image_url = preview_image_url?.trim() ?? null;

  const { data, error } = await supabase!
    .from("email_templates")
    .update(patch)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, denied } = await requireAdmin();
  if (denied) return denied;

  const { error } = await supabase!.from("email_templates").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
