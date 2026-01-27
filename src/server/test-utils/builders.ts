/**
 * Test data builders for creating consistent test fixtures.
 *
 * Builders use the fluent pattern for easy customization:
 * ```typescript
 * const trace = traceBuilder().withError().withDuration(500).build();
 * ```
 */

import type { RequestTrace, AlertRule, AlertHistoryRecord } from 'shared/types';

/**
 * Builder for RequestTrace objects.
 */
export class TraceBuilder {
  private trace: Partial<RequestTrace> = {
    traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    method: 'GET',
    path: '/api/test',
    statusCode: 200,
    durationMs: 50,
    timestamp: new Date().toISOString(),
    userAgent: 'Jest/1.0',
    ip: '127.0.0.1',
  };

  withTraceId(traceId: string): this {
    this.trace.traceId = traceId;
    return this;
  }

  withMethod(method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'): this {
    this.trace.method = method;
    return this;
  }

  withPath(path: string): this {
    this.trace.path = path;
    return this;
  }

  withStatusCode(statusCode: number): this {
    this.trace.statusCode = statusCode;
    return this;
  }

  withDuration(durationMs: number): this {
    this.trace.durationMs = durationMs;
    return this;
  }

  withError(statusCode = 500): this {
    this.trace.statusCode = statusCode;
    return this;
  }

  withTimestamp(timestamp: Date | string): this {
    this.trace.timestamp =
      typeof timestamp === 'string' ? timestamp : timestamp.toISOString();
    return this;
  }

  withUserId(userId: number): this {
    this.trace.userId = userId;
    return this;
  }

  withTiming(timing: RequestTrace['timing']): this {
    this.trace.timing = timing;
    return this;
  }

  build(): RequestTrace {
    return this.trace as RequestTrace;
  }
}

/**
 * Builder for AlertRule objects.
 */
export class AlertRuleBuilder {
  private rule: AlertRule = {
    name: 'Test Alert',
    metric: 'avgDuration',
    threshold: 500,
    windowMinutes: 5,
    cooldownMinutes: 30,
    channels: ['log'],
    enabled: true,
  };

  withName(name: string): this {
    this.rule.name = name;
    return this;
  }

  withMetric(metric: AlertRule['metric']): this {
    this.rule.metric = metric;
    return this;
  }

  withThreshold(threshold: number): this {
    this.rule.threshold = threshold;
    return this;
  }

  withChannels(channels: AlertRule['channels']): this {
    this.rule.channels = channels;
    return this;
  }

  disabled(): this {
    this.rule.enabled = false;
    return this;
  }

  build(): AlertRule {
    return { ...this.rule };
  }
}

/**
 * Builder for AlertHistoryRecord objects.
 */
export class AlertHistoryBuilder {
  private record: Partial<AlertHistoryRecord> = {
    id: 1,
    ruleName: 'Test Alert',
    metric: 'avgDuration',
    threshold: 500,
    actualValue: 600,
    triggeredAt: new Date().toISOString(),
    resolvedAt: undefined,
  };

  withId(id: number): this {
    this.record.id = id;
    return this;
  }

  withRuleName(ruleName: string): this {
    this.record.ruleName = ruleName;
    return this;
  }

  resolved(resolvedAt = new Date()): this {
    this.record.resolvedAt = resolvedAt.toISOString();
    return this;
  }

  build(): AlertHistoryRecord {
    return this.record as AlertHistoryRecord;
  }
}

// Convenience factory functions
export const traceBuilder = () => new TraceBuilder();
export const alertRuleBuilder = () => new AlertRuleBuilder();
export const alertHistoryBuilder = () => new AlertHistoryBuilder();
