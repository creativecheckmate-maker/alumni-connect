
'use server';
/**
 * @fileOverview AI-powered Faculty Reputation Intelligence.
 * Analyzes faculty metrics and feedback to generate professional reputation insights.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const FacultyReputationInputSchema = z.object({
  facultyMembers: z.array(z.object({
    id: z.string(),
    name: z.string(),
    department: z.string().optional(),
    feedbackRating: z.number(),
    feedbackCount: z.number(),
    researchInterests: z.array(z.string()).optional(),
  })),
});
export type FacultyReputationInput = z.infer<typeof FacultyReputationInputSchema>;

const FacultyReputationOutputSchema = z.object({
  analyzedFaculty: z.array(z.object({
    id: z.string(),
    persona: z.string().describe('A 2-3 word persona like "Expert Mentor" or "Research Leader".'),
    summary: z.string().describe('A professional summary of their reputation based on student sentiment and data.'),
    rankAdjustmentScore: z.number().describe('A score adjustment based on engagement quality (0-10).'),
  })),
});
export type FacultyReputationOutput = z.infer<typeof FacultyReputationOutputSchema>;

export async function analyzeFacultyReputation(input: FacultyReputationInput): Promise<FacultyReputationOutput> {
  return facultyRankerFlow(input);
}

const reputationPrompt = ai.definePrompt({
  name: 'facultyReputationPrompt',
  input: { schema: FacultyReputationInputSchema },
  output: { schema: FacultyReputationOutputSchema },
  prompt: `You are an AI Academic Analyst for Nexus University.
  Your task is to analyze student feedback and performance metrics for the following faculty members to determine their professional reputation within the network.
  
  Consider the following:
  1. Feedback Rating: High scores (90+) indicate excellence.
  2. Feedback Count: High volume indicates a significant community footprint.
  3. Research Diversity: Specialized interests add value to their profile.

  Faculty List:
  {{#each facultyMembers}}
  - Name: {{{this.name}}}
    Department: {{{this.department}}}
    Rating: {{{this.feedbackRating}}}/100
    Reviews: {{{this.feedbackCount}}}
    Interests: {{#each this.researchInterests}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
  {{/each}}

  For each faculty member, generate a professional persona and a concise summary.
  Provide your analysis in the requested JSON structure.`,
});

const facultyRankerFlow = ai.defineFlow(
  {
    name: 'facultyRankerFlow',
    inputSchema: FacultyReputationInputSchema,
    outputSchema: FacultyReputationOutputSchema,
  },
  async (input) => {
    const { output } = await reputationPrompt(input);
    return output!;
  }
);
