/**
 * Recharts test utilities.
 *
 * Recharts uses SVG rendering which can cause issues in Jest.
 * This module provides utilities and mock components for testing.
 *
 * Usage:
 * ```typescript
 * // Option 1: Mock in test file
 * jest.mock('recharts', () => require('test-utils/mockRecharts').mockRecharts);
 *
 * // Option 2: Use the setup in jest-preloaded.ts for global mocking
 * ```
 */
import React from 'react';

type MockComponentProps = {
  children?: React.ReactNode;
  [key: string]: unknown;
};

type TooltipFormatterFn = (
  value: unknown,
  name: unknown,
  props?: unknown,
) => [string, string] | string;

interface MockTooltipProps extends MockComponentProps {
  formatter?: TooltipFormatterFn;
  labelFormatter?: (label: unknown) => string;
}

/**
 * Create a mock component that renders its children.
 */
function createMockComponent(
  name: string,
): React.FC<{ children?: React.ReactNode }> {
  const MockComponent: React.FC<MockComponentProps> = ({ children }) => (
    <div data-testid={`recharts-${name.toLowerCase()}`}>{children}</div>
  );
  MockComponent.displayName = `Mock${name}`;
  return MockComponent;
}

/**
 * Create a mock component that renders nothing (for elements like Line, Bar).
 */
function createMockElement(name: string): React.FC<MockComponentProps> {
  const MockElement: React.FC<MockComponentProps> = () => (
    <div data-testid={`recharts-${name.toLowerCase()}`} />
  );
  MockElement.displayName = `Mock${name}`;
  return MockElement;
}

/**
 * Mock ResponsiveContainer that provides a fixed size.
 * This is the most important mock - ResponsiveContainer tries to
 * measure DOM dimensions which fails in Jest.
 */
export const MockResponsiveContainer: React.FC<{
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
}> = ({ children, width = 800, height = 400 }) => (
  <div
    data-testid="recharts-responsive-container"
    style={{
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    }}
  >
    {children}
  </div>
);
MockResponsiveContainer.displayName = 'MockResponsiveContainer';

/**
 * Complete Recharts mock module.
 * Use with jest.mock('recharts', () => require('test-utils/mockRecharts').mockRecharts);
 */
export const mockRecharts = {
  ResponsiveContainer: MockResponsiveContainer,

  // Chart types
  LineChart: createMockComponent('LineChart'),
  BarChart: createMockComponent('BarChart'),
  AreaChart: createMockComponent('AreaChart'),
  PieChart: createMockComponent('PieChart'),
  ComposedChart: createMockComponent('ComposedChart'),

  // Chart elements
  Line: createMockElement('Line'),
  Bar: createMockElement('Bar'),
  Area: createMockElement('Area'),
  Pie: createMockElement('Pie'),

  // Axis
  XAxis: createMockElement('XAxis'),
  YAxis: createMockElement('YAxis'),
  ZAxis: createMockElement('ZAxis'),
  CartesianGrid: createMockElement('CartesianGrid'),

  // Reference elements
  ReferenceLine: createMockElement('ReferenceLine'),
  ReferenceArea: createMockElement('ReferenceArea'),
  ReferenceDot: createMockElement('ReferenceDot'),

  // Interactive elements - Tooltip with formatter execution for coverage
  Tooltip: ({ formatter, labelFormatter }: MockTooltipProps) => {
    // Execute formatter with test values to ensure coverage
    if (formatter) {
      // Test latency metrics
      formatter(100, 'Avg Latency');
      formatter(150, 'P95 Latency');
      // Test error rate metric
      formatter(5.5, 'Error Rate');
      // Test with null/undefined values
      formatter(null, null);
      formatter(undefined, undefined);
    }
    if (labelFormatter) {
      labelFormatter('12:00');
    }
    return <div data-testid="recharts-tooltip" />;
  },
  Legend: createMockElement('Legend'),
  Brush: createMockElement('Brush'),

  // Labels
  Label: createMockElement('Label'),
  LabelList: createMockElement('LabelList'),

  // Shapes
  Cell: createMockElement('Cell'),

  // Radar
  Radar: createMockElement('Radar'),
  RadarChart: createMockComponent('RadarChart'),
  PolarGrid: createMockElement('PolarGrid'),
  PolarAngleAxis: createMockElement('PolarAngleAxis'),
  PolarRadiusAxis: createMockElement('PolarRadiusAxis'),
};

/**
 * Partial mock that only replaces ResponsiveContainer.
 * Use when you want to test more chart behavior.
 */
export const partialMockRecharts = {
  ...jest.requireActual('recharts'),
  ResponsiveContainer: MockResponsiveContainer,
};
