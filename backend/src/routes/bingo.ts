import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import sharp from 'sharp';
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Seed default templates on startup
  fastify.addHook('onReady', async () => {
    const existingTemplates = await app.db
      .select()
      .from(schema.bingoTemplates);

    if (existingTemplates.length === 0) {
      const defaultTemplates = [
        {
          name: "Office Jargon",
          description: undefined,
          items: ["Synergy", "Circle Back", "Low-Hanging Fruit", "Think Outside the Box", "Touch Base", "Paradigm Shift", "Leverage", "Bandwidth", "Deep Dive", "Move the Needle", "Best Practice", "Core Competency", "Value Add", "Win-Win", "Game Changer", "Take it Offline", "Drill Down", "Run it Up the Flagpole", "Boil the Ocean", "Drink the Kool-Aid", "Peel the Onion", "Parking Lot", "Ballpark Figure", "Rubber Meets the Road", "Push the Envelope"],
          isCustom: false,
        },
        {
          name: "Birds",
          description: undefined,
          items: ["Robin", "Blue Jay", "Cardinal", "Sparrow", "Crow", "Eagle", "Hawk", "Owl", "Woodpecker", "Hummingbird", "Pigeon", "Seagull", "Pelican", "Flamingo", "Penguin", "Parrot", "Toucan", "Peacock", "Swan", "Duck", "Goose", "Turkey", "Chicken", "Ostrich", "Emu"],
          isCustom: false,
        },
        {
          name: "Customer Service",
          description: undefined,
          items: ["Can I speak to a manager?", "I want a refund", "This is unacceptable", "I've been waiting forever", "Your website is broken", "I didn't receive my order", "The product is defective", "I was promised...", "I'll take my business elsewhere", "I'm a loyal customer", "This is ridiculous", "I demand compensation", "I'll leave a bad review", "I know the owner", "I'm never shopping here again", "Can you make an exception?", "I need this today", "Why is this so expensive?", "I saw it cheaper elsewhere", "The ad said...", "I lost my receipt", "Can you price match?", "I changed my mind", "This doesn't fit", "I want to speak to corporate"],
          isCustom: false,
        },
        {
          name: "Kids",
          description: "All the adorable, frustrating, and hilarious things kids do",
          items: ["Random \"I love you\"", "Gives surprise hug", "Wants to hold your hand", "Says something accidentally profound", "Tries to help (but makes it worse)", "Compliments you sincerely", "Laughs uncontrollably at nothing", "Says goodnight to inanimate objects", "Makes you a \"gift\"", "Proudly shows terrible artwork", "Wants the same book again", "Wants the same song again", "Wants the same show again", "Wants the same snack again", "Needs help with something they can do", "Insists \"I can do it myself\"", "Takes forever to do anything", "Needs one more thing before bed", "Needs one more thing before bed…and then another one more thing", "Asks \"why?\" repeatedly", "Interrupts adult conversations", "Talks nonstop in the car", "Refuses food they asked for", "Melts down over nothing", "Changes their mind instantly", "Ignores you when called", "Says something wildly incorrect with confidence", "Makes up their own rules", "Argues about obvious facts", "Thinks tomorrow is \"a long time\"", "Thinks five minutes is forever", "Connects unrelated events", "Asks impossible questions", "\"Watch this!\"", "\"I'm bored\"", "\"That's not fair\"", "\"I didn't do it\"", "\"It was an accident\"", "\"But I need it\"", "\"I'm not tired\"", "\"Just one more\"", "\"You promised\" (you didn't)", "Brutally honest observations", "Comments on strangers' appearance", "Asks loud personal questions in public", "Repeats something embarrassing you said", "Tells family secrets", "Mispronounces words adorably", "Makes up new words", "Swears accidentally", "Sticky hands without a clear source", "Mysterious stains", "Pockets full of rocks", "Clothes inside out", "From laughing to crying in milliseconds", "World-ending sadness", "Over-the-top excitement", "Deep empathy out of nowhere", "Overreacts to minor inconvenience", "Forgets why they're upset", "Talks to themselves", "Talks to toys seriously", "Pretends to be an animal", "Makes random sound effects", "Sings nonsense songs", "Repeats the same joke", "Chooses chaos in quiet moments", "Sleeps in the weirdest position", "Asks a deep life question at bed time"],
          isCustom: false,
        },
      ];

      await app.db.insert(schema.bingoTemplates).values(defaultTemplates);
      app.logger.info('Seeded default bingo templates');
    }
  });

  // GET /api/bingo/templates - Get all templates
  fastify.get('/templates', async (request, reply) => {
    app.logger.info({}, 'Fetching all bingo templates');
    try {
      const templates = await app.db.select().from(schema.bingoTemplates);
      app.logger.info({ count: templates.length }, 'Successfully fetched bingo templates');
      return { templates };
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch bingo templates');
      throw error;
    }
  });

  // POST /api/bingo/templates - Create custom template
  fastify.post('/templates', async (request, reply) => {
    const body = request.body as { name: string; description?: string; items: string[] };
    app.logger.info({ name: body.name, itemCount: body.items?.length }, 'Creating custom bingo template');

    try {
      if (!body.name || !body.items || body.items.length !== 25) {
        app.logger.warn({ name: body.name, itemCount: body.items?.length }, 'Invalid template: must have exactly 25 items');
        return reply.status(400).send({ error: 'Template must have exactly 25 items' });
      }

      const [template] = await app.db.insert(schema.bingoTemplates).values({
        name: body.name,
        description: body.description,
        items: body.items,
        isCustom: true,
      }).returning();

      app.logger.info({ templateId: template.id, name: template.name }, 'Custom bingo template created successfully');
      return template;
    } catch (error) {
      app.logger.error({ err: error, name: body.name }, 'Failed to create custom bingo template');
      throw error;
    }
  });

  // GET /api/bingo/templates/:id - Get specific template
  fastify.get('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.logger.info({ templateId: id }, 'Fetching bingo template');

    try {
      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, id));

      if (!template) {
        app.logger.warn({ templateId: id }, 'Bingo template not found');
        return reply.status(404).send({ error: 'Template not found' });
      }

      app.logger.info({ templateId: id }, 'Successfully fetched bingo template');
      return template;
    } catch (error) {
      app.logger.error({ err: error, templateId: id }, 'Failed to fetch bingo template');
      throw error;
    }
  });

  // POST /api/bingo/games - Start new game
  fastify.post('/games', async (request, reply) => {
    const body = request.body as { template_id: string };
    app.logger.info({ templateId: body.template_id }, 'Starting new bingo game');

    try {
      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, body.template_id));

      if (!template) {
        app.logger.warn({ templateId: body.template_id }, 'Template not found for game creation');
        return reply.status(404).send({ error: 'Template not found' });
      }

      const [game] = await app.db.insert(schema.bingoGames).values({
        templateId: template.id,
        templateName: template.name,
        markedCells: [],
        items: template.items,
        startedAt: new Date(),
        bingoCount: 0,
      }).returning();

      app.logger.info({ gameId: game.id, templateId: template.id }, 'New bingo game created successfully');
      return game;
    } catch (error) {
      app.logger.error({ err: error, templateId: body.template_id }, 'Failed to create new bingo game');
      throw error;
    }
  });

  // PUT /api/bingo/games/:id - Update game progress
  fastify.put('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      markedCells: number[];
      bingoCount?: number;
      completed?: boolean;
      completedAt?: string;
      duration?: number;
    };
    app.logger.info({ gameId: id, markedCount: body.markedCells?.length, bingoCount: body.bingoCount }, 'Updating bingo game progress');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, id));

      if (!game) {
        app.logger.warn({ gameId: id }, 'Game not found for update');
        return reply.status(404).send({ error: 'Game not found' });
      }

      const updates: any = { markedCells: body.markedCells };

      if (body.bingoCount !== undefined) {
        updates.bingoCount = body.bingoCount;
      }

      if (body.duration !== undefined) {
        updates.duration = body.duration;
      }

      if (body.completed) {
        updates.completed = true;
        updates.completedAt = new Date();
      }

      if (body.completedAt) {
        updates.completedAt = new Date(body.completedAt);
      }

      const [updatedGame] = await app.db.update(schema.bingoGames)
        .set(updates)
        .where(eq(schema.bingoGames.id, id))
        .returning();

      app.logger.info({ gameId: id, completed: updatedGame.completed, bingoCount: updatedGame.bingoCount }, 'Bingo game updated successfully');
      return updatedGame;
    } catch (error) {
      app.logger.error({ err: error, gameId: id }, 'Failed to update bingo game');
      throw error;
    }
  });

  // GET /api/bingo/games - Get all past games
  fastify.get('/games', async (request, reply) => {
    app.logger.info({}, 'Fetching all past bingo games');

    try {
      const games = await app.db.select().from(schema.bingoGames);
      app.logger.info({ count: games.length }, 'Successfully fetched past bingo games');
      return games;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch past bingo games');
      throw error;
    }
  });

  // GET /api/bingo/games/:id - Get specific game
  fastify.get('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.logger.info({ gameId: id }, 'Fetching specific bingo game');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, id));

      if (!game) {
        app.logger.warn({ gameId: id }, 'Game not found');
        return reply.status(404).send({ error: 'Game not found' });
      }

      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, game.templateId));

      app.logger.info({ gameId: id, templateId: game.templateId }, 'Successfully fetched bingo game');
      return { ...game, template };
    } catch (error) {
      app.logger.error({ err: error, gameId: id }, 'Failed to fetch bingo game');
      throw error;
    }
  });

  // POST /api/bingo/games/:id/complete - Complete and save game to history
  fastify.post('/games/:id/complete', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      markedCells: number[];
      bingoCount: number;
      duration: number;
    };
    app.logger.info({ gameId: id, bingoCount: body.bingoCount, duration: body.duration }, 'Completing and saving bingo game');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, id));

      if (!game) {
        app.logger.warn({ gameId: id }, 'Game not found for completion');
        return reply.status(404).send({ error: 'Game not found' });
      }

      const now = new Date();
      const [completedGame] = await app.db.update(schema.bingoGames)
        .set({
          markedCells: body.markedCells,
          bingoCount: body.bingoCount,
          duration: body.duration,
          completed: true,
          completedAt: now,
        })
        .where(eq(schema.bingoGames.id, id))
        .returning();

      app.logger.info({ gameId: id, bingoCount: completedGame.bingoCount, duration: completedGame.duration }, 'Bingo game completed and saved successfully');
      return completedGame;
    } catch (error) {
      app.logger.error({ err: error, gameId: id }, 'Failed to complete and save bingo game');
      throw error;
    }
  });

  // GET /api/bingo/games/history - Get user's game history
  fastify.get('/games/history', async (request, reply) => {
    app.logger.info({}, 'Fetching user game history');

    try {
      const games = await app.db
        .select({
          id: schema.bingoGames.id,
          templateName: schema.bingoGames.templateName,
          items: schema.bingoGames.items,
          markedCells: schema.bingoGames.markedCells,
          bingoCount: schema.bingoGames.bingoCount,
          duration: schema.bingoGames.duration,
          completedAt: schema.bingoGames.completedAt,
          createdAt: schema.bingoGames.createdAt,
        })
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.completed, true))
        .orderBy(desc(schema.bingoGames.completedAt));

      app.logger.info({ count: games.length }, 'Successfully fetched user game history');
      return games;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch user game history');
      throw error;
    }
  });

  // POST /api/bingo/share/:gameId - Generate shareable image
  fastify.post('/share/:gameId', async (request, reply) => {
    const { gameId } = request.params as { gameId: string };
    app.logger.info({ gameId }, 'Generating shareable bingo card image');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, gameId));

      if (!game) {
        app.logger.warn({ gameId }, 'Game not found for sharing');
        return reply.status(404).send({ error: 'Game not found' });
      }

      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, game.templateId));

      if (!template) {
        app.logger.warn({ gameId, templateId: game.templateId }, 'Template not found for sharing');
        return reply.status(404).send({ error: 'Template not found' });
      }

      // Generate bingo card as SVG and convert to PNG
      const svg = generateBingoCardSVG(template.items, game.markedCells);
      const pngBuffer = await svgToPng(svg);

      // Upload to storage
      const key = `bingo-cards/${gameId}.png`;
      await app.storage.upload(key, pngBuffer);

      const { url } = await app.storage.getSignedUrl(key);

      app.logger.info({ gameId, key }, 'Shareable bingo card image generated successfully');
      return { url };
    } catch (error) {
      app.logger.error({ err: error, gameId }, 'Failed to generate shareable bingo card image');
      throw error;
    }
  });

  // POST /api/bingo/history - Save game to history
  fastify.post('/history', async (request, reply) => {
    const body = request.body as {
      id: string;
      template_name: string;
      marked_cells: number[];
      completed: boolean;
      completed_at: string;
      created_at: string;
      duration_seconds?: number;
      goal_reached?: string;
      items?: string[];
    };
    app.logger.info({ gameId: body.id, templateName: body.template_name }, 'Saving game to history');

    try {
      const [existingGame] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, body.id));

      let game;
      if (existingGame) {
        // Update existing game
        const [updatedGame] = await app.db.update(schema.bingoGames)
          .set({
            templateName: body.template_name,
            markedCells: body.marked_cells,
            completed: body.completed,
            completedAt: body.completed_at ? new Date(body.completed_at) : null,
            durationSeconds: body.duration_seconds || null,
            goalReached: body.goal_reached || null,
            items: body.items || null,
          })
          .where(eq(schema.bingoGames.id, body.id))
          .returning();
        game = updatedGame;
      } else {
        // Create new game
        const [newGame] = await app.db.insert(schema.bingoGames).values({
          id: body.id,
          templateId: existingGame?.templateId || '', // Will be filled if available
          templateName: body.template_name,
          markedCells: body.marked_cells,
          completed: body.completed,
          completedAt: body.completed_at ? new Date(body.completed_at) : null,
          createdAt: new Date(body.created_at),
          durationSeconds: body.duration_seconds || null,
          goalReached: body.goal_reached || null,
          items: body.items || null,
        }).returning();
        game = newGame;
      }

      app.logger.info({ gameId: game.id, completed: game.completed }, 'Game saved to history successfully');
      return { success: true, game };
    } catch (error) {
      app.logger.error({ err: error, gameId: body.id }, 'Failed to save game to history');
      throw error;
    }
  });

  // GET /api/bingo/history - Get game history with pagination
  fastify.get('/history', async (request, reply) => {
    const query = request.query as { limit?: string; offset?: string };
    const limit = Math.min(parseInt(query.limit || '20', 10), 100);
    const offset = parseInt(query.offset || '0', 10);
    app.logger.info({ limit, offset }, 'Fetching game history');

    try {
      const games = await app.db
        .select()
        .from(schema.bingoGames)
        .orderBy(desc(schema.bingoGames.completedAt))
        .limit(limit)
        .offset(offset);

      const totalResult = await app.db
        .select({ count: schema.bingoGames.id })
        .from(schema.bingoGames);
      const total = totalResult.length;

      app.logger.info({ count: games.length, total, offset, limit }, 'Successfully fetched game history');
      return { games, total };
    } catch (error) {
      app.logger.error({ err: error, limit, offset }, 'Failed to fetch game history');
      throw error;
    }
  });
}

// Helper function to generate SVG of bingo card
function generateBingoCardSVG(items: string[], markedCells: number[]): string {
  const cellSize = 80;
  const padding = 20;
  const totalSize = cellSize * 5 + padding * 2;
  const markedSet = new Set(markedCells);

  let svg = `<svg width="${totalSize}" height="${totalSize}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${totalSize}" height="${totalSize}" fill="white" stroke="black" stroke-width="2"/>`;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      const index = row * 5 + col;
      const x = padding + col * cellSize;
      const y = padding + row * cellSize;
      const isMarked = markedSet.has(index);
      const bgColor = isMarked ? '#FFD700' : 'white';

      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${bgColor}" stroke="black" stroke-width="1"/>`;

      const textX = x + cellSize / 2;
      const textY = y + cellSize / 2;
      const text = items[index] || '';
      const displayText = text.length > 12 ? text.substring(0, 12) + '...' : text;

      svg += `<text x="${textX}" y="${textY}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-family="Arial">
        <tspan>${displayText}</tspan>
      </text>`;
    }
  }

  svg += `</svg>`;
  return svg;
}

// Helper function to convert SVG to PNG buffer
async function svgToPng(svg: string): Promise<Buffer> {
  try {
    return await sharp(Buffer.from(svg))
      .png()
      .toBuffer();
  } catch (error) {
    // Fallback: if sharp fails, return the SVG as buffer
    console.error('SVG to PNG conversion failed:', error);
    return Buffer.from(svg);
  }
}
