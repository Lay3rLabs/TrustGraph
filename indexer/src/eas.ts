import { ponder } from "ponder:registry";
import { easAttestation } from "ponder:schema";
import { easAbi } from "../../frontend/lib/contracts";

ponder.on("eas:Attested", async ({ event, context }) => {
  const { recipient, attester, uid, schemaUID } = event.args;
  const attestation = await context.client.readContract({
    address: context.contracts.eas.address,
    abi: easAbi,
    functionName: "getAttestation",
    args: [uid],
  });
  await context.db.insert(easAttestation).values({
    uid,
    schema: schemaUID,
    attester,
    recipient,
    ref: attestation.refUID,
    revocable: attestation.revocable,
    expirationTime: attestation.expirationTime,
    revocationTime: attestation.revocationTime,
    data: attestation.data,
    blockNumber: event.block.number,
    timestamp: event.block.timestamp,
  });
});

ponder.on("eas:Revoked", async ({ event, context }) => {
  const { uid } = event.args;
  const attestation = await context.client.readContract({
    address: context.contracts.eas.address,
    abi: easAbi,
    functionName: "getAttestation",
    args: [uid],
  });
  await context.db
    .update(easAttestation, { uid })
    .set({ revocationTime: attestation.revocationTime });
});
