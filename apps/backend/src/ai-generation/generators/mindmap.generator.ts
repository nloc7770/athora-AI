import { Injectable, Logger } from '@nestjs/common';
import { LlmService } from '../../ai/llm.service';
import { RagflowService, Chunk } from '../../ragflow/ragflow.service';
import { MindmapOutput } from '../dto/generate.dto';

const MINDMAP_SCHEMA = {
  type: 'object',
  properties: {
    nodes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          parentId: { type: 'string' },
        },
        required: ['id', 'label'],
      },
    },
    edges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          source: { type: 'string' },
          target: { type: 'string' },
        },
        required: ['source', 'target'],
      },
    },
  },
  required: ['nodes', 'edges'],
};

@Injectable()
export class MindmapGenerator {
  private readonly logger = new Logger(MindmapGenerator.name);

  constructor(
    private readonly llmService: LlmService,
    private readonly ragflowService: RagflowService,
  ) {}

  async generate(datasetId: string, documentId: string | null): Promise<MindmapOutput> {
    const chunks = await this.ragflowService.getDocumentChunks(
      datasetId,
    );

    const content = this.buildContentFromChunks(chunks);

    this.logger.log(`Generating mindmap from ${chunks.length} chunks`);

    return this.llmService.generateJson<MindmapOutput>(
      [
        {
          role: 'user',
          content: [
            'Create a mind map structure from this content.',
            'The root node should represent the main topic.',
            'Branch into major subtopics, then into specific concepts.',
            'Exactly one root node with no parentId; every other node must have parentId pointing to an existing node.',
            'Strictly a tree: never create cycles or duplicate parents.',
            'Maximum 3 levels deep (root → subtopic → concept). 20 to 60 nodes total.',
            'Each node needs a unique id and descriptive label.',
            'Use parentId to define hierarchy. Edges connect parent to child.',
            'Keep labels concise but informative.',
            '',
            'Document content:',
            content,
          ].join('\n'),
        },
      ],
      MINDMAP_SCHEMA,
    );
  }

  private buildContentFromChunks(chunks: Chunk[]): string {
    return chunks.map((c) => c.content).join('\n\n');
  }
}
