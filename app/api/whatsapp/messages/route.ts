import { NextRequest, NextResponse } from 'next/server';

const WA_SERVER = process.env.WA_SERVER_URL ?? 'http://localhost:3001';

export async function GET(req: NextRequest) {
  const jid = req.nextUrl.searchParams.get('jid');
  if (!jid) return NextResponse.json({ error: 'jid required' }, { status: 400 });

  try {
    const res = await fetch(`${WA_SERVER}/messages/${encodeURIComponent(jid)}`, {
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}
