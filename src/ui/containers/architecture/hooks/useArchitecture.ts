import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Adr,
  AdrListItem,
  ComponentDocSummary,
  ComponentDoc,
  DependencyGraphsData,
  FocusedDependencyGraph,
} from 'shared/types';

/**
 * Fetches all ADRs with searchText for client-side filtering.
 * Uses staleTime: Infinity since content is static during session.
 */
const fetchAdrs = async (): Promise<AdrListItem[]> => {
  const { data } = await axios.get<AdrListItem[]>('/api/architecture/adrs');
  return data;
};

const fetchAdr = async (slug: string): Promise<Adr> => {
  const { data } = await axios.get<Adr>(`/api/architecture/adrs/${slug}`);
  return data;
};

const fetchComponents = async (): Promise<ComponentDocSummary[]> => {
  const { data } = await axios.get<ComponentDocSummary[]>(
    '/api/architecture/components',
  );
  return data;
};

const fetchComponent = async (slug: string): Promise<ComponentDoc> => {
  const { data } = await axios.get<ComponentDoc>(
    `/api/architecture/components/${slug}`,
  );
  return data;
};

const fetchDependencyGraphs = async (): Promise<DependencyGraphsData> => {
  const { data } = await axios.get<DependencyGraphsData>(
    '/api/architecture/dependencies',
  );
  return data;
};

const fetchDependencyGraph = async (
  scope: 'ui' | 'server',
  target: string,
): Promise<FocusedDependencyGraph> => {
  const { data } = await axios.get<FocusedDependencyGraph>(
    `/api/architecture/dependencies/${scope}/${target}`,
  );
  return data;
};

export function useAdrs() {
  return useQuery({
    queryKey: ['architecture', 'adrs'],
    queryFn: fetchAdrs,
    staleTime: Infinity, // Static content, cache for entire session
  });
}

export function useAdr(slug: string) {
  return useQuery({
    queryKey: ['architecture', 'adr', slug],
    queryFn: () => fetchAdr(slug),
    enabled: !!slug,
    staleTime: Infinity,
  });
}

export function useComponentDocs() {
  return useQuery({
    queryKey: ['architecture', 'components'],
    queryFn: fetchComponents,
    staleTime: Infinity,
  });
}

export function useComponentDoc(slug: string) {
  return useQuery({
    queryKey: ['architecture', 'component', slug],
    queryFn: () => fetchComponent(slug),
    enabled: !!slug,
    staleTime: Infinity,
  });
}

export function useDependencyGraphs() {
  return useQuery({
    queryKey: ['architecture', 'dependencies'],
    queryFn: fetchDependencyGraphs,
    staleTime: Infinity,
  });
}

export function useDependencyGraph(
  scope: 'ui' | 'server',
  target: string,
  enabled = true,
) {
  return useQuery({
    queryKey: ['architecture', 'dependencies', scope, target],
    queryFn: () => fetchDependencyGraph(scope, target),
    enabled: enabled && !!target,
    staleTime: Infinity,
  });
}
