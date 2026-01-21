ALTER TABLE "bingo_games" ADD COLUMN "duration_seconds" integer;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "goal_reached" text;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "items" jsonb;