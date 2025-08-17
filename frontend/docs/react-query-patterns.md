# React Query Patterns for Blockchain Data

This document outlines the React Query patterns established for managing blockchain data fetching in the EN0VA application.

## Setup

React Query is configured in `components/providers.tsx` with blockchain-optimized defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - balance freshness with performance
      gcTime: 5 * 60 * 1000, // 5 minutes cache time
      retry: 3, // Retry failures (common with RPC endpoints)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: true, // Keep blockchain data fresh
    },
    mutations: {
      retry: 1, // Single retry for mutations
    },
  },
})
```

## Query Key Pattern

Consistent query keys are defined in `hooks/useIndexer.ts`:

```typescript
export const attestationKeys = {
  all: ['attestations'] as const,
  schemas: () => [...attestationKeys.all, 'schemas'] as const,
  schema: (schemaUID: string) => [...attestationKeys.schemas(), schemaUID] as const,
  schemaCount: (schemaUID: string) => [...attestationKeys.schema(schemaUID), 'count'] as const,
  schemaUIDs: (schemaUID: string, limit: number) => [...attestationKeys.schema(schemaUID), 'uids', limit] as const,
  attestation: (uid: string) => [...attestationKeys.all, 'attestation', uid] as const,
};
```

## Hook Pattern

Each query hook follows this pattern:

1. **Data Fetching**: Use wagmi's `useReadContract` for blockchain calls
2. **React Query Integration**: Wrap the result in `useQuery` for caching and state management
3. **Type Safety**: Return properly typed data with consistent interfaces

Example:

```typescript
function useSchemaAttestationCount(schemaUID: string) {
  const { data: rawCount, error, isLoading } = useReadContract({
    ...indexerConfig,
    functionName: "getSchemaAttestationUIDCount",
    args: [schemaUID],
    query: { enabled: !!schemaUID },
  });

  return useQuery({
    queryKey: attestationKeys.schemaCount(schemaUID),
    queryFn: () => rawCount ? Number(rawCount) : 0,
    enabled: !!rawCount && !error && !isLoading,
    staleTime: 60 * 1000, // Longer stale time for counts
    gcTime: 10 * 60 * 1000,
  });
}
```

## Cache Strategy

Different data types have different caching strategies:

- **Counts**: Longer stale time (60s) since they change less frequently
- **UIDs**: Medium stale time (30s) as new attestations are added
- **Individual Attestations**: Longest cache (2min) since they're immutable once created

## Usage Examples

### Basic Schema Attestations
```typescript
const { totalCount, attestationUIDs, isLoadingUIDs, countError, uidsError } = 
  useVouchingAttestations(10);
```

### Individual Attestation
```typescript
const { data, isLoading, error } = useIndividualAttestation(uid);
```

## Benefits

1. **Automatic Caching**: Eliminates redundant network requests
2. **Background Updates**: Data stays fresh with configurable refetch intervals
3. **Optimistic Updates**: Better UX for mutations
4. **Error Handling**: Consistent retry logic for network failures
5. **Developer Experience**: React Query DevTools in development
6. **Performance**: Reduced loading states through intelligent caching

## Development Tools

React Query DevTools are automatically included in development mode. Access them by:
1. Opening the dev console
2. Looking for the React Query DevTools icon (floating button)
3. Clicking to inspect query state, cache, and network activity

This provides visibility into:
- Active queries and their state
- Cache contents and expiration
- Network request timing
- Query invalidation events