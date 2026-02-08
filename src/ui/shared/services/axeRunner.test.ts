import axe from 'axe-core';
import { runAudit } from './axeRunner';

jest.mock('axe-core');
const mockRun = axe.run as jest.Mock;

describe('axeRunner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns audit result with score from passes and violations', async () => {
    mockRun.mockResolvedValue({
      violations: [{ id: 'color-contrast' } as axe.Result],
      passes: [
        { id: 'button-name' } as axe.Result,
        { id: 'image-alt' } as axe.Result,
        { id: 'label' } as axe.Result,
      ],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    const result = await runAudit();

    expect(result.score).toBe(75); // 3 / (3 + 1) * 100
    expect(result.violations).toHaveLength(1);
    expect(result.passes).toHaveLength(3);
    expect(result.incomplete).toHaveLength(0);
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('returns 100 score when there are no violations', async () => {
    mockRun.mockResolvedValue({
      violations: [],
      passes: [{ id: 'button-name' } as axe.Result],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    const result = await runAudit();
    expect(result.score).toBe(100);
  });

  it('returns 100 score when both passes and violations are empty', async () => {
    mockRun.mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    const result = await runAudit();
    expect(result.score).toBe(100);
  });

  it('passes custom context to axe.run', async () => {
    mockRun.mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    const element = document.createElement('div');
    await runAudit(element);

    expect(mockRun).toHaveBeenCalledWith(element);
  });

  it('uses document as default context', async () => {
    mockRun.mockResolvedValue({
      violations: [],
      passes: [],
      incomplete: [],
      inapplicable: [],
      testEngine: { name: 'axe-core', version: '4.0' },
      testRunner: { name: 'axe' },
      testEnvironment: {} as axe.TestEnvironment,
      url: '',
      timestamp: '',
      toolOptions: {} as axe.RunOptions,
    });

    await runAudit();

    expect(mockRun).toHaveBeenCalledWith(document);
  });
});
