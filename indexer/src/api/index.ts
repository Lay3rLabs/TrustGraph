import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";

import attestations from "./attestations";
import merkle from "./merkle";
import network from "./network";

import localismFund from "./localism-fund";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.route("/attestations", attestations);
app.route("/merkle", merkle);
app.route("/network", network);

app.route("/localism-fund", localismFund);

export default app;
