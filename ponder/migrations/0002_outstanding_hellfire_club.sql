ALTER TABLE "offchain"."merkle_entry" ADD COLUMN "blockNumber" bigint NOT NULL;--> statement-breakpoint
ALTER TABLE "offchain"."merkle_entry" ADD COLUMN "timestamp" bigint NOT NULL;--> statement-breakpoint
CREATE INDEX "merkle_entry_blockNumber_index" ON "offchain"."merkle_entry" USING btree ("blockNumber");--> statement-breakpoint
CREATE INDEX "merkle_entry_timestamp_index" ON "offchain"."merkle_entry" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "merkle_entry_account_timestamp_index" ON "offchain"."merkle_entry" USING btree ("account","timestamp");