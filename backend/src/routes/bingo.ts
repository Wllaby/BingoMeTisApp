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
        items: ["\"Circle back\"", "\"Touch base\"", "\"Take this offline\"", "\"Align\"", "\"Low-hanging fruit\"", "\"Big picture\"", "\"Move the needle\"", "\"Deep dive\"", "\"Holistic approach\"", "\"Best practices\"", "\"Synergy\"", "\"Value-add\"", "\"Game changer\"", "\"Scalability\"", "\"Ecosystem\"", "Meeting about another meeting", "\"Can everyone see my screen?\"", "Someone joins late to a meeting and asks to recap", "Meeting with no clear outcome", "Action items with no owner", "Someone sending a meeting invite without checking others' availability", "\"Just flagging this\"", "\"Per my last email\"", "\"Friendly reminder\"", "\"I'll let you take this\"", "\"Not sure if this was intentional\"", "\"Happy to discuss\" (but clearly not)", "\"Let's table this for now\"", "Chat messages instead of emails", "Email instead of Slack", "Meeting that should have been an email", "Someone sharing the wrong screen", "\"You're on mute\"", "Echo / feedback chaos in an online meeting", "\"Let me stop sharing real quick\"", "Instantly following an email with a call", "Reply-all disaster", "CC'ing leadership as a threat", "\"At the end of the day…\"", "Urgent but not important tasks", "Acronym no one explains", "CCs random executives", "CCs way too many people", "Copies the entire email chain", "Escalates without warning", "Emails at midnight/weekend expecting results first thing in the morning", "Wants instant replies", "Follows up after 5 minutes of asking for something", "Multiple messages for the same issue from the same person", "Sends \"???\" as a follow-up", "\"Are you there?\"", "Calls while you're responding by email", "Meeting gets rescheduled for the millionth time"],
        isCustom: false,
      },
      {
        name: "Customer Service",
        description: "Yes… we have answers. No… you won't like them",
        items: ["\"I've been a customer for YEARS\"", "\"I just have a quick question\"", "\"This will only take a second\"", "\"I spoke to someone earlier\" (no name, no details)", "\"No one told me that\"", "\"That doesn't make sense\"", "\"Can you make an exception?\"", "\"It worked last time\"", "\"I'm not trying to be difficult, but…\"", "\"This is unacceptable\"", "Pretends not to have seen the instructions/information", "Asks a question already answered", "Repeats the same question again, and again", "Talks over the explanation", "Hears only what they want", "\"So what you're saying is…\" (completely wrong)", "Wants it done yesterday", "Expects instant results", "Assumes magic is involved", "Wants a refund and to keep the product", "Tries to get free stuff \"for the inconvenience\"", "Thinks rules don't apply to them", "Shocked by standard policies", "Surprised by prices", "Surprised by wait times", "\"It's not working\" (no details)", "Ignored warnings", "Overly dramatic sighs", "Passive-aggressive politeness", "Talking very slowly (for no reason)", "Talking very loudly (for no reason)", "Long rant before the actual issue", "Apologizes while being rude", "Asks for a manager immediately", "Threatens to leave forever", "Mentions bad reviews", "\"I'll take my business elsewhere\"", "Name-drops managers", "Escalates without warning", "\"I know my rights\"", "Calls/comes right before closing", "Wants policy changed for them", "\"No one ever told me\"", "Wants you to break rules for them", "Thinks yelling helps", "Thinks persistence = success", "Tells their life story", "Overshares personal drama", "Blames spouse/kids/dog", "\"Sorry, I'm just frustrated\"", "Issue resolved but still unhappy", "Says \"never mind\" after 20 minutes", "Disappears mid-conversation", "\"Actually, one more thing…\"", "\"I know the owner\"", "\"I'm in a hurry\"", "Snaps fingers / waves aggressively", "Ignores greeting, immediately complains", "\"Your website said…\" (when it didn't)", "Refuses to read signs or instructions", "Brings up a completely unrelated problem", "Blames you for company policy", "\"I want to speak to the manager\"", "Claims \"everyone else\" does it for them", "Uses sarcasm instead of explaining the issue", "Says \"no offense\" right before offending you", "Demands help while refusing to provide info", "Compares you to another business negatively", "\"I'm paying your salary.\""],
        isCustom: false,
      },
      {
        name: "Kids",
        description: "Tiny humans, giant chaos, zero chill",
        items: ["Random \"I love you\"", "Gives surprise hug", "Wants to hold your hand", "Says something accidentally profound", "Tries to help (but makes it worse)", "Compliments you sincerely", "Laughs uncontrollably at nothing", "Says goodnight to inanimate objects", "Makes you a \"gift\"", "Proudly shows terrible artwork", "Wants the same story / video / game again", "Says something wildly inappropriate in public", "Needs help with something they can do", "Insists \"I can do it myself\"", "Takes forever to do anything", "Needs one more thing before bed", "Needs one more thing before bed…and then another", "Asks \"why?\" repeatedly", "Refuses food they asked for", "Melts down over nothing", "Changes their mind instantly", "Ignores you when called", "Says something wildly incorrect with confidence", "Makes up their own rules", "Argues about obvious facts", "Thinks tomorrow is \"a long time\"", "Thinks five minutes is forever", "Connects unrelated events", "Asks impossible questions", "\"Watch this!\"", "\"I'm bored\"", "\"That's not fair\"", "\"I didn't do it\"", "\"It was an accident\"", "\"But I need it\"", "\"I'm not tired\"", "\"Just one more\"", "\"You promised\" (you didn't)", "Brutally honest observations", "Comments on strangers' appearance", "Asks loud personal questions in public", "Repeats something embarrassing you said", "Tells family secrets", "Mispronounces words adorably", "Makes up new words", "Swears accidentally", "Sticky hands out of nowhere", "Mysterious stains", "Pockets full of rocks", "Clothes inside out", "From laughing to crying in milliseconds", "World-ending sadness", "Over-the-top excitement", "Deep empathy out of nowhere", "Overreacts to minor inconvenience", "Forgets why they're upset", "Talks to themselves", "Talks to toys seriously", "Pretends to be an animal", "Makes random sound effects", "Sings nonsense songs", "Repeats the same joke multiple times a day", "Chooses chaos in quiet moments", "Sleeps in the weirdest position", "Asks a deep life question at bed time", "Insists they're not tired (while melting down)", "Renames a common object for no reason", "Suddenly hates the food they loved yesterday", "Meltdowns for random things", "Narrates everything they're doing", "Whispers loudly", "Refuses help, then gets mad when it's hard", "Claims they didn't do the thing you watched them do", "Dramatically pretends to be injured", "Invents an imaginary rule and enforces it", "Gets emotionally attached to a random object"],
        isCustom: false,
      },
      {
        name: "Spouses Hearts",
        description: "Heart eyes, warm hugs, and everyday magic",
        items: ["Brings you a drink without being asked", "Listens when I need to vent", "Remembers how you take your coffee", "Saves you the last bite", "Does a chore you were dreading", "Holds your hand in public", "Laughs at your bad jokes", "Makes your favorite meal \"just because\"", "Checks if you got home safe", "Fixes or replaces something before you notice it's broken", "Leaves a sweet note (or text) randomly", "Lets you talk without trying to fix it", "Knows when you need space vs. a hug", "Notices small changes (haircut, mood, outfit)", "Brings you a snack they know you like", "Takes care of something you forgot", "Plans something small but thoughtful", "Puts their phone down when you're talking", "Does the annoying errand so you don't have to", "Says \"I'm proud of you\"", "Gives a long, quiet hug", "Listens to the same story again because it matters to you", "Notices when you're overwhelmed and steps in", "Keeps your favorite treat stocked", "Asks for your opinion and actually listens", "Gives a gentle forehead kiss", "Notices when you're tired and picks up the slack", "Lets you vent without minimizing your feelings", "Handles the awkward or annoying conversation", "Encourages you before something important", "Reaches for you in their sleep", "Takes pictures of you when you're not looking", "Thanks you for things you do all the time", "Says \"we'll figure it out together\"", "Notices your mood before you say a word", "Makes sure you eat when you're busy", "Keeps quiet when you're resting", "Remembers names and stories about your people", "Holds your face when they kiss you"],
        isCustom: false,
      },
      {
        name: "Spouses Sighs",
        description: "Tiny actions, strong eye-rolls, deep sighs",
        items: ["Says \"huh?\" instead of listening", "Half-listening while on their phone", "Responds without hearing the question", "Says \"we already talked about this\"", "Says \"we need to talk\" with zero context", "Asks \"what's wrong?\" repeatedly", "Interrupts mid-sentence", "Finishes your sentences (wrongly)", "Says \"relax\"", "Says \"calm down\"", "Leaves dishes next to the sink", "Loads dishwasher incorrectly", "Leaves cabinet doors open", "Leaves drawers open", "Puts things almost away", "Creates clutter hot spots", "Notices mess but ignores it", "Leaves clothes on the floor", "Clothes next to the hamper", "Re-wears questionable clothing", "Mixes clean and dirty clothes", "Takes forever to get ready when you're already late", "Says \"I'm listening\" while on their phone", "Replaces things… but not where they belong", "Doesn't check pockets", "Claims something is \"still clean\"", "Says \"five minutes\" (it's never five)", "Waits until the last minute", "Breathes a little too loudly", "Says \"it's fine\" when it is clearly not", "\"Did you see my text?\" (sent 30 seconds ago)", "Repeats a story you've heard 12 times", "Asks questions during a show you're watching", "Leaves phone volume on too loud", "Watches videos without headphones", "Scrolls phone during conversations", "Takes calls on speaker", "Asks you to fix things they are capable of fixing too", "Leaves food containers open", "Takes the last bite without asking", "Says \"we\" when they mean \"you\"", "Can't decide what to eat", "Says \"I don't care\" (but does)", "Eats your snacks", "Forgets groceries you asked for", "Leaves crumbs everywhere", "Uses too many dishes", "Hogging the blankets", "Stealing pillows", "Walks too slowly or too fast", "Sleeps diagonally", "\"I don't care, you pick\" (then has opinions)", "Chews louder than necessary", "Leaves lights on in empty rooms", "Hits snooze repeatedly", "Turns lights off aggressively", "Changes the thermostat secretly", "Selective hearing", "Overthinks minor things", "Refuses to ask for help", "Asks for help immediately", "Overexplains simple things", "Uses your stuff and doesn't mention it", "Tells stories too slowly", "Tells stories too fast", "Corrects you unnecessarily", "Says \"I was just joking\"", "Gets defensive too quickly", "Avoids a difficult conversation with parkour like finesse", "Forgets to replace empty things", "Leaves one square of toilet paper", "Hums or sings loudly", "Leaves things where they \"make sense\"", "Starts a project and quickly abandons it…again", "Has strong opinions about nothing", "Has no opinion about important things", "Scrolls endlessly instead of getting up", "Misses obvious things", "Says \"you know what I mean\"", "Says \"you always\" or \"you never\"", "Answers a question with a story"],
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
        items: ["Bio says \"Just ask\"", "No bio at all", "Only group photos in their profile", "Sunglasses in every photo", "One blurry photo", "Photo with an ex cropped out", "Gym selfie", "Shows up late to the date, no apology", "Travel photo overload", "Picture with a dog (not theirs)", "\"Love to travel\"", "\"Foodie\"", "\"Fluent in sarcasm\"", "\"Looking for my partner in crime\"", "\"Work hard, play hard\"", "\"No drama\"", "\"Good vibes only\"", "\"Just seeing what's out there\"", "Height listed very specifically", "\"Not on here much\"", "First message says only \"Hey\"", "Looks nothing like their photos", "Conversation fizzles", "One-word replies", "Immediate trauma dump", "Takes hours to reply", "Replies instantly every time", "Overuses emojis", "Doesn't use emojis at all", "Asks something already in your profile", "Matches but never messages", "Messages but never meets", "Suddenly disappears (ghosting)", "Reappears weeks later", "Says \"Sorry, I'm bad at texting\"", "Unmatches randomly", "Wants to move off the app immediately", "Asks for socials right away", "Sends voice notes unexpectedly", "Sends memes as flirting", "Awkward greeting hug", "Awkward greeting wave", "Instant chemistry", "No chemistry at all", "Nervous laughter", "Overthinking what to order", "Talks too much", "Doesn't ask many questions", "Checks phone during date", "Mentions ex casually", "Job talk too early", "Family talk too early", "Therapy talk too early", "Future plans too early", "Avoids all personal topics", "Repeats the same stories", "Overshares", "Asks oddly specific questions", "Love bombs on date one", "Refers to themselves as \"a nice guy/girl/person\"", "Complains about all exes", "Talks only about themselves", "\"Had a great time!\" then ghosts", "Rude to service staff", "Won't make eye contact", "Talks negatively about everything", "Badmouths the app constantly", "Clearly not over someone", "Too intense too fast", "Avoids answering basic questions", "\"So… how do we do this?\" (bill)", "\"Just ask\"", "\"Not here for hookups (but…)\"", "Sexual comment within 3 messages", "Suggests \"walking date\"", "Suggests coffee \"just to see\"", "Cancels last minute", "Reschedules multiple times", "Accidentally sends a message meant for someone else", "Great chat but never asks you out", "Says \"let's do this again\", then vanishes", "Wrong age in profile, weird excuse about it", "Compares you to their ex", "Uses a photo from 10 years ago", "\"What are you looking for?\"", "\"Let's go with the flow\"", "Mentions other dates", "\"I'm just focusing on myself\"", "\"I wasn't expecting to meet someone like you\""],
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
    const oldTemplateNames = ["Office Jargon", "Birds", "Things kids do", "Adulting"];
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
      } else {
        // Check if description or items have changed
        const itemsChanged = JSON.stringify(existingTemplate.items) !== JSON.stringify(template.items);
        const descriptionChanged = existingTemplate.description !== template.description;

        if (itemsChanged || descriptionChanged) {
          // Update both description and items if either changed
          await app.db.update(schema.bingoTemplates)
            .set({
              description: template.description,
              items: template.items
            })
            .where(eq(schema.bingoTemplates.name, template.name));
          app.logger.info({ templateName: template.name, itemsChanged, descriptionChanged }, 'Updated bingo template');
        }
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
        isStarted: false,
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
      isStarted?: boolean;
      firstBingoTime?: number;
      threeBingosTime?: number;
      fullCardTime?: number;
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

      if (body.isStarted !== undefined) {
        updates.isStarted = body.isStarted;
      }

      if (body.firstBingoTime !== undefined) {
        updates.firstBingoTime = body.firstBingoTime;
      }

      if (body.threeBingosTime !== undefined) {
        updates.threeBingosTime = body.threeBingosTime;
      }

      if (body.fullCardTime !== undefined) {
        updates.fullCardTime = body.fullCardTime;
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

      app.logger.info({ gameId: id, completed: updatedGame.completed, bingoCount: updatedGame.bingoCount, isStarted: updatedGame.isStarted }, 'Bingo game updated successfully');
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

  // DELETE /api/bingo/games/:id - Delete a game
  fastify.delete('/games/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    app.logger.info({ gameId: id }, 'Deleting bingo game');

    try {
      const [game] = await app.db
        .select()
        .from(schema.bingoGames)
        .where(eq(schema.bingoGames.id, id));

      if (!game) {
        app.logger.warn({ gameId: id }, 'Game not found for deletion');
        return reply.status(404).send({ error: 'Game not found' });
      }

      await app.db.delete(schema.bingoGames).where(eq(schema.bingoGames.id, id));

      app.logger.info({ gameId: id, templateName: game.templateName }, 'Bingo game deleted successfully');
      return { success: true, message: 'Game deleted successfully' };
    } catch (error) {
      app.logger.error({ err: error, gameId: id }, 'Failed to delete game');
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
