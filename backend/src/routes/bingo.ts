import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
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
      return templates;
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
      }).returning();

      app.logger.info({ gameId: game.id, templateId: template.id }, 'New bingo game created successfully');
      return game;
    } catch (error) {
      app.logger.error({ err: error, templateId: body.template_id }, 'Failed to create new bingo game');
      throw error;
    }
  });

  // PUT /api/bingo/games/:id - Update game state
  fastify.put('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { marked_cells: number[]; completed?: boolean };
    app.logger.info({ gameId: id, markedCount: body.marked_cells?.length, completed: body.completed }, 'Updating bingo game');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, id));

      if (!game) {
        app.logger.warn({ gameId: id }, 'Game not found for update');
        return reply.status(404).send({ error: 'Game not found' });
      }

      const updates: any = { markedCells: body.marked_cells };

      if (body.completed) {
        updates.completed = true;
        updates.completedAt = new Date();
      }

      const [updatedGame] = await app.db.update(schema.bingoGames)
        .set(updates)
        .where(eq(schema.bingoGames.id, id))
        .returning();

      app.logger.info({ gameId: id, completed: updatedGame.completed }, 'Bingo game updated successfully');
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
