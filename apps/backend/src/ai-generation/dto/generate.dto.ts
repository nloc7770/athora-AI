import { IsEnum, IsUUID } from 'class-validator';

export enum GenerationType {
  SUMMARY = 'summary',
  FLASHCARD = 'flashcards',
  EXAM = 'exam',
  MINDMAP = 'mindmap',
}

export class GenerateDto {
  @IsUUID()
  documentId: string;

  @IsEnum(GenerationType)
  type: GenerationType;
}

export class GenerateSessionDto {
  @IsUUID()
  sessionId: string;

  @IsEnum(GenerationType)
  type: GenerationType;
}

export interface SummaryOutput {
  title: string;
  overview: string;
  chapters: { title: string; keyPoints: string[] }[];
  takeaways: string[];
}

export interface FlashcardOutput {
  cards: { front: string; back: string; difficulty: 'easy' | 'medium' | 'hard' }[];
}

export interface ExamOutput {
  questions: {
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer: string;
    explanation: string;
    predictedLikelihood: 'high' | 'medium' | 'low';
  }[];
}

export interface MindmapOutput {
  nodes: { id: string; label: string; parentId?: string }[];
  edges: { source: string; target: string }[];
}

export interface AiGeneration {
  id: string;
  user_id: string;
  document_id: string | null;
  session_id: string | null;
  type: GenerationType;
  status: 'pending' | 'completed' | 'failed';
  output: SummaryOutput | FlashcardOutput | ExamOutput | MindmapOutput | null;
  error?: string;
  created_at: string;
  updated_at: string;
}
