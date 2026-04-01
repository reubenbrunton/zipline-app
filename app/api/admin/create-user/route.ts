import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireTeamOwner } from "../_utils";

function generatePassword(): string {
  const upper = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%";
  const all = upper + lower + digits;

  let pwd = "";
  // Ensure at least one of each required type
  pwd += upper[Math.floor(Math.random() * upper.length)];
  pwd += lower[Math.floor(Math.random() * lower.length)];
  pwd += digits[Math.floor(Math.random() * digits.length)];
  pwd += symbols[Math.floor(Math.random() * symbols.length)];
  // Fill remaining 8 characters
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
}

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireTeamOwner();
  if (errorResponse) return errorResponse;

  const { full_name, email, phone } = await req.json();

  if (!full_name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Name and email are required." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "Server misconfiguration: missing Supabase service role key." }, { status: 500 });
  }

  const admin = createAdminClient();

  const password = generatePassword();

  // Create the auth user
  const { data: { user }, error: createError } = await admin.auth.admin.createUser({
    email: email.trim().toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
    },
  });

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 });
  }

  // Upsert their profile
  const { error: profileError } = await admin.from("profiles").upsert({
    id: user!.id,
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || null,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(user!.id);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Add to allowed_emails whitelist
  const { error: allowedEmailError } = await admin.from("allowed_emails").upsert({
    email: email.trim().toLowerCase(),
  });

  if (allowedEmailError) {
    await admin.auth.admin.deleteUser(user!.id);
    return NextResponse.json({ error: allowedEmailError.message }, { status: 500 });
  }

  return NextResponse.json({ email: email.trim().toLowerCase(), password });
}
