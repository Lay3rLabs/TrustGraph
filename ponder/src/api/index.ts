import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { client, graphql } from "ponder";

import merkle from "./merkle";
import followers from "./followers";
import points from "./points";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));
app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

app.route("/followers", followers);
app.route("/merkle", merkle);
app.route("/points", points);

export default app;
