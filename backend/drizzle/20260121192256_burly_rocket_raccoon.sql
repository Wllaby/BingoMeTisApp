ALTER TABLE "bingo_games" ALTER COLUMN "items" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "started_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "bingo_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "duration" integer;