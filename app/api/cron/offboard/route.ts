import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Called daily by Vercel cron. Removes contacts from the pipeline
// if they've been in the Onboarded stage for 7+ days.
export async function GET(req: NextRequest) {
  // Vercel cron passes Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("crm_contacts")
    .update({ pipeline_stage: "" })
    .eq("pipeline_stage", "Onboarded")
    .lt("onboarded_at", cutoff)
    .select("id, company");

  if (error) {
    console.error("Offboard cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`Offboarded ${data?.length ?? 0} contacts:`, data?.map((c) => c.company));
  return NextResponse.json({ offboarded: data?.length ?? 0, contacts: data?.map((c) => c.company) });
}
