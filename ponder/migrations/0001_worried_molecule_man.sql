CREATE TABLE "offchain"."merkle_entry" (
	"root" text NOT NULL,
	"account" text NOT NULL,
	"ipfsHashCid" text NOT NULL,
	"value" bigint NOT NULL,
	"proof" jsonb NOT NULL,
	CONSTRAINT "merkle_entry_root_account_pk" PRIMARY KEY("root","account")
);
--> statement-breakpoint
CREATE TABLE "offchain"."merkle_metadata" (
	"root" text PRIMARY KEY NOT NULL,
	"ipfsHash" text NOT NULL,
	"ipfsHashCid" text NOT NULL,
	"numAccounts" integer NOT NULL,
	"totalValue" bigint NOT NULL,
	"sources" jsonb NOT NULL,
	"blockNumber" bigint NOT NULL,
	"timestamp" bigint NOT NULL
);
--> statement-breakpoint
CREATE INDEX "merkle_entry_root_index" ON "offchain"."merkle_entry" USING btree ("root");--> statement-breakpoint
CREATE INDEX "merkle_entry_account_index" ON "offchain"."merkle_entry" USING btree ("account");--> statement-breakpoint
CREATE INDEX "merkle_entry_ipfsHashCid_index" ON "offchain"."merkle_entry" USING btree ("ipfsHashCid");--> statement-breakpoint
CREATE INDEX "merkle_metadata_root_index" ON "offchain"."merkle_metadata" USING btree ("root");--> statement-breakpoint
CREATE INDEX "merkle_metadata_ipfsHashCid_index" ON "offchain"."merkle_metadata" USING btree ("ipfsHashCid");--> statement-breakpoint
CREATE INDEX "merkle_metadata_blockNumber_index" ON "offchain"."merkle_metadata" USING btree ("blockNumber");--> statement-breakpoint
CREATE INDEX "merkle_metadata_timestamp_index" ON "offchain"."merkle_metadata" USING btree ("timestamp");