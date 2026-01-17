/**
 * Metrics collection for production observability
 * 
 * Requirements:
 * - Track auth success/failure
 * - Track read vs write operations
 * - Track state transition counts
 * - Track AI invocation counts
 * - Track error rates
 * 
 * Usage:
 * ```typescript
 * metrics.incrementCounter('auth.signin.success');
 * metrics.recordDuration('api.read.patients', 150);
 * ```
 */

export enum MetricCategory {
  AUTH = 'auth',
  READ = 'read',
  WRITE = 'write',
  AI = 'ai',
  STATE_TRANSITION = 'state_transition',
  ERROR = 'error',
  AUDIT = 'audit',
}

interface CounterMetric {
  count: number;
  lastUpdated: Date;
}

interface DurationMetric {
  count: number;
  total: number;
  min: number;
  max: number;
  avg: number;
  lastUpdated: Date;
}

interface MetricsStore {
  counters: Map<string, CounterMetric>;
  durations: Map<string, DurationMetric>;
}

class Metrics {
  private static instance: Metrics;
  private store: MetricsStore;

  private constructor() {
    this.store = {
      counters: new Map(),
      durations: new Map(),
    };

    // Cleanup old metrics every hour
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  }

  static getInstance(): Metrics {
    if (!Metrics.instance) {
      Metrics.instance = new Metrics();
    }
    return Metrics.instance;
  }

  /**
   * Increment a counter metric
   */
  incrementCounter(name: string, value: number = 1): void {
    const existing = this.store.counters.get(name);

    if (existing) {
      existing.count += value;
      existing.lastUpdated = new Date();
    } else {
      this.store.counters.set(name, {
        count: value,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Record a duration (in milliseconds)
   */
  recordDuration(name: string, duration: number): void {
    const existing = this.store.durations.get(name);

    if (existing) {
      existing.count += 1;
      existing.total += duration;
      existing.min = Math.min(existing.min, duration);
      existing.max = Math.max(existing.max, duration);
      existing.avg = existing.total / existing.count;
      existing.lastUpdated = new Date();
    } else {
      this.store.durations.set(name, {
        count: 1,
        total: duration,
        min: duration,
        max: duration,
        avg: duration,
        lastUpdated: new Date(),
      });
    }
  }

  /**
   * Get all metrics (for /metrics endpoint)
   */
  getAll(): {
    counters: Record<string, CounterMetric>;
    durations: Record<string, DurationMetric>;
  } {
    return {
      counters: Object.fromEntries(this.store.counters),
      durations: Object.fromEntries(this.store.durations),
    };
  }

  /**
   * Get specific metric
   */
  getCounter(name: string): number {
    return this.store.counters.get(name)?.count || 0;
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.store.counters.clear();
    this.store.durations.clear();
  }

  /**
   * Cleanup metrics older than 24 hours
   */
  private cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Cleanup old counters
    for (const [key, value] of this.store.counters.entries()) {
      if (value.lastUpdated < cutoff) {
        this.store.counters.delete(key);
      }
    }

    // Cleanup old durations
    for (const [key, value] of this.store.durations.entries()) {
      if (value.lastUpdated < cutoff) {
        this.store.durations.delete(key);
      }
    }
  }
}

// Export singleton instance
export const metrics = Metrics.getInstance();

/**
 * Helper to track API operation duration
 */
export async function trackDuration<T>(
  metricName: string,
  operation: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    metrics.recordDuration(metricName, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordDuration(`${metricName}.error`, duration);
    throw error;
  }
}
