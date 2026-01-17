import { PrismaClient } from '@prisma/client';
import { RequestContext } from '@/types/context';

/**
 * Base repository providing Prisma client access with context enforcement
 * 
 * ARCHITECTURAL RULES:
 * - All database access must go through repositories
 * - Controllers/routes must NEVER import Prisma directly
 * - Context is always required for audit trail
 */
export class BaseRepository {
  protected prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    // Use provided instance or create singleton
    this.prisma = prisma || getPrismaClient();
  }

  /**
   * Get Prisma client for database operations
   * Context is passed for future tenant isolation and audit requirements
   */
  protected getClient(context?: RequestContext): PrismaClient {
    // Future: Apply tenant filtering here if multi-tenant
    // Future: Start transaction with context metadata
    return this.prisma;
  }

  /**
   * Health check - verify database connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton Prisma client instance
let prismaInstance: PrismaClient | null = null;
let isBuildTime = false;

/**
 * Get or create singleton Prisma client
 * Prevents connection pool exhaustion in serverless environments
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    try {
      const options: any = {
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      };
      
      // Use SQLite adapter in test mode
      if (process.env.PRISMA_TEST_MODE === 'true') {
        try {
          const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
          options.adapter = new PrismaBetterSqlite3({ url: 'file:./test.db' });
        } catch (err) {
          console.warn('SQLite adapter not available:', err);
        }
      }
      
      prismaInstance = new PrismaClient(options);
    } catch (err) {
      // During build, Prisma might fail to initialize if DATABASE_URL is not valid
      // Create a dummy client that won't be used at runtime
      isBuildTime = true;
      console.warn('Prisma initialization failed (likely during build):', (err as Error).message);
      
      // Return a mock PrismaClient for build purposes
      prismaInstance = new PrismaClient({
        log: ['error'],
      } as any) as PrismaClient;
    }
  }
  return prismaInstance;
}

/**
 * Export singleton for service layer usage
 */
export function getPrisma(): PrismaClient {
  return getPrismaClient();
}

/**
 * Clear singleton instance (for testing)
 */
export function resetPrisma(): void {
  if (prismaInstance) {
    // Don't disconnect here - let the caller handle it
    prismaInstance = null;
  }
}
