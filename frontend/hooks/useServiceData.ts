'use client'

import { useQuery } from '@tanstack/react-query'
import { useReadContract } from 'wagmi'
import { poaServiceManagerAbi, poaServiceManagerAddress } from '@/lib/contracts'

interface ServiceWorkflow {
  id: string
  package: string
  version: string
  digest: string
  domain: string
  trigger_address: string
  trigger_event: string
  chain_name: string
  aggregator_url: string
  aggregator_address: string
  fuel_limit: number
  time_limit: number
  permissions: string[]
  env_keys: string[]
  config: Record<string, any>
}

interface ServiceData {
  id: string
  name: string
  status: string
  workflows: Record<string, any>
  manager: {
    evm: {
      chain_name: string
      address: string
    }
  }
}

export function useServiceData() {
  // Get service URI from POA Service Manager
  const { data: serviceURI, isLoading: isServiceURILoading, error: serviceURIError } = useReadContract({
    address: poaServiceManagerAddress,
    abi: poaServiceManagerAbi,
    functionName: 'getServiceURI',
  })

  // Debug logging
  console.log('ServiceURI loading:', { serviceURI, isServiceURILoading, serviceURIError })

  // Fetch service data from IPFS
  const serviceDataQuery = useQuery({
    queryKey: ['serviceData', serviceURI],
    queryFn: async (): Promise<ServiceData | null> => {
      if (!serviceURI || serviceURI === '') {
        console.log('No serviceURI available:', serviceURI)
        return null
      }
      
      try {
        // Handle IPFS URI formats
        let fetchUrl = serviceURI
        if (serviceURI.startsWith('ipfs://')) {
          // Use local IPFS API route instead of public gateway
          const hash = serviceURI.replace('ipfs://', '')
          fetchUrl = `/api/ipfs/${hash}`
        }
        
        console.log('Fetching service data from:', fetchUrl)
        const response = await fetch(fetchUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch service data: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Received service data:', data)
        return data
      } catch (error) {
        console.error('Error fetching service data:', error)
        throw error
      }
    },
    enabled: !!serviceURI && serviceURI !== '',
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })

  // Transform workflows data
  const workflows: ServiceWorkflow[] = serviceDataQuery.data?.workflows 
    ? Object.entries(serviceDataQuery.data.workflows).map(([id, workflow]: [string, any]) => ({
        id,
        package: workflow.component?.source?.Registry?.registry?.package || 'Unknown',
        version: workflow.component?.source?.Registry?.registry?.version || '0.0.0',
        digest: workflow.component?.source?.Registry?.registry?.digest || '',
        domain: workflow.component?.source?.Registry?.registry?.domain || '',
        trigger_address: workflow.trigger?.evm_contract_event?.address || '',
        trigger_event: workflow.trigger?.evm_contract_event?.event_hash || '',
        chain_name: workflow.trigger?.evm_contract_event?.chain_name || '',
        aggregator_url: workflow.submit?.aggregator?.url || '',
        aggregator_address: workflow.aggregators?.[0]?.evm?.address || 'N/A',
        fuel_limit: workflow.component?.fuel_limit || 0,
        time_limit: workflow.component?.time_limit_seconds || 0,
        permissions: [
          workflow.component?.permissions?.allowed_http_hosts === 'all'
            ? 'HTTP: All hosts'
            : `HTTP: ${workflow.component?.permissions?.allowed_http_hosts || 'None'}`,
          workflow.component?.permissions?.file_system
            ? 'File system access'
            : 'No file system',
        ],
        env_keys: workflow.component?.env_keys || [],
        config: workflow.component?.config || {},
      }))
    : []

  return {
    serviceURI: serviceURI || '',
    serviceData: serviceDataQuery.data,
    workflows,
    isLoading: isServiceURILoading || serviceDataQuery.isLoading,
    error: serviceURIError || serviceDataQuery.error,
  }
}