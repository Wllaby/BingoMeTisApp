CREATE TABLE "bingo_games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"template_name" text NOT NULL,
	"marked_cells" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bingo_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"items" jsonb NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bingo_games" ADD CONSTRAINT "bingo_games_template_id_bingo_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."bingo_templates"("id") ON DELETE cascade ON UPDATE no action;