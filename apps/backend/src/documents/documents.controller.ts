import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { DocumentsService } from './documents.service';
import { DocumentProcessorService } from './document-processor.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Controller('documents')
@UseGuards(SupabaseAuthGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly documentProcessorService: DocumentProcessorService,
  ) {}

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('courseId') courseId?: string,
    @Query('type') type?: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.documentsService.findAll(userId, { courseId, type, sessionId });
  }

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.findOne(userId, id);
  }

  @Get(':id/status')
  getStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentProcessorService.getProcessingStatus(userId, id);
  }

  @Get(':id/url')
  getSignedUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentProcessorService.getDocumentSignedUrl(userId, id);
  }

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateDocumentDto) {
    return this.documentsService.create(userId, dto);
  }

  @Post('upload')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({ fileType: /(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('name') name?: string,
    @Body('courseId') courseId?: string,
    @Body('sessionId') sessionId?: string,
  ) {
    // Determine document type from mimetype
    const mimeToType: Record<string, string> = {
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'doc',
    };
    const docType = mimeToType[file.mimetype] ?? 'pdf';

    // Validate file content
    if (!file.buffer || file.buffer.length < 4) {
      throw new BadRequestException('Invalid file: file is empty or too small');
    }

    // PDF magic byte check (only for PDFs)
    if (docType === 'pdf') {
      const header = file.buffer.subarray(0, 5).toString();
      if (!header.startsWith('%PDF-')) {
        throw new BadRequestException('Invalid PDF file: content does not match PDF format');
      }
    }

    const ext = file.originalname.match(/\.[^.]+$/)?.[0] ?? '';
    const documentName = name || file.originalname.replace(ext, '');

    // Store as 'pdf' type in DB (RAGFlow handles doc/docx the same way)
    const document = await this.documentsService.create(userId, {
      name: documentName,
      type: 'pdf',
      course_id: courseId,
      session_id: sessionId,
      file_size: file.size,
    });

    this.documentProcessorService
      .processDocument(userId, document.id, file)
      .catch(() => {
        // Error handling is done inside processDocument (status set to 'failed')
      });

    return {
      id: document.id,
      name: document.name,
      status: 'uploading',
    };
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.delete(userId, id);
  }
}
