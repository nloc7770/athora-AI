-- Migration: AI Pipeline Tables
-- Description: RAGFlow integration, chat sessions, messages, and AI generation tracking

-- 1. document_datasets - maps documents to RAGFlow datasets
CREATE TABLE document_datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ragflow_dataset_id TEXT NOT NULL,
    ragflow_document_id TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'parsing', 'ready', 'error')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. chat_sessions - for document chat and AI tutor
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    ragflow_chat_id TEXT,
    ragflow_session_id TEXT,
    title TEXT,
    type TEXT NOT NULL CHECK (type IN ('document_chat', 'tutor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ai_generations - track all AI-generated content
CREATE TABLE ai_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('summary', 'flashcards', 'exam', 'mindmap', 'audio')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
    result JSONB,
    model_used TEXT,
    tokens_used INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_document_datasets_user_id ON document_datasets(user_id);
CREATE INDEX idx_document_datasets_document_id ON document_datasets(document_id);

CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_document_id ON chat_sessions(document_id);

CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_ai_generations_document_id ON ai_generations(document_id);

-- Enable Row Level Security
ALTER TABLE document_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: document_datasets
CREATE POLICY "Users can view own document_datasets"
    ON document_datasets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own document_datasets"
    ON document_datasets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own document_datasets"
    ON document_datasets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own document_datasets"
    ON document_datasets FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies: chat_sessions
CREATE POLICY "Users can view own chat_sessions"
    ON chat_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat_sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat_sessions"
    ON chat_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat_sessions"
    ON chat_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies: chat_messages (access via session ownership)
CREATE POLICY "Users can view own chat_messages"
    ON chat_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own chat_messages"
    ON chat_messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own chat_messages"
    ON chat_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
            AND chat_sessions.user_id = auth.uid()
        )
    );

-- RLS Policies: ai_generations
CREATE POLICY "Users can view own ai_generations"
    ON ai_generations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai_generations"
    ON ai_generations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai_generations"
    ON ai_generations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai_generations"
    ON ai_generations FOR DELETE
    USING (auth.uid() = user_id);
