ALTER TABLE "bingo_games" DROP CONSTRAINT "bingo_games_template_id_bingo_templates_id_fk";
--> statement-breakpoint
ALTER TABLE "bingo_games" ALTER COLUMN "template_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bingo_games" ADD CONSTRAINT "bingo_games_template_id_bingo_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."bingo_templates"("id") ON DELETE set null ON UPDATE no action;