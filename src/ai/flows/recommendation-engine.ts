'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing personalized recommendations.
 * It analyzes user profiles and platform engagement data to suggest relevant events, job opportunities,
 * and mentorship connections.
 *
 * - getPersonalizedRecommendations - A function that handles the personalized recommendation process.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userProfile: z.object({
    userId: z.string().describe('Unique identifier for the user.'),
    userType: z.enum(['student', 'professor']).describe('Type of user: student or professor.'),
    university: z.string().describe("The user's university."),
    college: z.string().describe("The user's college within the university."),
    major: z.string().optional().describe('Major of the student, if applicable.'),
    graduationYear: z.number().optional().describe('Graduation year of the student, if applicable.'),
    department: z.string().optional().describe('Department of the professor, if applicable.'),
    researchInterests: z.string().optional().describe('Research interests of the professor, if applicable.'),
    preferences: z.array(z.string()).optional().describe('User indicated preferences (e.g., networking, career development, specific industries).'),
  }).describe('The user\'s profile information.'),
  engagementData: z.object({
    networkActivity: z.string().optional().describe('Summary of user\'s recent platform activity and interactions.'),
  }).optional().describe('User\'s engagement data.'),
  availableEvents: z.array(z.object({
    id: z.string().describe('Unique identifier for the event.'),
    name: z.string().describe('Name of the event.'),
    description: z.string().optional().describe('Brief description of the event.'),
    tags: z.array(z.string()).optional().describe('Relevant tags or categories for the event.'),
    university: z.string().optional().describe('The university hosting the event.'),
    college: z.string().optional().describe('The college within the university hosting the event.'),
  })).optional().describe('List of available events to consider for recommendation.'),
  availableJobOpportunities: z.array(z.object({
    id: z.string().describe('Unique identifier for the job opportunity.'),
    title: z.string().describe('Job title.'),
    company: z.string().optional().describe('Company offering the job.'),
    description: z.string().optional().describe('Brief description of the job.'),
    industry: z.string().optional().describe('Industry of the job.'),
    university: z.string().optional().describe('The university this job is associated with (e.g., through a career fair).'),
  })).optional().describe('List of available job opportunities to consider for recommendation.'),
  availableMentors: z.array(z.object({
    id: z.string().describe('Unique identifier for the mentor.'),
    name: z.string().describe('Name of the mentor.'),
    expertise: z.string().optional().describe('Mentor\'s area of expertise.'),
    industry: z.string().optional().describe('Mentor\'s industry.'),
    university: z.string().describe("The mentor's university."),
    college: z.string().describe("The mentor's college."),
  })).optional().describe('List of available mentors to consider for recommendation.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  recommendedEvents: z.array(z.object({
    id: z.string().describe('The ID of the recommended event.'),
    name: z.string().describe('The name of the recommended event.'),
    reasonsForRecommendation: z.string().describe('Brief explanation why this event is recommended.'),
  })).describe('List of recommended events.'),
  recommendedJobOpportunities: z.array(z.object({
    id: z.string().describe('The ID of the recommended job opportunity.'),
    title: z.string().describe('The title of the recommended job.'),
    company: z.string().optional().describe('The company offering the job.'),
    reasonsForRecommendation: z.string().describe('Brief explanation why this job is recommended.'),
  })).describe('List of recommended job opportunities.'),
  recommendedMentors: z.array(z.object({
    id: z.string().describe('The ID of the recommended mentor.'),
    name: z.string().describe('The name of the recommended mentor.'),
    reasonsForRecommendation: z.string().describe('Brief explanation why this mentor is recommended.'),
  })).describe('List of recommended mentorship connections.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;

export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const recommendationPrompt = ai.definePrompt({
  name: 'personalizedRecommendationPrompt',
  input: { schema: PersonalizedRecommendationsInputSchema },
  output: { schema: PersonalizedRecommendationsOutputSchema },
  prompt: `You are an AI-powered recommendation engine for the Nexus Alumni platform.
Your task is to provide personalized recommendations for events, job opportunities, and mentorship connections
based on the user's profile, engagement data, and available options.

Heavily prioritize recommendations that are relevant to the user's university and college.
Also consider their major, graduation year, department, research interests, and explicit preferences.
Also consider their network activity to suggest items they might find relevant based on past engagement.

User Profile:
- User ID: {{{userProfile.userId}}}
- User Type: {{{userProfile.userType}}}
- University: {{{userProfile.university}}}
- College: {{{userProfile.college}}}
{{#if userProfile.major}}- Major: {{{userProfile.major}}}{{/if}}
{{#if userProfile.graduationYear}}- Graduation Year: {{{userProfile.graduationYear}}}{{/if}}
{{#if userProfile.department}}- Department: {{{userProfile.department}}}{{/if}}
{{#if userProfile.researchInterests}}- Research Interests: {{{userProfile.researchInterests}}}{{/if}}
{{#if userProfile.preferences}}- Preferences: {{#each userProfile.preferences}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}

{{#if engagementData.networkActivity}}
User Engagement Data:
- Network Activity: {{{engagementData.networkActivity}}}
{{/if}}

{{#if availableEvents}}
Available Events:
{{#each availableEvents}}
- ID: {{{this.id}}}, Name: {{{this.name}}}, Description: {{{this.description}}}{{#if this.university}}, University: {{{this.university}}}{{/if}}{{#if this.college}}, College: {{{this.college}}}{{/if}}{{#if this.tags}}, Tags: {{#each this.tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{/if}}
{{/each}}
{{/if}}

{{#if availableJobOpportunities}}
Available Job Opportunities:
{{#each availableJobOpportunities}}
- ID: {{{this.id}}}, Title: {{{this.title}}}{{#if this.company}}, Company: {{{this.company}}}{{/if}}{{#if this.description}}, Description: {{{this.description}}}{{/if}}{{#if this.industry}}, Industry: {{{this.industry}}}{{/if}}{{#if this.university}}, University-affiliated: {{{this.university}}}{{/if}}
{{/each}}
{{/if}}

{{#if availableMentors}}
Available Mentors:
{{#each availableMentors}}
- ID: {{{this.id}}}, Name: {{{this.name}}}, University: {{{this.university}}}, College: {{{this.college}}}{{#if this.expertise}}, Expertise: {{{this.expertise}}}{{/if}}{{#if this.industry}}, Industry: {{{this.industry}}}{{/if}}
{{/each}}
{{/if}}

Provide your recommendations in a structured JSON format, including a brief reason for each recommendation. Select up to 3 recommendations for each category if available and relevant.
`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationPrompt(input);
    return output!;
  }
);
