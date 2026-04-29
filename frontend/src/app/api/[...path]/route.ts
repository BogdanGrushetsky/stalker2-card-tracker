import { NextRequest, NextResponse } from 'next/server';

// Runs server-side → BACKEND_URL from docker-compose env is always available at runtime
const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';

async function proxy(req: NextRequest, context: { params: { path: string[] } }) {
  const url = `${BACKEND}/${context.params.path.join('/')}`;

  const headers: HeadersInit = {};
  const ct   = req.headers.get('content-type');
  const auth = req.headers.get('authorization');
  if (ct)   headers['content-type']  = ct;
  if (auth) headers['authorization'] = auth;

  const body =
    req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;

  const res  = await fetch(url, { method: req.method, headers, body });
  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}

export const GET    = proxy;
export const POST   = proxy;
export const PATCH  = proxy;
export const PUT    = proxy;
export const DELETE = proxy;
