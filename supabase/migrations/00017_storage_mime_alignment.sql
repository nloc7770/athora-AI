-- Align the `documents` bucket's MIME whitelist with what the API already accepts.
--
-- 00002 created the bucket allowing only pdf / mpeg / mp4 / wav / plain / markdown.
-- Meanwhile documents.controller.ts ACCEPTED_MIME admits .doc, .docx and a much
-- wider audio set, and the upload UIs offer them. The request therefore passed
-- validation, created a document row, then died inside uploadToStorage with
-- "mime type ... is not supported" — surfacing as a failed document rather than
-- a clean 400.
--
-- Additive only: every MIME from 00002 is retained, so anything that uploads
-- today keeps uploading. Idempotent — safe to re-run.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- documents (RAGFlow parsing path)
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  -- audio (STT path). x-m4a/x-wav/wave/vnd.wave are the same containers under
  -- the names different browsers and phones actually send.
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/vnd.wave',
  'audio/ogg',
  'audio/webm',
  -- video (STT path). Phones label voice memos as video/mp4 and MediaRecorder
  -- emits video/webm.
  'video/mp4',
  'video/webm'
]
WHERE id = 'documents';
