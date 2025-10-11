# Network Page Refactor

## Overview

The network page has been refactored to use the Ponder indexer instead of directly fetching merkle tree data from IPFS. This improves performance, reduces network requests, and provides a more reliable data source.

## Changes Made

### 1. New Hook: `useNetwork`

Created a new hook `useNetwork` in `hooks/useNetwork.ts` that replaces the previous `useMerkle` hook.

**Key differences:**
- Uses React Query to fetch data from the Ponder indexer API
- Single API call instead of multiple IPFS requests
- Better error handling and loading states
- Maintains the same interface as `useMerkle` for backward compatibility

### 2. Updated Ponder Queries

Extended `queries/ponder.ts` to include merkle tree data queries:

**New query functions:**
- `latestMerkleTree()` - Fetches the latest merkle tree with all entries
- `merkleTree(root)` - Fetches a specific merkle tree by root hash

**API endpoints used:**
- `GET /merkle/current` - Latest merkle tree data
- `GET /merkle/{root}` - Specific merkle tree by root

### 3. Updated Network Page

Modified `app/network/page.tsx` to:
- Import and use `useNetwork` instead of `useMerkle`
- Update UI text to reflect using "ponder indexer" instead of "IPFS"
- Maintain all existing functionality and UI components

## API Structure

The Ponder indexer provides merkle data through these endpoints:

```
GET /merkle/current
Response: {
  tree: {
    root: string,
    ipfsHashCid: string,
    numAccounts: number,
    totalValue: string,
    sources: Array<{name: string, metadata: any}>,
    blockNumber: string,
    timestamp: string
  },
  entries: Array<{
    account: string,
    value: string,
    proof: string[]
  }>
}
```

## Benefits

### Performance Improvements
- **Single Request**: One API call vs multiple IPFS requests
- **Pre-sorted Data**: Entries are sorted by value on the client side
- **Cached Results**: React Query provides intelligent caching

### Reliability
- **Direct Database Access**: Ponder indexer queries the database directly
- **Better Error Handling**: Structured error responses from API
- **Consistent Data**: Always returns the latest indexed data

### Developer Experience
- **Type Safety**: Full TypeScript support with proper types
- **Loading States**: Better loading and error state management
- **Debug Friendly**: Easier to debug API calls vs IPFS fetches

## Migration Notes

The `useNetwork` hook maintains the same interface as `useMerkle`:

```typescript
const {
  isLoading,
  error,
  MerkleData,        // Array of network entries
  totalRewards,      // Total reputation points
  totalParticipants, // Number of members
  refresh,           // Function to refresh data
} = useNetwork()
```

Additional metadata is now available:
- `merkleRoot`: The merkle tree root hash
- `ipfsHashCid`: IPFS hash for backup/verification
- `blockNumber`: Block number when data was indexed
- `timestamp`: Timestamp when data was indexed
- `sources`: Information about data sources used

## Configuration

The hook uses the `APIS.ponder` configuration from `config.json`:

```json
{
  "apis": {
    "ponder": "http://localhost:65421"
  }
}
```

Ensure the Ponder indexer is running and accessible at the configured URL.

## Future Improvements

- Add pagination for large merkle trees
- Implement real-time updates via WebSocket
- Add caching strategies for historical merkle snapshots
- Consider adding GraphQL queries for more complex data fetching