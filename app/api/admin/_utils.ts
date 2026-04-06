import { createClient as createAdminClientBase } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { TEAM_ADMIN_EMAILS, isTeamOwnerEmail } from "@/lib/team-admin";

export async function requireTeamOwner() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "You must be signed in." }, { status: 401 }),
    };
  }

  if (!isTeamOwnerEmail(user.email)) {
    return {
      user,
      errorResponse: NextResponse.json(
        { error: `Only admins (${TEAM_ADMIN_EMAILS.join(", ")}) can manage team members.` },
        { status: 403 }
      ),
    };
  }

  return { user, errorResponse: null };
}

export function createAdminClient() {
  return createAdminClientBase(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
