import { Hono } from "hono";
import { db } from "ponder:api";
import { easAttestation } from "ponder:schema";
import { sql, count, eq, desc, asc } from "drizzle-orm";

const app = new Hono();

// Get paginated list of attestations with optional schema filtering
app.get("/", async (c) => {
  try {
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");
    const reverse = c.req.query("reverse") === "true";
    const schema = c.req.query("schema") as `0x${string}` | undefined;

    let query = db.select().from(easAttestation);

    // Add schema filter if provided
    if (schema) {
      query = query.where(eq(easAttestation.schema, schema));
    }

    // Add ordering
    const orderBy = reverse
      ? desc(easAttestation.timestamp)
      : asc(easAttestation.timestamp);
    query = query.orderBy(orderBy);

    // Add pagination
    query = query.limit(limit).offset(offset);

    const attestations = await query;

    return c.json(
      attestations.map((attestation) => ({
        uid: attestation.uid,
        timestamp: Number(attestation.timestamp),
        schema: attestation.schema,
        attester: attestation.attester,
        recipient: attestation.recipient,
        data: attestation.data,
        revocationTime: Number(attestation.revocationTime),
        expirationTime: Number(attestation.expirationTime),
      }))
    );
  } catch (error) {
    console.error("Error fetching attestations:", error);
    return c.json({ error: "Failed to fetch attestations" }, 500);
  }
});

// Get total count of attestations or count by schema
app.get("/count", async (c) => {
  try {
    const schema = c.req.query("schema") as `0x${string}` | undefined;

    let query = db
      .select({ count: count(easAttestation.uid) })
      .from(easAttestation);

    // Add schema filter if provided
    if (schema) {
      query = query.where(eq(easAttestation.schema, schema));
    }

    const result = await query;
    const totalCount = result[0]?.count || 0;

    return c.json({ count: totalCount });
  } catch (error) {
    console.error("Error fetching attestation count:", error);
    return c.json({ error: "Failed to fetch attestation count" }, 500);
  }
});

// Get attestation counts for all accounts
app.get("/counts", async (c) => {
  try {
    // Get sent counts (where account is attester)
    const sentCounts = await db
      .select({
        account: easAttestation.attester,
        sent: count(easAttestation.uid),
      })
      .from(easAttestation)
      .groupBy(easAttestation.attester);

    // Get received counts (where account is recipient)
    const receivedCounts = await db
      .select({
        account: easAttestation.recipient,
        received: count(easAttestation.uid),
      })
      .from(easAttestation)
      .groupBy(easAttestation.recipient);

    // Combine the results
    const accountCounts: Record<string, { sent: number; received: number }> =
      {};

    // Add sent counts
    for (const item of sentCounts) {
      if (!accountCounts[item.account]) {
        accountCounts[item.account] = { sent: 0, received: 0 };
      }
      accountCounts[item.account]!.sent = item.sent;
    }

    // Add received counts
    for (const item of receivedCounts) {
      if (!accountCounts[item.account]) {
        accountCounts[item.account] = { sent: 0, received: 0 };
      }
      accountCounts[item.account]!.received = item.received;
    }

    // Convert to array format
    const results = Object.entries(accountCounts).map(([account, counts]) => ({
      account,
      sent: counts.sent,
      received: counts.received,
    }));

    return c.json({ attestationCounts: results });
  } catch (error) {
    console.error("Error fetching attestation counts:", error);
    return c.json({ error: "Failed to fetch attestation counts" }, 500);
  }
});

// Get attestation counts for a specific account
app.get("/counts/:account", async (c) => {
  try {
    const account = c.req.param("account");

    if (!account) {
      return c.json({ error: "Account parameter is required" }, 400);
    }

    // Get sent count
    const sentResult = await db
      .select({ count: count(easAttestation.uid) })
      .from(easAttestation)
      .where(eq(easAttestation.attester, account as `0x${string}`));

    // Get received count
    const receivedResult = await db
      .select({ count: count(easAttestation.uid) })
      .from(easAttestation)
      .where(eq(easAttestation.recipient, account as `0x${string}`));

    const sent = sentResult[0]?.count || 0;
    const received = receivedResult[0]?.count || 0;

    return c.json({
      account,
      sent,
      received,
    });
  } catch (error) {
    console.error("Error fetching attestation counts for account:", error);
    return c.json({ error: "Failed to fetch attestation counts" }, 500);
  }
});

// Get individual attestation by UID (must come after specific routes)
app.get("/:uid", async (c) => {
  try {
    const uid = c.req.param("uid") as `0x${string}`;

    if (!uid) {
      return c.json({ error: "UID parameter is required" }, 400);
    }

    const attestation = await db
      .select()
      .from(easAttestation)
      .where(eq(easAttestation.uid, uid))
      .limit(1);

    if (attestation.length === 0) {
      return c.json({ error: "Attestation not found" }, 404);
    }

    return c.json(attestation[0]);
  } catch (error) {
    console.error("Error fetching attestation:", error);
    return c.json({ error: "Failed to fetch attestation" }, 500);
  }
});

export default app;
