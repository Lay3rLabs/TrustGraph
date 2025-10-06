import { Hono } from "hono";
import path from "path";
import fs from "fs";
import CONFIG from '../../../frontend/config.json'

const eventsPath = path.join(
  __dirname,
  `../../../infra/wavs-1/app/${CONFIG.wavsServiceId}/events`
);

const pointsApp = new Hono();

pointsApp.get("/:account", async (c) => {
  const { account } = c.req.param();
  if (!account) {
    return c.json({ error: "Account is required" }, 400);
  }

  const files = fs.readdirSync(eventsPath);

  const filePath = files.find(
    (file) => file.toLowerCase() === account.toLowerCase() + ".json"
  );
  if (!filePath) {
    return c.json({ error: "Points not found for account" }, 404);
  }

  const file = JSON.parse(
    fs.readFileSync(path.join(eventsPath, filePath), "utf8")
  );

  return c.json(file);
});

export default pointsApp;
