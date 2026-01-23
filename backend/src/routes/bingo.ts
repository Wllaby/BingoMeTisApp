import type { FastifyInstance } from "fastify";
import { eq, desc } from "drizzle-orm";
import sharp from 'sharp';
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Seed default templates on startup
  fastify.addHook('onReady', async () => {
    const defaultTemplates = [
      {
        name: "Office",
        description: "Synergy, bandwidth, and other ways to waste your afternoon",
        items: ["Synergy", "Circle Back", "Low-Hanging Fruit", "Think Outside the Box", "Touch Base", "Paradigm Shift", "Leverage", "Bandwidth", "Deep Dive", "Move the Needle", "Best Practice", "Core Competency", "Value Add", "Win-Win", "Game Changer", "Take it Offline", "Drill Down", "Run it Up the Flagpole", "Boil the Ocean", "Drink the Kool-Aid", "Peel the Onion", "Parking Lot", "Ballpark Figure", "Rubber Meets the Road", "Push the Envelope"],
        isCustom: false,
      },
      {
        name: "Adulting",
        description: "Life skills, small wins, and tiny disasters",
        items: ["Robin", "Blue Jay", "Cardinal", "Sparrow", "Crow", "Eagle", "Hawk", "Owl", "Woodpecker", "Hummingbird", "Pigeon", "Seagull", "Pelican", "Flamingo", "Penguin", "Parrot", "Toucan", "Peacock", "Swan", "Duck", "Goose", "Turkey", "Chicken", "Ostrich", "Emu"],
        isCustom: false,
      },
      {
        name: "Customer Service",
        description: "Yes… we have answers. No… you won't like them",
        items: ["Can I speak to a manager?", "I want a refund", "This is unacceptable", "I've been waiting forever", "Your website is broken", "I didn't receive my order", "The product is defective", "I was promised...", "I'll take my business elsewhere", "I'm a loyal customer", "This is ridiculous", "I demand compensation", "I'll leave a bad review", "I know the owner", "I'm never shopping here again", "Can you make an exception?", "I need this today", "Why is this so expensive?", "I saw it cheaper elsewhere", "The ad said...", "I lost my receipt", "Can you price match?", "I changed my mind", "This doesn't fit", "I want to speak to corporate"],
        isCustom: false,
      },
      {
        name: "Kids",
        description: "Tiny humans, giant chaos, zero chill",
        items: ["Random \"I love you\"", "Gives surprise hug", "Wants to hold your hand", "Says something accidentally profound", "Tries to help (but makes it worse)", "Compliments you sincerely", "Laughs uncontrollably at nothing", "Says goodnight to inanimate objects", "Makes you a \"gift\"", "Proudly shows terrible artwork", "Wants the same book again", "Wants the same song again", "Wants the same show again", "Wants the same snack again", "Needs help with something they can do", "Insists \"I can do it myself\"", "Takes forever to do anything", "Needs one more thing before bed", "Needs one more thing before bed…and then another one more thing", "Asks \"why?\" repeatedly", "Interrupts adult conversations", "Talks nonstop in the car", "Refuses food they asked for", "Melts down over nothing", "Changes their mind instantly", "Ignores you when called", "Says something wildly incorrect with confidence", "Makes up their own rules", "Argues about obvious facts", "Thinks tomorrow is \"a long time\"", "Thinks five minutes is forever", "Connects unrelated events", "Asks impossible questions", "\"Watch this!\"", "\"I'm bored\"", "\"That's not fair\"", "\"I didn't do it\"", "\"It was an accident\"", "\"But I need it\"", "\"I'm not tired\"", "\"Just one more\"", "\"You promised\" (you didn't)", "Brutally honest observations", "Comments on strangers' appearance", "Asks loud personal questions in public", "Repeats something embarrassing you said", "Tells family secrets", "Mispronounces words adorably", "Makes up new words", "Swears accidentally", "Sticky hands without a clear source", "Mysterious stains", "Pockets full of rocks", "Clothes inside out", "From laughing to crying in milliseconds", "World-ending sadness", "Over-the-top excitement", "Deep empathy out of nowhere", "Overreacts to minor inconvenience", "Forgets why they're upset", "Talks to themselves", "Talks to toys seriously", "Pretends to be an animal", "Makes random sound effects", "Sings nonsense songs", "Repeats the same joke", "Chooses chaos in quiet moments", "Sleeps in the weirdest position", "Asks a deep life question at bed time"],
        isCustom: false,
      },
      {
        name: "Spouses Hearts",
        description: "Heart eyes, warm hugs, and everyday magic",
        items: ["Surprise hug from behind", "Makes your coffee just right", "Remembers small details", "Sends sweet text during day", "Holds your hand randomly", "Compliments you sincerely", "Laughs at your jokes", "Defends you to others", "Plans surprise date", "Brings you favorite snack", "Listens without interrupting", "Says I love you first", "Warms up your car", "Saves you last bite", "Picks up your favorite food", "Watches your show willingly", "Gives you the good pillow", "Lets you sleep in", "Does your chore without asking", "Brags about you to friends", "Takes your side in argument", "Remembers anniversary", "Buys you flowers randomly", "Cooks your favorite meal", "Gives amazing back rub", "Supports your dreams", "Makes you laugh when sad", "Knows your coffee order", "Texts good morning first", "Plans future together", "Proud of your achievements", "Comforts you when stressed", "Shares dessert with you", "Holds you when crying", "Celebrates small wins", "Remembers your stories", "Protects you from bugs", "Warms your cold hands", "Dances with you at home", "Takes cute photos of you", "Calls just to hear voice", "Misses you when apart", "Excited to see you", "Thinks you're beautiful always", "Trusts you completely", "Makes you feel safe", "Chooses you every day", "Says you're their best friend", "Looks at you lovingly", "Grateful for you"],
        isCustom: false,
      },
      {
        name: "Spouses Sighs",
        description: "Tiny actions, strong eye-rolls, deep sighs",
        items: ["Leaves wet towel on bed", "Forgets to close cabinets", "Eats your labeled food", "Doesn't replace toilet paper", "Leaves lights on everywhere", "Snores like a chainsaw", "Hogs all the blankets", "Takes forever in bathroom", "Leaves dishes in sink", "Forgets important dates", "Interrupts your stories", "Mansplains/womansplains things", "Leaves clothes on floor", "Doesn't listen first time", "Scrolls phone during talk", "Says we need to talk", "Brings up old arguments", "Compares you to ex", "Forgets to lock door", "Leaves gas tank empty", "Double dips in shared food", "Chews too loudly", "Breathes heavily while eating", "Clicks pen repeatedly", "Taps foot constantly", "Cracks knuckles loudly", "Leaves hair in drain", "Uses your razor", "Finishes show without you", "Spoils movie endings", "Backseat drives constantly", "Says I told you so", "Gives unsolicited advice", "Criticizes your driving", "Complains about your family", "Forgets your requests", "Makes plans without asking", "Invites people over randomly", "Rearranges your stuff", "Throws away your things", "Doesn't help with chores", "Plays video games all day", "Watches TV too loud", "Leaves crumbs everywhere", "Doesn't refill ice trays", "Uses last of something", "Doesn't tell you things", "Keeps secrets from you", "Lies about small things", "Defensive about everything"],
        isCustom: false,
      },
      {
        name: "Family gatherings",
        description: "Chaos, cookies, & questions you didn't ask for",
        items: ["When are you having kids?", "You've gained/lost weight", "Still at that job?", "Why aren't you married yet?", "Remember when you...", "Your cousin is engaged", "You should try...", "Back in my day...", "Kids these days...", "That's not how we do it", "Unsolicited parenting advice", "Political argument starts", "Someone drinks too much", "Awkward family photos", "Forced group activities", "Passive aggressive comments", "Comparing you to siblings", "Bringing up embarrassing stories", "Asking about your love life", "Judging your life choices", "Someone starts crying", "Old family drama resurfaces", "Fighting over board games", "Arguing about recipes", "Too much food made", "Not enough food made", "Someone shows up late", "Someone leaves early", "Kids running wild", "Broken family heirloom", "Spilled drink on carpet", "Burnt food disaster", "Dietary restrictions ignored", "Seating arrangement drama", "Who sits where debate", "Temperature war begins", "Music volume argument", "TV channel fight", "Sports debate escalates", "Recipe gatekeeping", "Secret ingredient drama", "Grandma's famous dish", "Everyone wants leftovers", "Tupperware goes missing", "Dishes pile up", "No one helps clean", "Someone breaks something", "Awkward gift exchange", "Regifting discovered", "Someone overstays welcome"],
        isCustom: false,
      },
      {
        name: "Dating",
        description: "Swipes, ghosts, and confusion",
        items: ["Left on read", "Ghosted after great date", "They have a pet snake", "Still talks about ex", "Rude to waiter", "Chews with mouth open", "Only talks about self", "Checks phone constantly", "Shows up late", "Doesn't offer to pay", "Expects you to pay", "Splits bill to penny", "Bad hygiene", "Lies about height", "Catfished by photos", "Brings friend on date", "Takes call during date", "Talks about marriage early", "Love bombs immediately", "Already planning future", "Asks to borrow money", "Wants to move in fast", "Introduces you as soulmate", "Says I love you day one", "Overshares trauma immediately", "Complains entire time", "Negative about everything", "Criticizes your order", "Judges your interests", "Mocks your hobbies", "Doesn't ask questions", "Interrupts constantly", "One word text responses", "Takes days to reply", "Breadcrumbs you", "Hot and cold behavior", "Only texts late night", "Just looking for hookup", "Not over their ex", "Compares you to ex", "Still on dating apps", "Talks to multiple people", "Keeps options open", "Won't define relationship", "Afraid of commitment", "Has commitment issues", "Not ready for relationship", "Just got out of relationship", "On rebound", "Emotionally unavailable"],
        isCustom: false,
      },
      {
        name: "Teenangsters",
        description: "Memes, moods, and words you do not understand",
        items: ["Slams door dramatically", "Eye roll at everything", "It's not a phase", "You don't understand", "Everyone else can", "That's so cringe", "No cap fr fr", "Slay queen", "Periodt", "I'm literally dying", "That's so random", "Whatever", "I don't care", "You're so embarrassing", "Don't talk to me", "Leave me alone", "I hate you", "Worst parent ever", "You've ruined my life", "I'm moving out", "Sleeps until noon", "Up all night", "Always on phone", "Addicted to TikTok", "Making weird videos", "Posting everything online", "Oversharing on social media", "Subtweets about you", "Vague posts for attention", "Fishing for compliments", "Thirst trap photos", "Inappropriate content", "Arguing in comments", "Drama with friends", "Friend group implodes", "Someone's cancelled", "Spreading rumors", "Talking behind backs", "Passive aggressive posts", "Subtweeting drama", "Group chat chaos", "Left on read", "Ghosted by crush", "Crush likes someone else", "Relationship drama", "Breaking up getting back", "It's complicated", "Situationship confusion", "Talking stage forever", "Won't define relationship", "Playing games"],
        isCustom: false,
      },
      {
        name: "Self-care",
        description: "For the love of...me",
        items: ["Bubble bath time", "Face mask on", "Meditation session", "Yoga practice", "Long walk outside", "Journal your thoughts", "Read a good book", "Listen to music", "Dance like nobody's watching", "Sing in shower", "Sleep in late", "Take a nap", "Say no to plans", "Set boundaries", "Delete toxic apps", "Unfollow negative people", "Block your ex", "Mute annoying contacts", "Turn off notifications", "Phone on silent", "Digital detox day", "Screen free evening", "No social media", "Ignore the news", "Avoid drama", "Skip toxic event", "Cancel plans guilt-free", "Stay home instead", "Order takeout", "Eat your favorite food", "Have dessert first", "Treat yourself", "Buy something nice", "Splurge on yourself", "Get a massage", "Book spa day", "Do your nails", "Try new hairstyle", "Wear comfy clothes", "Stay in pajamas", "No makeup day", "Embrace natural look", "Love your body", "Positive self-talk", "Compliment yourself", "Celebrate small wins", "Acknowledge your growth", "Forgive yourself", "Let go of guilt", "Release perfectionism"],
        isCustom: false,
      },
    ];

    // Delete old templates that are no longer in the default set
    const oldTemplateNames = ["Office Jargon", "Birds", "Things kids do"];
    for (const oldName of oldTemplateNames) {
      await app.db.delete(schema.bingoTemplates).where(eq(schema.bingoTemplates.name, oldName));
      app.logger.info({ templateName: oldName }, 'Deleted old bingo template');
    }

    // Check each template and insert/update as needed
    for (const template of defaultTemplates) {
      const [existingTemplate] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.name, template.name));

      if (!existingTemplate) {
        await app.db.insert(schema.bingoTemplates).values(template);
        app.logger.info({ templateName: template.name }, 'Seeded default bingo template');
      } else if (existingTemplate.description !== template.description) {
        // Update description if it changed
        await app.db.update(schema.bingoTemplates)
          .set({ description: template.description })
          .where(eq(schema.bingoTemplates.name, template.name));
        app.logger.info({ templateName: template.name }, 'Updated bingo template description');
      }
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
      if (!body.name || !body.items || body.items.length < 25 || body.items.length > 100) {
        app.logger.warn({ name: body.name, itemCount: body.items?.length }, 'Invalid template: must have between 25 and 100 items');
        return reply.status(400).send({ error: 'Template must have between 25 and 100 items' });
      }

      // Generate a unique share code for the custom template
      const shareCode = generateShareCode();

      const [template] = await app.db.insert(schema.bingoTemplates).values({
        name: body.name,
        description: body.description,
        items: body.items,
        isCustom: true,
        code: shareCode,
      }).returning();

      app.logger.info({ templateId: template.id, name: template.name, code: shareCode }, 'Custom bingo template created successfully with share code');
      return { ...template, code: shareCode };
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

  // DELETE /api/bingo/templates/:id - Delete custom template
  fastify.delete('/templates/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.logger.info({ templateId: id }, 'Deleting bingo template');

    try {
      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, id));

      if (!template) {
        app.logger.warn({ templateId: id }, 'Template not found for deletion');
        return reply.status(404).send({ error: 'Template not found' });
      }

      if (!template.isCustom) {
        app.logger.warn({ templateId: id, templateName: template.name }, 'Attempted to delete default template');
        return reply.status(403).send({ error: 'Cannot delete default templates' });
      }

      await app.db.delete(schema.bingoTemplates).where(eq(schema.bingoTemplates.id, id));

      app.logger.info({ templateId: id, templateName: template.name }, 'Custom template deleted successfully');
      return { success: true, message: 'Template deleted successfully' };
    } catch (error) {
      app.logger.error({ err: error, templateId: id }, 'Failed to delete template');
      throw error;
    }
  });

  // POST /api/bingo/templates/:id/share - Generate share code for template
  fastify.post('/templates/:id/share', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.logger.info({ templateId: id }, 'Generating share code for template');

    try {
      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.id, id));

      if (!template) {
        app.logger.warn({ templateId: id }, 'Template not found for sharing');
        return reply.status(404).send({ error: 'Template not found' });
      }

      // Generate a unique share code if one doesn't exist
      let shareCode = template.code;
      if (!shareCode) {
        shareCode = generateShareCode();
        const [updatedTemplate] = await app.db.update(schema.bingoTemplates)
          .set({ code: shareCode })
          .where(eq(schema.bingoTemplates.id, id))
          .returning();
        app.logger.info({ templateId: id, code: shareCode }, 'Share code generated for template');
        return { code: shareCode, templateId: updatedTemplate.id };
      }

      app.logger.info({ templateId: id, code: shareCode }, 'Share code retrieved for template');
      return { code: shareCode, templateId: template.id };
    } catch (error) {
      app.logger.error({ err: error, templateId: id }, 'Failed to generate share code for template');
      throw error;
    }
  });

  // GET /api/bingo/templates/code/:code - Look up template by share code
  fastify.get('/templates/code/:code', async (request, reply) => {
    const { code } = request.params as { code: string };
    app.logger.info({ code }, 'Looking up template by share code');

    try {
      const [template] = await app.db
        .select()
        .from(schema.bingoTemplates)
        .where(eq(schema.bingoTemplates.code, code));

      if (!template) {
        app.logger.warn({ code }, 'Template not found for share code');
        return reply.status(404).send({ error: 'Template not found' });
      }

      app.logger.info({ code, templateId: template.id, templateName: template.name }, 'Template retrieved by share code');
      return template;
    } catch (error) {
      app.logger.error({ err: error, code }, 'Failed to lookup template by share code');
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

  // GET /api/bingo/games/active - Get active games
  fastify.get('/games/active', async (request, reply) => {
    app.logger.info({}, 'Fetching active bingo games');

    try {
      const games = await app.db
        .select({
          id: schema.bingoGames.id,
          templateId: schema.bingoGames.templateId,
          templateName: schema.bingoGames.templateName,
          markedCells: schema.bingoGames.markedCells,
          completed: schema.bingoGames.completed,
          items: schema.bingoGames.items,
          startedAt: schema.bingoGames.startedAt,
          bingoCount: schema.bingoGames.bingoCount,
        })
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.completed, false))
        .orderBy(desc(schema.bingoGames.startedAt))
        .limit(5);

      app.logger.info({ count: games.length }, 'Successfully fetched active bingo games');
      return games;
    } catch (error) {
      app.logger.error({ err: error }, 'Failed to fetch active bingo games');
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

// Helper function to generate unique share code
function generateShareCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
