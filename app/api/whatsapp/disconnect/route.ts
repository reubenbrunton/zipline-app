import { NextResponse } from 'next/server';

const WA_SERVER = process.env.WA_SERVER_URL ?? 'http://localhost:3001';

export async function POST() {
  try {
    const res = await fetch(`${WA_SERVER}/disconnect`, {
      method: 'POST',
      cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
