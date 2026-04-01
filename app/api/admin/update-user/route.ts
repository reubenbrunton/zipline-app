import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireTeamOwner } from "../_utils";

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireTeamOwner();
  if (errorResponse) return errorResponse;

  const { user_id, full_name, email, phone } = await req.json();

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const nextEmail = email.trim().toLowerCase();
  const nextPhone = phone?.trim() || null;
  const nextName = full_name.trim();

  const [{ data: profile, error: profileLookupError }, { data: authData, error: authLookupError }] = await Promise.all([
    admin.from("profiles").select("email, avatar_url").eq("id", user_id).maybeSingle(),
    admin.auth.admin.getUserById(user_id),
  ]);

  if (profileLookupError) {
    return NextResponse.json({ error: profileLookupError.message }, { status: 400 });
  }

  if (authLookupError || !authData.user) {
    return NextResponse.json({ error: authLookupError?.message ?? "User not found." }, { status: 400 });
  }

  const previousEmail = (authData.user.email ?? profile?.email ?? "").toLowerCase();
  const metadata = {
    ...(authData.user.user_metadata ?? {}),
    full_name: nextName,
    phone: nextPhone,
  };

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(user_id, {
    email: nextEmail,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (authUpdateError) {
    return NextResponse.json({ error: authUpdateError.message }, { status: 400 });
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: user_id,
    full_name: nextName,
    email: nextEmail,
    phone: nextPhone,
    avatar_url: profile?.avatar_url ?? null,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  if (previousEmail && previousEmail !== nextEmail) {
    await admin.from("allowed_emails").delete().eq("email", previousEmail);
  }

  const { error: allowedEmailError } = await admin.from("allowed_emails").upsert({
    email: nextEmail,
  });

  if (allowedEmailError) {
    return NextResponse.json({ error: allowedEmailError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
