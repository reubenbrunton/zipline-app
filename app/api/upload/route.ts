import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const client = serviceKey
    ? createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
    : supabase;

  // Ensure bucket exists (only possible with service role key)
  if (serviceKey) {
    const { data: buckets } = await (client as ReturnType<typeof createAdminClient>).storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "uploads");
    if (!bucketExists) {
      await (client as ReturnType<typeof createAdminClient>).storage.createBucket("uploads", { public: true });
    }
  }

  const ext = file.name.split(".").pop() ?? "png";
  const path = `email-previews/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await client.storage
    .from("uploads")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: { publicUrl } } = client.storage.from("uploads").getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
