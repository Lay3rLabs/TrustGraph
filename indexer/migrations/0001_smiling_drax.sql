CREATE TABLE "offchain"."localism_fund_application" (
	"address" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"updatedAt" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "localism_fund_application_url_index" ON "offchain"."localism_fund_application" USING btree ("url");