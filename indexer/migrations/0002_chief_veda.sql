ALTER TABLE "offchain"."merkle_entry" ADD COLUMN "merkleSnapshotContract" text;--> statement-breakpoint
ALTER TABLE "offchain"."merkle_metadata" ADD COLUMN "merkleSnapshotContract" text;--> statement-breakpoint
UPDATE "offchain"."merkle_entry" SET "merkleSnapshotContract" = '0x6d5339fd17235803ae68e04d0b820bdd987427ac';--> statement-breakpoint
UPDATE "offchain"."merkle_metadata" SET "merkleSnapshotContract" = '0x6d5339fd17235803ae68e04d0b820bdd987427ac';--> statement-breakpoint
ALTER TABLE "offchain"."merkle_entry" ALTER COLUMN "merkleSnapshotContract" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offchain"."merkle_metadata" ALTER COLUMN "merkleSnapshotContract" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "offchain"."merkle_entry" DROP CONSTRAINT "merkle_entry_root_account_pk";--> statement-breakpoint
ALTER TABLE "merkle_metadata" DROP CONSTRAINT "merkle_metadata_pkey";--> statement-breakpoint
ALTER TABLE "offchain"."merkle_entry" ADD CONSTRAINT "merkle_entry_merkleSnapshotContract_root_account_pk" PRIMARY KEY("merkleSnapshotContract","root","account");--> statement-breakpoint
ALTER TABLE "offchain"."merkle_metadata" ADD CONSTRAINT "merkle_metadata_merkleSnapshotContract_root_pk" PRIMARY KEY("merkleSnapshotContract","root");--> statement-breakpoint
