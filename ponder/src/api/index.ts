import { db } from "ponder:api";
import schema from "ponder:schema";
import * as offchainSchema from "../../offchain.schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";
import { drizzle } from "drizzle-orm/node-postgres";

const app = new Hono();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}
const offchainDb = drizzle(process.env.DATABASE_URL, {
  schema: offchainSchema,
});

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

const twitterAccount = "0xEN0VA";

app.post("/update-followers", async (c) => {
  // Only allow updating the follower count once every 5 minutes.
  const lastFollowerCount = (
    await offchainDb.query.followerCount.findFirst({
      where: (t, { eq }) => eq(t.twitterAccount, twitterAccount),
      orderBy: (t, { desc }) => desc(t.timestamp),
    })
  )?.timestamp;
  if (lastFollowerCount && Date.now() / 1000 - lastFollowerCount < 5 * 60) {
    return c.json(
      { error: "Follower count already updated in the last 5 minutes" },
      400
    );
  }

  const apiToken = process.env.TWITTERAPI_TOKEN;
  if (!apiToken) {
    return c.json({ error: "TWITTERAPI_TOKEN is not set" }, 500);
  }

  const res = await fetch(
    `https://api.twitterapi.io/twitter/user/info?userName=${twitterAccount}`,
    {
      headers: {
        "X-API-Key": apiToken,
      },
    }
  );
  if (!res.ok) {
    const body = res.body
      ? await res.json().catch(() => "Failed to parse response body.")
      : null;
    return c.json(
      {
        error: "Failed to fetch Twitter followers",
        status: res.status,
        statusText: res.statusText,
        body,
      },
      500
    );
  }

  const data = (await res.json()) as {
    data: {
      followers: number;
    };
  };

  await offchainDb.insert(offchainSchema.followerCount).values({
    timestamp: Math.floor(Date.now() / 1000),
    twitterAccount,
    followers: data.data.followers,
  });

  return c.json({ success: true });
});

app.get("/followers", async (c) => {
  const { minTimestamp } = c.req.query();
  const minTimestampNumber = minTimestamp ? parseInt(minTimestamp) : 0;
  if (isNaN(minTimestampNumber) || minTimestampNumber < 0) {
    return c.json({ error: "minTimestamp is not a positive number" }, 400);
  }

  const followers = await offchainDb.query.followerCount.findMany({
    where: (t, { and, eq, gte }) =>
      and(
        eq(t.twitterAccount, twitterAccount),
        ...(minTimestampNumber > 0
          ? [gte(t.timestamp, minTimestampNumber)]
          : [])
      ),
    orderBy: (t, { desc }) => desc(t.timestamp),
  });

  return c.json({ followers });
});

export default app;
