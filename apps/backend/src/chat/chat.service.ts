import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { RagflowService, Chunk } from '../ragflow/ragflow.service';
import { LlmService } from '../ai/llm.service';
import { CreateSessionDto, ChatSessionType } from './dto/create-session.dto';
import type { ChatMessage as LlmChatMessage } from '../ai/dto/chat.dto';

export interface ChatSession {
  readonly id: string;
  readonly userId: string;
  readonly documentId: string | null;
  readonly type: ChatSessionType;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ChatMessageRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly role: 'user' | 'assistant';
  readonly content: string;
  readonly sources: ChunkSource[] | null;
  readonly createdAt: string;
}

export interface ChunkSource {
  readonly chunkId: string;
  readonly content: string;
  readonly score: number;
}

export interface ChatResponse {
  readonly message: ChatMessageRecord;
  readonly sources: ChunkSource[];
}

const TUTOR_SYSTEM_PROMPT = `You are an AI tutor helping students study and prepare for exams. You:
- Explain concepts clearly and concisely
- Use analogies and examples to aid understanding
- Break down complex topics into digestible parts
- Ask follow-up questions to check understanding
- Encourage active recall and spaced repetition
- Adapt your explanations to the student's level
- Never give direct answers to exam questions; guide the student to discover the answer

Always respond in the same language the student uses.
Keep responses concise. Use short paragraphs. Avoid large headings (h1, h2) — use bold text or small headers (h4) instead.`;

const DOCUMENT_CHAT_SYSTEM_PROMPT = `You are a study assistant for a specific set of documents. You must ONLY answer questions based on the provided document context below.

STRICT RULES:
- If the question is NOT related to the document content, reply: "This question is outside the scope of your uploaded documents. I can only help with topics covered in your study materials."
- Do NOT answer general knowledge questions, career advice, salary info, or anything not in the documents.
- If the context section is empty, say: "I don't have any document context to work with. Please make sure your documents are processed."
- When answering, cite specific parts of the documents.
- Keep responses concise and study-focused.

Always respond in the same language the student uses.

## Document Context
{context}`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragflowService: RagflowService,
    private readonly llmService: LlmService,
  ) {}

  async createSession(
    userId: string,
    dto: CreateSessionDto,
  ): Promise<ChatSession> {
    if (dto.type === 'document_chat' && !dto.documentId && !dto.sessionId) {
      throw new BadRequestException(
        'documentId or sessionId is required for document_chat sessions',
      );
    }

    if (dto.documentId) {
      const { data: doc, error } = await this.supabaseService
        .getAdminClient()
        .from('documents')
        .select('id, user_id')
        .eq('id', dto.documentId)
        .eq('user_id', userId)
        .single();

      if (error || !doc) {
        throw new NotFoundException('Document not found');
      }
    }

    const title =
      dto.type === 'tutor' ? 'AI Tutor Session' : 'Document Chat';

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('chat_sessions')
      .insert({
        user_id: userId,
        document_id: dto.documentId ?? null,
        study_session_id: dto.sessionId ?? null,
        type: dto.type,
        title,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create chat session', { error });
      throw new BadRequestException('Failed to create session');
    }

    return this.mapSession(data);
  }

  async sendMessage(
    userId: string,
    sessionId: string,
    message: string,
    courseContext?: string,
  ): Promise<ChatResponse> {
    const session = await this.getSessionOrThrow(userId, sessionId);
    const history = await this.getHistory(userId, sessionId);

    await this.storeMessage(sessionId, 'user', message, null);

    let assistantContent: string;
    let sources: ChunkSource[] = [];

    if (session.type === 'document_chat') {
      const result = await this.handleDocumentChat(
        session,
        message,
        history,
      );
      assistantContent = result.content;
      sources = result.sources;
    } else {
      assistantContent = await this.handleTutorChat(userId, message, history, courseContext);
    }

    const assistantMessage = await this.storeMessage(
      sessionId,
      'assistant',
      assistantContent,
      sources.length > 0 ? sources : null,
    );

    await this.updateSessionTimestamp(sessionId);

    return { message: assistantMessage, sources };
  }

  async *sendMessageStream(
    userId: string,
    sessionId: string,
    message: string,
  ): AsyncGenerator<string> {
    const session = await this.getSessionOrThrow(userId, sessionId);
    const history = await this.getHistory(userId, sessionId);

    await this.storeMessage(sessionId, 'user', message, null);

    let sources: ChunkSource[] = [];
    const llmMessages = await this.buildLlmMessages(
      session,
      message,
      history,
    );

    if (session.type === 'document_chat') {
      const chunks = await this.retrieveDocumentChunks(session, message);
      sources = chunks.map((c) => ({
        chunkId: c.id,
        content: c.content,
        score: c.score,
      }));

      const contextText = chunks.length > 0
        ? chunks.map((c) => c.content).join('\n\n---\n\n')
        : '[NO DOCUMENT CONTEXT AVAILABLE - The documents have not been processed yet or no relevant content was found. You MUST refuse to answer and tell the user to ensure documents are uploaded and processed.]';

      const systemPrompt = DOCUMENT_CHAT_SYSTEM_PROMPT.replace(
        '{context}',
        contextText,
      );

      llmMessages[0] = { role: 'system', content: systemPrompt };
    } else {
      // Tutor: retrieve from all user's datasets
      const chunks = await this.retrieveAllUserChunks(userId, message);
      if (chunks.length > 0) {
        const context = chunks.map((c) => c.content).join('\n\n---\n\n');
        llmMessages[0] = {
          role: 'system',
          content: `${llmMessages[0].content}\n\nRelevant context from the student's documents:\n${context}`,
        };
      }
    }

    let fullContent = '';

    for await (const chunk of this.llmService.chatStream(llmMessages)) {
      fullContent += chunk;
      yield chunk;
    }

    await this.storeMessage(
      sessionId,
      'assistant',
      fullContent,
      sources.length > 0 ? sources : null,
    );

    await this.updateSessionTimestamp(sessionId);
  }

  async getHistory(
    userId: string,
    sessionId: string,
  ): Promise<ChatMessageRecord[]> {
    await this.getSessionOrThrow(userId, sessionId);

    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      this.logger.error('Failed to fetch chat history', { error });
      return [];
    }

    return (data ?? []).map(this.mapMessage);
  }

  async getSessions(
    userId: string,
    documentId?: string,
    studySessionId?: string,
  ): Promise<ChatSession[]> {
    let query = this.supabaseService
      .getAdminClient()
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (documentId) {
      query = query.eq('document_id', documentId);
    }

    if (studySessionId) {
      query = query.eq('study_session_id', studySessionId);
    }

    const { data, error } = await query;

    if (error) {
      this.logger.error('Failed to fetch sessions', { error });
      return [];
    }

    return (data ?? []).map(this.mapSession);
  }

  private async getSessionOrThrow(
    userId: string,
    sessionId: string,
  ): Promise<ChatSession> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      throw new NotFoundException('Chat session not found');
    }

    if (data.user_id !== userId) {
      throw new ForbiddenException('Access denied to this session');
    }

    return this.mapSession(data);
  }

  private async handleDocumentChat(
    session: ChatSession,
    message: string,
    history: ChatMessageRecord[],
  ): Promise<{ content: string; sources: ChunkSource[] }> {
    const chunks = await this.retrieveDocumentChunks(session, message);

    const sources: ChunkSource[] = chunks.map((c) => ({
      chunkId: c.id,
      content: c.content,
      score: c.score,
    }));

    const context = chunks.map((c) => c.content).join('\n\n---\n\n');
    const systemPrompt = DOCUMENT_CHAT_SYSTEM_PROMPT.replace(
      '{context}',
      context,
    );

    const llmMessages: LlmChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.buildHistoryMessages(history),
      { role: 'user', content: message },
    ];

    const content = await this.llmService.chat(llmMessages);

    return { content, sources };
  }

  private async handleTutorChat(
    userId: string,
    message: string,
    history: ChatMessageRecord[],
    courseContext?: string,
  ): Promise<string> {
    // Retrieve chunks from ALL user's datasets for global context
    const chunks = await this.retrieveAllUserChunks(userId, message);

    let systemPrompt = courseContext
      ? `${TUTOR_SYSTEM_PROMPT}\n\nThe student is currently studying: ${courseContext}. Tailor your responses to this course context.`
      : TUTOR_SYSTEM_PROMPT;

    if (chunks.length > 0) {
      const context = chunks.map((c) => c.content).join('\n\n---\n\n');
      systemPrompt += `\n\nRelevant context from the student's documents:\n${context}`;
    }

    const llmMessages: LlmChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.buildHistoryMessages(history),
      { role: 'user', content: message },
    ];

    return this.llmService.chat(llmMessages);
  }

  private async retrieveAllUserChunks(
    userId: string,
    query: string,
  ): Promise<Chunk[]> {
    // Get ALL user's study sessions with ragflow datasets
    const { data: sessions } = await this.supabaseService
      .getAdminClient()
      .from('study_sessions')
      .select('ragflow_dataset_id')
      .eq('user_id', userId)
      .not('ragflow_dataset_id', 'is', null);

    if (!sessions || sessions.length === 0) return [];

    const datasetIds = sessions
      .map((s) => s.ragflow_dataset_id)
      .filter(Boolean) as string[];

    if (datasetIds.length === 0) return [];

    try {
      // Single RAGFlow call across ALL datasets — handles ranking internally
      const chunks = await this.ragflowService.retrieveChunks(
        datasetIds,
        query,
        15, // Retrieve more, then trim to top 10 for context
      );

      return chunks.slice(0, 10);
    } catch (error) {
      this.logger.error('Failed to retrieve chunks for tutor', { error });
      return [];
    }
  }

  private async buildLlmMessages(
    session: ChatSession,
    message: string,
    history: ChatMessageRecord[],
  ): Promise<LlmChatMessage[]> {
    const systemPrompt =
      session.type === 'tutor'
        ? TUTOR_SYSTEM_PROMPT
        : DOCUMENT_CHAT_SYSTEM_PROMPT;

    return [
      { role: 'system', content: systemPrompt },
      ...this.buildHistoryMessages(history),
      { role: 'user', content: message },
    ];
  }

  private buildHistoryMessages(
    history: ChatMessageRecord[],
  ): LlmChatMessage[] {
    const recentHistory = history.slice(-20);

    return recentHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  }

  private async retrieveDocumentChunks(
    session: ChatSession,
    query: string,
  ): Promise<Chunk[]> {
    const datasetIds: string[] = [];

    // Try document-level first
    if (session.documentId) {
      const { data: doc } = await this.supabaseService
        .getAdminClient()
        .from('documents')
        .select('ragflow_dataset_id')
        .eq('id', session.documentId)
        .single();

      if (doc?.ragflow_dataset_id) datasetIds.push(doc.ragflow_dataset_id);
    }

    // Try study session level — get ALL datasets from docs in this session
    if (datasetIds.length === 0) {
      const { data: chatSession } = await this.supabaseService
        .getAdminClient()
        .from('chat_sessions')
        .select('study_session_id')
        .eq('id', session.id)
        .single();

      if (chatSession?.study_session_id) {
        // First try session's own dataset
        const { data: studySession } = await this.supabaseService
          .getAdminClient()
          .from('study_sessions')
          .select('ragflow_dataset_id')
          .eq('id', chatSession.study_session_id)
          .single();

        if (studySession?.ragflow_dataset_id) {
          datasetIds.push(studySession.ragflow_dataset_id);
        }

        // Also get all document datasets within this session
        const { data: sessionDocs } = await this.supabaseService
          .getAdminClient()
          .from('documents')
          .select('ragflow_dataset_id')
          .eq('session_id', chatSession.study_session_id)
          .not('ragflow_dataset_id', 'is', null);

        if (sessionDocs) {
          sessionDocs.forEach((d) => {
            if (d.ragflow_dataset_id && !datasetIds.includes(d.ragflow_dataset_id)) {
              datasetIds.push(d.ragflow_dataset_id);
            }
          });
        }
      }
    }

    if (datasetIds.length === 0) {
      this.logger.warn('No dataset found for chat session', { sessionId: session.id });
      return [];
    }

    try {
      const chunks = await this.ragflowService.retrieveChunks(datasetIds, query, 10);

      if (chunks.length === 0) {
        this.logger.warn('Semantic retrieval returned 0 chunks, falling back to direct chunk listing');
        return await this.ragflowService.getDocumentChunks(datasetIds[0]);
      }

      return chunks;
    } catch (error) {
      this.logger.error('Failed to retrieve chunks from RAGFlow', { error });
      return [];
    }
  }

  private async storeMessage(
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    sources: ChunkSource[] | null,
  ): Promise<ChatMessageRecord> {
    const { data, error } = await this.supabaseService
      .getAdminClient()
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        sources: sources ? JSON.stringify(sources) : null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to store message', { error, sessionId });
      throw new BadRequestException('Failed to store message');
    }

    return this.mapMessage(data);
  }

  private async updateSessionTimestamp(sessionId: string): Promise<void> {
    await this.supabaseService
      .getAdminClient()
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }

  private mapSession(data: any): ChatSession {
    return {
      id: data.id,
      userId: data.user_id,
      documentId: data.document_id ?? null,
      type: data.type,
      title: data.title ?? null,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private mapMessage(data: any): ChatMessageRecord {
    let sources: ChunkSource[] | null = null;

    if (data.sources) {
      try {
        sources =
          typeof data.sources === 'string'
            ? JSON.parse(data.sources)
            : data.sources;
      } catch {
        sources = null;
      }
    }

    return {
      id: data.id,
      sessionId: data.session_id,
      role: data.role,
      content: data.content,
      sources,
      createdAt: data.created_at,
    };
  }
}
