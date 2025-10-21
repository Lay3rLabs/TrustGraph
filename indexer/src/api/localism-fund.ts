import { Hono } from "hono";
import { offchainDb } from "./db";
import { Client } from "@notionhq/client";
import * as offchainSchema from "../../offchain.schema";
import { sql } from "drizzle-orm";

const app = new Hono();

// Sync Notion applications.
app.post("/applications/sync", async (c) => {
  const notionApiKey = process.env.LOCALISM_FUND_NOTION_API_KEY;
  if (!notionApiKey) {
    throw new Error("LOCALISM_FUND_NOTION_API_KEY is not set");
  }

  const notionDataSourceId = process.env.LOCALISM_FUND_NOTION_DATA_SOURCE_ID;
  if (!notionDataSourceId) {
    throw new Error("LOCALISM_FUND_NOTION_DATA_SOURCE_ID is not set");
  }

  const notion = new Client({ auth: notionApiKey });

  const updatedAt = BigInt(Date.now());
  const applications: {
    address: string;
    url: string;
    updatedAt: bigint;
  }[] = [];

  // Paginate all applications from the data source.
  let nextCursor: string | undefined;
  do {
    const response = await notion.dataSources.query({
      data_source_id: notionDataSourceId,
      start_cursor: nextCursor,
    });
    for (const page of response.results) {
      if (
        page.object === "page" &&
        "public_url" in page &&
        page.public_url &&
        "ETH Address" in page.properties &&
        page.properties["ETH Address"].type === "rich_text" &&
        page.properties["ETH Address"].rich_text[0]?.plain_text
      ) {
        applications.push({
          address: page.properties["ETH Address"].rich_text[0].plain_text
            .trim()
            .toLowerCase(),
          url: page.public_url,
          updatedAt,
        });
      }
    }
    nextCursor = (response.has_more && response.next_cursor) || undefined;
  } while (nextCursor);

  await offchainDb
    .insert(offchainSchema.localismFundApplication)
    .values(applications)
    .onConflictDoUpdate({
      target: offchainSchema.localismFundApplication.address,
      set: {
        url: sql.raw(
          `excluded."${offchainSchema.localismFundApplication.url.name}"`
        ),
        updatedAt: sql.raw(
          `excluded."${offchainSchema.localismFundApplication.updatedAt.name}"`
        ),
      },
    });

  return c.json({
    synced: applications.length,
  });
});

// Get all applications.
app.get("/applications", async (c) => {
  const applications =
    await offchainDb.query.localismFundApplication.findMany();
  return c.json({
    applications,
  });
});

// Get application for a given address.
app.get("/applications/:address", async (c) => {
  const address = c.req.param("address");
  if (!address) {
    return c.json({ error: "Address is required" }, 400);
  }

  const application = await offchainDb.query.localismFundApplication.findFirst({
    where: (t, { eq }) => eq(t.address, address.toLowerCase()),
  });
  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

  return c.json({
    ...application,
    updatedAt: application.updatedAt.toString(),
  });
});

export default app;
