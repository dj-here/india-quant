import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    app: 'KidsMentor Web',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      web: 'UP',
    },
  });
}
