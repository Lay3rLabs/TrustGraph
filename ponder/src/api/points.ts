import { Hono } from "hono";
import path from "path";
import fs from "fs";
import CONFIG from "../../../frontend/config.json";

const eventsFolders = [CONFIG.wavsServiceId]
  .flat()
  .map((serviceId) =>
    path.join(process.cwd(), `../infra/wavs-1/app/${serviceId}/events`)
  );

const pointsApp = new Hono();

pointsApp.get("/:account", async (c) => {
  const { account } = c.req.param();
  if (!account) {
    return c.json({ error: "Account is required" }, 400);
  }

  if (eventsFolders.every((folder) => !fs.existsSync(folder))) {
    return c.json({ error: "Events paths not found" }, 500);
  }

  const allFiles = eventsFolders.flatMap((folder) =>
    fs.readdirSync(folder).map((file) => path.join(folder, file))
  );

  const filePaths = allFiles.filter((file) =>
    file.toLowerCase().endsWith("/" + account.toLowerCase() + ".json")
  );
  if (filePaths.length === 0) {
    return c.json({ error: "Points not found for account" }, 404);
  }

  const files = filePaths.map((filePath) =>
    JSON.parse(fs.readFileSync(filePath, "utf8"))
  );

  // Choose whichever file has the most events, in case any services experienced downtime.
  const file = files.sort((a, b) => b.length - a.length)[0];

  return c.json(file);
});

export default pointsApp;
