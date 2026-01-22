ALTER TABLE "bingo_templates" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "bingo_templates" ADD CONSTRAINT "bingo_templates_code_unique" UNIQUE("code");