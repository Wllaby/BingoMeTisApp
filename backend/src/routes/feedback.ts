import type { FastifyInstance } from "fastify";
import { Resend } from "resend";
import * as schema from "../db/schema.js";
import type { App } from "../index.js";

export function register(app: App, fastify: FastifyInstance) {
  // Initialize Resend only if API key is available
  const resendApiKey = process.env.RESEND_API_KEY;
  let resend: Resend | null = null;

  if (resendApiKey) {
    resend = new Resend(resendApiKey);
    app.logger.info('Resend email service initialized');
  } else {
    app.logger.warn('RESEND_API_KEY not set - email notifications will be disabled');
  }

  // POST /api/feedback - Submit feedback
  fastify.post('/feedback', async (request, reply) => {
    const body = request.body as { message: string; email?: string };

    app.logger.info({ email: body.email }, 'Submitting feedback');

    try {
      // Validate message
      if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
        app.logger.warn({ body }, 'Invalid feedback submission - empty message');
        return reply.status(400).send({ error: 'Message is required' });
      }

      // Store feedback in database
      const [feedback] = await app.db.insert(schema.feedback).values({
        message: body.message.trim(),
        email: body.email?.trim() || null,
      }).returning();

      app.logger.info({ feedbackId: feedback.id, email: body.email }, 'Feedback stored in database');

      // Send email if Resend is configured
      if (resend) {
        const emailSubject = 'Bingo App Feedback';
        let emailBody = `New feedback received:\n\n${body.message}`;
        if (body.email) {
          emailBody += `\n\nFrom: ${body.email}`;
        }

        const emailResponse = await resend.emails.send({
          from: 'feedback@bingometis.com',
          to: 'info@bingometis.com',
          subject: emailSubject,
          text: emailBody,
        });

        if (emailResponse.error) {
          app.logger.error(
            { err: emailResponse.error, feedbackId: feedback.id },
            'Failed to send feedback email'
          );
          // Still return success to user since feedback was saved to DB
        } else {
          app.logger.info({ feedbackId: feedback.id, emailId: emailResponse.data?.id }, 'Feedback email sent successfully');
        }
      } else {
        app.logger.debug({ feedbackId: feedback.id }, 'Email service not configured - skipping email notification');
      }

      return { success: true, message: 'Feedback sent successfully' };
    } catch (error) {
      app.logger.error({ err: error, body }, 'Failed to submit feedback');
      throw error;
    }
  });
}
