
import { config } from 'dotenv';
config();

import '@/ai/flows/recommendation-engine.ts';
import '@/ai/flows/moderation.ts';
import '@/ai/flows/faculty-ranker.ts';
