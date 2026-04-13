import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Fuzzy match helpers
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Returns a score 0–1 indicating how confident we are these refer to the same contact.
// Higher = more confident.
function matchScore(
  formFields: Record<string, string>,
  contact: { company: string; email?: string | null; phone?: string | null; website?: string | null }
): number {
  let score = 0;

  const formEmail   = formFields["work_email"]   ?? formFields["email"]         ?? "";
  const formCompany = formFields["business_name"] ?? formFields["company"]       ?? "";
  const formPhone   = formFields["mobile_number"] ?? formFields["phone"]         ?? "";
  const formWebsite = formFields["business_website"] ?? formFields["website"]    ?? "";

  // Exact email match — very high confidence
  if (formEmail && contact.email && normalize(formEmail) === normalize(contact.email)) {
    score += 0.7;
  }

  // Company name similarity (normalised substring or full match)
  if (formCompany && contact.company) {
    const a = normalize(formCompany);
    const b = normalize(contact.company);
    if (a === b) {
      score += 0.5;
    } else if (a.includes(b) || b.includes(a)) {
      score += 0.3;
    }
  }

  // Phone match
  const digitsOnly = (s: string) => s.replace(/\D/g, "");
  if (formPhone && contact.phone) {
    const a = digitsOnly(formPhone);
    const b = digitsOnly(contact.phone);
    if (a && b && (a.endsWith(b.slice(-8)) || b.endsWith(a.slice(-8)))) {
      score += 0.4;
    }
  }

  // Website match (strip protocol/www)
  const stripDomain = (s: string) => normalize(s).replace(/^(https?|www)/, "").replace(/\/$/, "");
  if (formWebsite && contact.website) {
    const a = stripDomain(formWebsite);
    const b = stripDomain(contact.website);
    if (a && b && (a === b || a.includes(b) || b.includes(a))) {
      score += 0.4;
    }
  }

  return score;
}

// ---------------------------------------------------------------------------
// Field mapping from Fillout field names → crm_contacts columns
// Update the left-hand keys to match your exact Fillout field names
// ---------------------------------------------------------------------------
const FIELD_MAP: Record<string, string> = {
  business_name:            "company",
  business_website:         "website",
  business_address:         "business_address",
  lead_full_name:           "contact",
  mobile_number:            "phone",
  work_email:               "email",
  job_position:             "job_position",
  preferred_billing_email:  "billing_email",
  billing_email:            "billing_email",
  has_branding_assets:      "has_branding_assets",
  service_agreement_signed: "service_agreement_signed",
};

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const secret = process.env.ONBOARDING_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const querySecret = req.nextUrl.searchParams.get("secret");
  const authHeader  = req.headers.get("authorization")?.replace("Bearer ", "");
  if (querySecret !== secret && authHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Parse fields — handle Fillout's { formid, formname, submission: {...} } wrapper,
  // Fillout's questions array format, and Zapier-flattened payloads
  const fields: Record<string, string> = {};

  // Unwrap Fillout's top-level submission object if present
  const data: Record<string, unknown> =
    (body.submission && typeof body.submission === "object" && !Array.isArray(body.submission))
      ? (body.submission as Record<string, unknown>)
      : body;

  if (Array.isArray(data.questions)) {
    // Fillout native: { questions: [{ name, value }] }
    for (const q of data.questions as Array<{ name?: string; value?: unknown }>) {
      if (q.name && q.value !== undefined && q.value !== null && q.value !== "") {
        fields[q.name.toLowerCase().replace(/[\s-]+/g, "_")] = String(q.value);
      }
    }
  } else {
    // Flat key/value object (Zapier or direct POST)
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined && v !== null && v !== "") {
        fields[k.toLowerCase().replace(/[\s-]+/g, "_")] = String(v);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Find best matching contact via fuzzy scoring
  // ---------------------------------------------------------------------------
  const supabase = getServiceClient();

  const { data: allContacts, error: fetchErr } = await supabase
    .from("crm_contacts")
    .select("id, company, email, phone, website");

  if (fetchErr) {
    console.error("Webhook fetch contacts error:", fetchErr);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const CONFIDENCE_THRESHOLD = 0.5; // at least 0.5 to consider a match

  let bestId: string | null = null;
  let bestScore = 0;

  for (const c of allContacts ?? []) {
    const score = matchScore(fields, c);
    if (score > bestScore) {
      bestScore = score;
      bestId = c.id;
    }
  }

  // ---------------------------------------------------------------------------
  // Build the patch
  // ---------------------------------------------------------------------------
  const patch: Record<string, unknown> = {};

  for (const [formKey, dbKey] of Object.entries(FIELD_MAP)) {
    const value = fields[formKey];
    if (value === undefined || value === "") continue;

    if (dbKey === "service_agreement_signed") {
      const signed = ["true", "yes", "1", "signed"].includes(value.toLowerCase());
      patch[dbKey] = signed;
      if (signed) patch["service_agreement_signed_at"] = new Date().toISOString();
    } else if (dbKey === "has_branding_assets") {
      patch[dbKey] = value.toLowerCase().startsWith("y") ? "yes" : "no";
    } else {
      patch[dbKey] = value;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No recognisable fields in payload", received_keys: Object.keys(fields) }, { status: 400 });
  }

  // ---------------------------------------------------------------------------
  // Update existing OR create new contact
  // ---------------------------------------------------------------------------
  if (bestId && bestScore >= CONFIDENCE_THRESHOLD) {
    // Update the matched contact
    const { error: updateErr } = await supabase
      .from("crm_contacts")
      .update(patch)
      .eq("id", bestId);

    if (updateErr) {
      console.error("Webhook update error:", updateErr);
      return NextResponse.json({ error: "Update failed", detail: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: "updated",
      contact_id: bestId,
      confidence: bestScore,
      fields_applied: Object.keys(patch),
    });
  } else {
    // No confident match — create a new contact
    const company = (fields["business_name"] ?? fields["company"] ?? "").trim();
    if (!company) {
      return NextResponse.json({
        error: "Could not match an existing contact and no business_name provided to create one",
        confidence: bestScore,
        received_keys: Object.keys(fields),
      }, { status: 404 });
    }

    const initials = company.split(/\s+/).slice(0, 2).map((w: string) => w[0]?.toUpperCase() ?? "").join("");
    const LOGO_COLORS = ["#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6","#FF4533","#FF8C00","#06B6D4"];
    const logoColor = LOGO_COLORS[Math.floor(Math.random() * LOGO_COLORS.length)];

    const newContact = {
      company,
      logo_initials: initials,
      logo_color: logoColor,
      pipeline_stage: "Onboarding",
      tags: [],
      sort_order: 0,
      ...(patch as object),
    };

    const { data: created, error: createErr } = await supabase
      .from("crm_contacts")
      .insert(newContact)
      .select("id")
      .single();

    if (createErr) {
      console.error("Webhook create error:", createErr);
      return NextResponse.json({ error: "Create failed", detail: createErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      action: "created",
      contact_id: created.id,
      fields_applied: Object.keys(patch),
    });
  }
}
