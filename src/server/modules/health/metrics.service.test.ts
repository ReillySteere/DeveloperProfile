import { DataSource } from 'typeorm';
import { MetricsService } from './metrics.service';
import type { TelemetrySnapshot } from 'shared/types';

describe('MetricsService', () => {
  let service: MetricsService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(() => {
    mockDataSource = {
      query: jest.fn().mockResolvedValue([{ '1': 1 }]),
    } as unknown as jest.Mocked<DataSource>;

    service = new MetricsService(mockDataSource);
    service.onModuleInit();
  });

  afterEach(() => {
    service.onModuleDestroy();
  });

  describe('collectSnapshot before init', () => {
    it('should return zero event loop metrics when histogram is not initialized', async () => {
      const uninitializedService = new MetricsService(mockDataSource);
      // Do NOT call onModuleInit, so histogram is null

      const snapshot = await uninitializedService.collectSnapshot();

      expect(snapshot.eventLoop).toEqual({
        lagMs: 0,
        min: 0,
        max: 0,
        mean: 0,
        stddev: 0,
        percentile99: 0,
      });
    });
  });

  describe('collectSnapshot', () => {
    it('should collect a valid telemetry snapshot', async () => {
      const snapshot = await service.collectSnapshot();

      expect(snapshot).toMatchObject({
        timestamp: expect.any(Number),
        eventLoop: expect.objectContaining({
          lagMs: expect.any(Number),
          min: expect.any(Number),
          max: expect.any(Number),
          mean: expect.any(Number),
          stddev: expect.any(Number),
          percentile99: expect.any(Number),
        }),
        memory: expect.objectContaining({
          heapUsedMB: expect.any(Number),
          heapTotalMB: expect.any(Number),
          rssMB: expect.any(Number),
          externalMB: expect.any(Number),
        }),
        database: expect.objectContaining({
          connected: true,
          latencyMs: expect.any(Number),
        }),
        process: expect.objectContaining({
          pid: process.pid,
          nodeVersion: process.version,
          uptimeSeconds: expect.any(Number),
        }),
        chaos: {
          cpuPressure: false,
          memoryPressure: false,
        },
      });
    });

    it('should return database disconnected when query fails', async () => {
      mockDataSource.query.mockRejectedValueOnce(new Error('DB error'));

      const snapshot = await service.collectSnapshot();

      expect(snapshot.database.connected).toBe(false);
      expect(snapshot.database.latencyMs).toBe(-1);
    });
  });

  describe('applyChaosSim', () => {
    let realSnapshot: TelemetrySnapshot;

    beforeEach(async () => {
      realSnapshot = await service.collectSnapshot();
    });

    it('should not modify snapshot when no chaos flags are set', () => {
      const result = service.applyChaosSim(realSnapshot, {
        cpu: false,
        memory: false,
      });

      expect(result.chaos.cpuPressure).toBe(false);
      expect(result.chaos.memoryPressure).toBe(false);
      expect(result.eventLoop.lagMs).toBe(realSnapshot.eventLoop.lagMs);
    });

    it('should simulate CPU pressure with increased lag', () => {
      const result = service.applyChaosSim(realSnapshot, {
        cpu: true,
        memory: false,
      });

      expect(result.chaos.cpuPressure).toBe(true);
      expect(result.eventLoop.lagMs).toBeGreaterThan(30); // Simulated lag is 50-150ms base
      expect(result.database.latencyMs).toBeGreaterThan(
        realSnapshot.database.latencyMs,
      );
    });

    it('should simulate memory pressure with increased heap usage', () => {
      const result = service.applyChaosSim(realSnapshot, {
        cpu: false,
        memory: true,
      });

      expect(result.chaos.memoryPressure).toBe(true);
      expect(result.memory.heapUsedMB).toBeGreaterThan(
        realSnapshot.memory.heapUsedMB,
      );
      expect(result.memory.rssMB).toBeGreaterThan(realSnapshot.memory.rssMB);
    });

    it('should apply both chaos simulations when both flags are set', () => {
      const result = service.applyChaosSim(realSnapshot, {
        cpu: true,
        memory: true,
      });

      expect(result.chaos.cpuPressure).toBe(true);
      expect(result.chaos.memoryPressure).toBe(true);
      expect(result.eventLoop.lagMs).toBeGreaterThan(30);
      expect(result.memory.heapUsedMB).toBeGreaterThan(
        realSnapshot.memory.heapUsedMB,
      );
    });
  });
});
