import { pgTable, text, timestamp, uuid, boolean, jsonb, integer } from 'drizzle-orm/pg-core';

export const bingoTemplates = pgTable('bingo_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  items: jsonb('items').$type<string[]>().notNull(),
  isCustom: boolean('is_custom').default(false).notNull(),
  code: text('code').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const bingoGames = pgTable('bingo_games', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').references(() => bingoTemplates.id, { onDelete: 'set null' }),
  templateName: text('template_name').notNull(),
  markedCells: jsonb('marked_cells').$type<number[]>().default([]).notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  items: jsonb('items').$type<string[]>().notNull(),
  bingoCount: integer('bingo_count').default(0).notNull(),
  duration: integer('duration'),
  durationSeconds: integer('duration_seconds'),
  goalReached: text('goal_reached'),
  isStarted: boolean('is_started').default(false).notNull(),
  firstBingoTime: integer('first_bingo_time'),
  threeBingosTime: integer('three_bingos_time'),
  fullCardTime: integer('full_card_time'),
});

export const feedback = pgTable('feedback', {
  id: uuid('id').primaryKey().defaultRandom(),
  message: text('message').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
