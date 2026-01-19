import { Test, TestingModule } from '@nestjs/testing';
import { firstValueFrom, take } from 'rxjs';
import { SseController } from './sse.controller';
import { IMetricsService } from './metrics.service';
import type { TelemetrySnapshot } from 'shared/types';
import TOKENS from './tokens';

describe('SseController', () => {
  let controller: SseController;
  let metricsService: jest.Mocked<IMetricsService>;

  const mockSnapshot: TelemetrySnapshot = {
    timestamp: Date.now(),
    eventLoop: {
      lagMs: 1.5,
      min: 0.5,
      max: 3.0,
      mean: 1.5,
      stddev: 0.5,
      percentile99: 2.5,
    },
    memory: {
      heapUsedMB: 50,
      heapTotalMB: 100,
      rssMB: 120,
      externalMB: 10,
    },
    database: {
      latencyMs: 0.8,
      connected: true,
    },
    process: {
      uptimeSeconds: 3600,
      pid: 12345,
      nodeVersion: 'v20.0.0',
    },
    chaos: {
      cpuPressure: false,
      memoryPressure: false,
    },
  };

  beforeEach(async () => {
    const mockMetricsService = {
      collectSnapshot: jest.fn().mockResolvedValue(mockSnapshot),
      applyChaosSim: jest.fn((snapshot, flags) => ({
        ...snapshot,
        chaos: {
          cpuPressure: flags.cpu,
          memoryPressure: flags.memory,
        },
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SseController],
      providers: [
        {
          provide: TOKENS.IMetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<SseController>(SseController);
    metricsService = module.get(TOKENS.IMetricsService);
  });

  describe('stream', () => {
    it('should emit telemetry events', async () => {
      const stream$ = controller.stream();

      // Take the first event
      const event = await firstValueFrom(stream$.pipe(take(1)));

      expect(event.data).toMatchObject({
        timestamp: expect.any(Number),
        eventLoop: expect.any(Object),
        memory: expect.any(Object),
        database: expect.any(Object),
        process: expect.any(Object),
      });
    });

    it('should parse chaos flags from query string', async () => {
      const stream$ = controller.stream('cpu,memory');

      await firstValueFrom(stream$.pipe(take(1)));

      expect(metricsService.applyChaosSim).toHaveBeenCalledWith(
        expect.any(Object),
        { cpu: true, memory: true },
      );
    });

    it('should handle cpu-only chaos flag', async () => {
      const stream$ = controller.stream('cpu');

      await firstValueFrom(stream$.pipe(take(1)));

      expect(metricsService.applyChaosSim).toHaveBeenCalledWith(
        expect.any(Object),
        { cpu: true, memory: false },
      );
    });

    it('should handle memory-only chaos flag', async () => {
      const stream$ = controller.stream('memory');

      await firstValueFrom(stream$.pipe(take(1)));

      expect(metricsService.applyChaosSim).toHaveBeenCalledWith(
        expect.any(Object),
        { cpu: false, memory: true },
      );
    });

    it('should handle no chaos flags', async () => {
      const stream$ = controller.stream();

      await firstValueFrom(stream$.pipe(take(1)));

      expect(metricsService.applyChaosSim).toHaveBeenCalledWith(
        expect.any(Object),
        { cpu: false, memory: false },
      );
    });
  });
});
