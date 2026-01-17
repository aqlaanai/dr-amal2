import { NextResponse } from 'next/server';
import { getPrisma } from '@/repositories/BaseRepository';

/**
 * GET /api/health/readiness
 * 
 * Readiness probe - checks if the service can handle traffic
 * Kubernetes uses this to route traffic to the pod
 * 
 * Checks:
 * - Database connectivity
 * 
 * Returns 200 if ready, 503 if not ready
 */
export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {};

  // Check database connectivity
  try {
    const prisma = getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok' };
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Determine overall status
  const allHealthy = Object.values(checks).every((check) => check.status === 'ok');
  const status = allHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status }
  );
}
