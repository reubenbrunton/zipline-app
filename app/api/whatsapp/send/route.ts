import { NextRequest, NextResponse } from 'next/server';

const WA_SERVER = process.env.WA_SERVER_URL ?? 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { jid, text } = body;

  if (!jid || !text) {
    return NextResponse.json({ error: 'jid and text required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${WA_SERVER}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jid, text }),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
