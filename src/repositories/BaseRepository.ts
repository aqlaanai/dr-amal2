/**
 * Base Repository - Shared database access logic
 * Issue 2: Database Foundation
 */

import { PrismaClient } from '@prisma/client';
import { RequestContext } from '@/types/context';

let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client singleton
 */
function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return prismaInstance;
}

/**
 * Get Prisma client (exported for direct use)
 */
export function getPrisma(): PrismaClient {
  return getPrismaClient();
}

/**
 * Base repository class with common database operations
 */
export class BaseRepository {
  protected prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  /**
   * Get Prisma client for transactional operations
   */
  protected getClient(context?: RequestContext): PrismaClient {
    return this.prisma;
  }

  /**
   * Execute operation in a transaction
   */
  protected async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as PrismaClient);
    });
  }
}

/**
 * Close Prisma connection (for testing cleanup)
 */
export async function closePrismaConnection(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
