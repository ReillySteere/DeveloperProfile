import React from 'react';
import { Skeleton } from '../Skeleton/Skeleton';
import { Button } from '../../primitives/Button/Button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryStateProps<T> {
  isLoading: boolean;
  isError: boolean;
  data?: T;
  error?: Error | null;
  refetch?: () => void;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  isEmpty?: (data: T) => boolean;
}

export function QueryState<T>({
  isLoading,
  isError,
  data,
  error,
  refetch,
  loadingComponent,
  emptyComponent,
  errorComponent,
  children,
  isEmpty = (d) => Array.isArray(d) && d.length === 0,
}: QueryStateProps<T>) {
  if (isLoading) {
    return (
      loadingComponent || (
        <div
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <Skeleton height={200} />
          <Skeleton height={200} />
          <Skeleton height={200} />
        </div>
      )
    );
  }

  if (isError) {
    return (
      errorComponent || (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-danger)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
          }}
        >
          <AlertCircle
            size={48}
            style={{ margin: '0 auto 1rem', opacity: 0.8 }}
          />
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Something went wrong
          </h3>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {error?.message || "We couldn't load the data. Please try again."}
          </p>
          {refetch && (
            <Button
              onClick={() => refetch()}
              leftIcon={<RefreshCw size={16} />}
            >
              Try Again
            </Button>
          )}
        </div>
      )
    );
  }

  if (data && isEmpty(data)) {
    return (
      emptyComponent || (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-default)',
          }}
        >
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            No data found
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            There's nothing to show here yet.
          </p>
        </div>
      )
    );
  }

  if (data) {
    return <>{children(data)}</>;
  }

  return null;
}
