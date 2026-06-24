import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { DocumentsModule } from './documents/documents.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { ExamsModule } from './exams/exams.module';
import { AiModule } from './ai/ai.module';
import { RagflowModule } from './ragflow/ragflow.module';
import { ChatModule } from './chat/chat.module';
import { AiGenerationModule } from './ai-generation/ai-generation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    RagflowModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    DocumentsModule,
    FlashcardsModule,
    ExamsModule,
    ChatModule,
    AiGenerationModule,
  ],
})
export class AppModule {}
