import { DocumentProcessorService } from './document-processor.service';
import { SttError } from './stt.service';

/**
 * Universal chainable supabase builder: every method returns the builder,
 * awaiting it resolves {data:null,error:null}, single() too. Enough surface
 * for the processor's write-mostly flow.
 */
function makeSupabase() {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const builder: Record<string, unknown> = {};
  for (const m of ['select', 'update', 'insert', 'upsert', 'eq', 'is', 'not', 'in', 'order', 'limit', 'range']) {
    builder[m] = (...args: unknown[]) => {
      calls.push({ method: m, args });
      return builder;
    };
  }
  builder['single'] = async () => ({ data: null, error: null });
  builder['then'] = (resolve: (v: unknown) => void) => resolve({ data: null, error: null });

  const client = {
    from: () => builder,
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        createSignedUrl: async () => ({ data: { signedUrl: 'https://signed.test/file' }, error: null }),
        list: async () => ({ data: [], error: null }),
      }),
    },
  };
  const service = {
    getClient: () => client,
    getAdminClient: () => client,
  };
  return { service, calls, builder };
}

function makeConfig() {
  // 1ms polling so tests don't wait 5s per poll attempt.
  return { get: (key: string, def?: unknown) => (key === 'RAGFLOW_POLLING_INTERVAL_MS' ? 1 : def) };
}

const RAGFLOW = {
  createDataset: jest.fn().mockResolvedValue({ id: 'ds-1' }),
  uploadDocument: jest.fn().mockResolvedValue({ id: 'rd-1' }),
  parseDocument: jest.fn().mockResolvedValue(undefined),
  getDocumentStatus: jest.fn().mockResolvedValue({ status: '1', progress: 100 }),
};

const STT = { transcribe: jest.fn() };
const ANALYTICS = { logActivity: jest.fn().mockResolvedValue(undefined) };

function makeService(db: ReturnType<typeof makeSupabase>) {
  return new DocumentProcessorService(
    db.service as never,
    RAGFLOW as never,
    makeConfig() as never,
    {} as never,
    ANALYTICS as never,
    STT as never,
  );
}

const AUDIO_FILE = {
  buffer: Buffer.from('fake audio bytes'),
  originalname: 'lecture.mp3',
  mimetype: 'audio/mpeg',
  size: 1024,
} as Express.Multer.File;

const PDF_FILE = {
  buffer: Buffer.from('%PDF-1.4 fake'),
  originalname: 'notes.pdf',
  mimetype: 'application/pdf',
  size: 2048,
} as Express.Multer.File;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DocumentProcessorService audio → STT branch', () => {
  it('transcribes audio, persists the transcript, and feeds the .txt into RAGFlow', async () => {
    const db = makeSupabase();
    STT.transcribe.mockResolvedValue({ text: 'hello world' });
    const svc = makeService(db);

    await svc.processDocument('user-1', 'doc-1', AUDIO_FILE);

    expect(STT.transcribe).toHaveBeenCalledTimes(1);
    expect(STT.transcribe).toHaveBeenCalledWith(AUDIO_FILE.buffer, 'lecture.mp3', 'audio/mpeg');

    // Transcript persisted to the DB before RAGFlow ingestion.
    const transcriptWrites = db.calls.filter(
      (c) => c.method === 'update' && typeof c.args[0] === 'object' && c.args[0] !== null && 'transcript' in (c.args[0] as object),
    );
    expect(transcriptWrites).toHaveLength(1);

    // RAGFlow receives the transcript as a .txt, not the audio bytes.
    expect(RAGFLOW.uploadDocument).toHaveBeenCalledWith(
      'ds-1',
      Buffer.from('hello world', 'utf8'),
      'lecture.txt',
    );
  });

  it('marks the document failed and skips RAGFlow when STT throws', async () => {
    const db = makeSupabase();
    STT.transcribe.mockRejectedValue(new SttError('Audio transcription is not configured'));
    const svc = makeService(db);

    await expect(svc.processDocument('user-1', 'doc-2', AUDIO_FILE)).rejects.toThrow(SttError);

    expect(RAGFLOW.uploadDocument).not.toHaveBeenCalled();
    expect(RAGFLOW.parseDocument).not.toHaveBeenCalled();

    const failedWrites = db.calls.filter(
      (c) =>
        c.method === 'update' &&
        typeof c.args[0] === 'object' &&
        (c.args[0] as Record<string, unknown>)?.['status'] === 'failed',
    );
    expect(failedWrites.length).toBeGreaterThan(0);
  });

  it('never touches STT for pdf uploads (old flow unchanged)', async () => {
    const db = makeSupabase();
    const svc = makeService(db);

    await svc.processDocument('user-1', 'doc-3', PDF_FILE);

    expect(STT.transcribe).not.toHaveBeenCalled();
    expect(RAGFLOW.uploadDocument).toHaveBeenCalledWith('ds-1', PDF_FILE.buffer, 'notes.pdf');
    expect(RAGFLOW.parseDocument).toHaveBeenCalledWith('ds-1', ['rd-1']);
  });
});
