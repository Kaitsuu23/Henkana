import { NextResponse } from 'next/server';

export function ok(data: object, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export function handleError(e: any) {
  const status = e?.statusCode || 500;
  const code   = e?.code || 'INTERNAL_SERVER_ERROR';
  const message = e?.message || 'Terjadi kesalahan pada server';
  return err(code, message, status);
}
