ALTER TABLE "bingo_games" ADD COLUMN "is_started" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "first_bingo_time" integer;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "three_bingos_time" integer;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD COLUMN "full_card_time" integer;