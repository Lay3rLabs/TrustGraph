import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";

import merkle from "./merkle";
import attestations from "./attestations";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.route("/merkle", merkle);
app.route("/attestations", attestations);

export default app;
