import { NextResponse } from 'next/server';

/**
 * GET /api/health/liveness
 * 
 * Liveness probe - checks if the service is running
 * Kubernetes uses this to restart the pod if it fails
 * 
 * Returns 200 if service is alive
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
