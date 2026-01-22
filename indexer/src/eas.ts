import { ponder } from 'ponder:registry'
import { easAttestation } from 'ponder:schema'

import { revalidateNetwork } from './utils'
import { easAbi } from '../../frontend/lib/contract-abis'

ponder.on(
  'easIndexerResolver:AttestationAttested',
  async ({ event, context }) => {
    const { eas, uid } = event.args
    const attestation = await context.client.readContract({
      address: eas,
      abi: easAbi,
      functionName: 'getAttestation',
      args: [uid],
    })
    await context.db.insert(easAttestation).values({
      uid,
      schema: attestation.schema,
      resolver: event.log.address,
      attester: attestation.attester,
      recipient: attestation.recipient,
      ref: attestation.refUID,
      revocable: attestation.revocable,
      expirationTime: attestation.expirationTime,
      revocationTime: attestation.revocationTime,
      data: attestation.data,
      blockNumber: event.block.number,
      timestamp: event.block.timestamp,
    })

    await revalidateNetwork()
  }
)

ponder.on(
  'easIndexerResolver:AttestationRevoked',
  async ({ event, context }) => {
    const { eas, uid } = event.args
    const attestation = await context.client.readContract({
      address: eas,
      abi: easAbi,
      functionName: 'getAttestation',
      args: [uid],
    })
    await context.db
      .update(easAttestation, { uid })
      .set({ revocationTime: attestation.revocationTime })

    await revalidateNetwork()
  }
)
