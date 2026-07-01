export type ViewMode = 'grid' | 'list'
export type DocumentType = 'pdf' | 'audio' | 'video' | 'note'
export type FilterType = 'all' | 'favorites' | DocumentType
export type DocumentStatus = 'ready' | 'processing' | 'error'
export type SortOption = 'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'largest'

export interface DocumentItem {
  id: string
  name: string
  type: string
  courseId?: string
  session_id?: string
  status: string
  file_size?: number
  pageCount?: number
  createdAt: string
  updatedAt: string
}

export interface UploadingFile {
  file: File
  status: 'uploading' | 'done' | 'error'
  documentId?: string
  error?: string
}

export interface CourseItem {
  id: string
  name: string
  code?: string
  color?: string
}
