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
  const emailId = (body.data as Record<string, unknown>)?.email_id as string | undefined;

  if (!emailId) {
    return NextResponse.json({ received: true });
  }

  // Only handle events we care about
  if (!["email.delivered", "email.clicked", "email.bounced", "email.complained"].includes(type)) {
    return NextResponse.json({ received: true });
  }

  const supabase = getServiceClient();

  const { data: send, error: findErr } = await supabase
    .from("email_sends")
    .select("id, delivery_status")
    .eq("resend_email_id", emailId)
    .single();

  if (findErr || !send) {
    return NextResponse.json({ received: true });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {};

  if (type === "email.delivered") {
    // Only set delivered if not already clicked (clicked is a higher status)
    if (send.delivery_status === "sent") {
      patch.delivery_status = "delivered";
      patch.delivered_at = now;
    }
  } else if (type === "email.clicked") {
    patch.delivery_status = "clicked";
    patch.clicked_at = now;
    // Also backfill delivered_at if we somehow missed that event
    if (!send.delivery_status || send.delivery_status === "sent") {
      patch.delivered_at = now;
    }
  } else if (type === "email.bounced" || type === "email.complained") {
    patch.delivery_status = "bounced";
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("email_sends").update(patch).eq("id", send.id);
  }

  return NextResponse.json({ received: true });
}
