import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type as string;

  // Only handle open events
  if (type !== "email.opened") {
    return NextResponse.json({ received: true });
  }

  const emailId = (body.data as Record<string, unknown>)?.email_id as string | undefined;
  if (!emailId) {
    return NextResponse.json({ error: "No email_id in payload" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Find the send record by Resend's email ID
  const { data: send, error: findErr } = await supabase
    .from("email_sends")
    .select("id, opened_at, open_count")
    .eq("resend_email_id", emailId)
    .single();

  if (findErr || !send) {
    // Not found — not an error, just an email we didn't send via the app
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();

  await supabase
    .from("email_sends")
    .update({
      opened_at: send.opened_at ?? now,   // only record first open time
      open_count: (send.open_count ?? 0) + 1,
    })
    .eq("id", send.id);

  return NextResponse.json({ received: true });
}
