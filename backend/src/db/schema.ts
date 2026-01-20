import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';

export const bingoTemplates = pgTable('bingo_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  items: jsonb('items').$type<string[]>().notNull(),
  isCustom: boolean('is_custom').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bingoGames = pgTable('bingo_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => bingoTemplates.id, { onDelete: 'cascade' }),
  templateName: text('template_name').notNull(),
  markedCells: jsonb('marked_cells').$type<number[]>().default([]).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
