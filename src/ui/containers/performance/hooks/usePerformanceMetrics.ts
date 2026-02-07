import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import type { Benchmark, BundleAnalysis } from 'shared/types';

export function useBenchmarks() {
  return useQuery({
    queryKey: ['performance', 'benchmarks'],
    queryFn: async () => {
      const { data } = await axios.get<Benchmark[]>(
        '/api/performance/benchmarks',
      );
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useBundleAnalysis() {
  return useQuery({
    queryKey: ['performance', 'bundle'],
    queryFn: async () => {
      const { data } = await axios.get<BundleAnalysis | null>(
        '/api/performance/bundle',
      );
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
