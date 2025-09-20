CREATE SCHEMA "offchain";
--> statement-breakpoint
CREATE TABLE "offchain"."follower_count" (
	"timestamp" integer PRIMARY KEY NOT NULL,
	"twitterAccount" text,
	"followers" integer NOT NULL
);
