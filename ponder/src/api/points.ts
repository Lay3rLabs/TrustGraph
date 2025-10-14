import { Hono } from "hono";
import path from "path";
import fs from "fs";
import CONFIG from "../../../frontend/config.json";

const operatorsFolder = path.join(process.cwd(), "../infra");

const pointsApp = new Hono();

pointsApp.get("/:account", async (c) => {
  const { account } = c.req.param();
  if (!account) {
    return c.json({ error: "Account is required" }, 400);
  }

  const eventsFolders = fs
    .readdirSync(operatorsFolder, {
      withFileTypes: true,
    })
    .filter((folder) => folder.isDirectory() && folder.name.startsWith("wavs-"))
    .map((folder) =>
      path.join(
        operatorsFolder,
        folder.name,
        "app",
        CONFIG.wavsServiceId,
        "events"
      )
    );

  if (eventsFolders.length === 0) {
    return c.json({ error: "No operator events folders found" }, 500);
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
