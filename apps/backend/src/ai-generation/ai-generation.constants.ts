import { GenerationType } from './dto/generate.dto';

export const AI_GENERATION_QUEUE = 'ai-generation';

export interface AiGenerationJobData {
  userId: string;
  generationId: string;
  datasetId: string;
  documentId: string | null;
  sessionId: string | null;
  type: GenerationType;
}
