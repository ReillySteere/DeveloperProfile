import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from 'ui/shared/components';
import type { BundleModule } from 'shared/types';
import styles from '../performance.module.scss';

interface BundleSizeTreemapProps {
  modules: BundleModule[];
  totalSize: number;
  gzippedSize: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

const COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#f97316',
  '#eab308',
];

interface TreemapContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  index?: number;
}

function CustomContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name = '',
  index = 0,
}: TreemapContentProps): React.ReactNode {
  if (width < 40 || height < 20) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={COLORS[index % COLORS.length]}
        stroke="var(--bg-surface)"
        strokeWidth={2}
        rx={4}
      />
      {width > 60 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#fff"
          fontSize={Math.min(12, width / 8)}
        >
          {name}
        </text>
      )}
    </g>
  );
}

export function BundleSizeTreemap({
  modules,
  totalSize,
  gzippedSize,
}: BundleSizeTreemapProps): React.ReactNode {
  const data = modules.map((mod) => ({
    name: mod.name,
    size: mod.size,
    gzippedSize: mod.gzippedSize,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bundle Size</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={styles.bundleStats}>
          <span>Total: {formatSize(totalSize)}</span>
          <span>Gzipped: {formatSize(gzippedSize)}</span>
        </div>
        <div data-testid="bundle-treemap">
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={data}
              dataKey="size"
              aspectRatio={4 / 3}
              content={<CustomContent />}
            >
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                }}
                formatter={(value) => [formatSize(value as number), 'Size']}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
