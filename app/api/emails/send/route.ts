import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const { resendTemplateId, templateId, templateName, toEmail, toName, contactId, variables } = await req.json();

  if (!resendTemplateId || !toEmail) {
    return NextResponse.json({ error: "resendTemplateId and toEmail are required" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const uppercasedVars = Object.fromEntries(
    Object.entries(variables ?? {}).map(([k, v]) => [k.toUpperCase(), v])
  );

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Zipline Team <team@ziplinemarketing.com.au>",
      to: toEmail,
      template: {
        id: resendTemplateId,
        variables: uppercasedVars,
      },
    }),
  });

  if (!resendRes.ok) {
    const err = await resendRes.json().catch(() => ({}));
    console.error("Resend error:", err);
    return NextResponse.json({ error: err?.message ?? "Failed to send email" }, { status: 502 });
  }

  // Log the send
  await supabase.from("email_sends").insert({
    template_id: templateId ?? null,
    template_name: templateName ?? null,
    to_email: toEmail,
    to_name: toName ?? null,
    contact_id: contactId ?? null,
    variables: variables ?? {},
    sent_by: user.id,
  });

  return NextResponse.json({ success: true });
}
