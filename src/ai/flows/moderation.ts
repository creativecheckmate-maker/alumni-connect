'use server';
/**
 * @fileOverview A content moderation AI agent for the Nexus Alumni platform.
 * It analyzes text and images for vulgarity, abusive language, and NSFW content.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerationInputSchema = z.object({
  text: z.string().optional().describe('Text content to moderate.'),
  imageUrl: z.string().optional().describe('URL of an image to moderate.'),
});
export type ModerationInput = z.infer<typeof ModerationInputSchema>;

const ModerationOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the content is safe for a professional alumni network.'),
  reason: z.string().optional().describe('Reason if the content is flagged.'),
});
export type ModerationOutput = z.infer<typeof ModerationOutputSchema>;

export async function moderateContent(input: ModerationInput): Promise<ModerationOutput> {
  return moderationFlow(input);
}

const moderationPrompt = ai.definePrompt({
  name: 'moderationPrompt',
  input: { schema: ModerationInputSchema },
  output: { schema: ModerationOutputSchema },
  prompt: `You are a strict content moderator for a professional university alumni network.
  
  Your task is to analyze the following content for:
  1. Abusive language or hate speech.
  2. Vulgarity or extreme profanity.
  3. Sexually explicit material or NSFW imagery (if image URL provided).
  4. Harassment or bullying.

  Content to evaluate:
  {{#if text}}Text: "{{{text}}}"{{/if}}
  {{#if imageUrl}}Image URL: {{{imageUrl}}}{{/if}}

  If the content contains any of the above, set isSafe to false and provide a brief reason.
  If the content is professional and safe, set isSafe to true.`,
});

const moderationFlow = ai.defineFlow(
  {
    name: 'moderationFlow',
    inputSchema: ModerationInputSchema,
    outputSchema: ModerationOutputSchema,
  },
  async (input) => {
    const { output } = await moderationPrompt(input);
    return output!;
  }
);
