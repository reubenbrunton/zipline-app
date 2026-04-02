import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.slice(0, 20) ?? "MISSING",
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "MISSING",
  });
}
