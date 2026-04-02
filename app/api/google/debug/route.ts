import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdFull: process.env.GOOGLE_CLIENT_ID ?? "MISSING",
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "MISSING",
  });
}
