import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireTeamOwner } from "../_utils";

export async function POST(req: NextRequest) {
  const { errorResponse } = await requireTeamOwner();
  if (errorResponse) return errorResponse;

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const admin = createAdminClient();

  const { error } = await admin.auth.admin.deleteUser(user_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Remove from allowed_emails too
  const { data: profile } = await admin.from("profiles").select("email").eq("id", user_id).single();
  if (profile?.email) {
    await admin.from("allowed_emails").delete().eq("email", profile.email.toLowerCase());
  }

  return NextResponse.json({ success: true });
}
