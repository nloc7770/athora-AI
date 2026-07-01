'use client'

import { cn } from '@/lib/utils'
import {
  Star,
  MoreVertical,
  BookOpen,
  Brain,
  ClipboardList,
  MessageSquare,
  CheckSquare,
  Square,
  FileText,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { DocumentItem, DocumentType, DocumentStatus } from './types'
import { typeIconMap, typeColorMap, formatFileDate } from './utils'

interface DocumentCardProps {
  document: DocumentItem
  courseName: string
  courseColor?: string
  onDelete: (id: string) => void
  onOpen: (doc: DocumentItem) => void
  onRename: (doc: DocumentItem) => void
  onMove: (doc: DocumentItem) => void
  onQuickAction: (doc: DocumentItem, tab: string) => void
  isFavorite: boolean
  onToggleFavorite: (id: string) => void
  selectMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  const config: Record<DocumentStatus, { label: string; className: string }> = {
    ready: {
      label: 'Ready',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
    },
    processing: {
      label: 'Processing',
      className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800 animate-pulse',
    },
    error: {
      label: 'Error',
      className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800',
    },
  }

  const safeStatus: DocumentStatus =
    status === 'ready' || status === 'processing' || status === 'error'
      ? status
      : 'processing'

  const { label, className } = config[safeStatus]
  const isProcessing = safeStatus === 'processing'

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', className)}>
      {isProcessing && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
      )}
      {label}
    </span>
  )
}

function QuickActions({ document, onQuickAction }: { document: DocumentItem; onQuickAction: (doc: DocumentItem, tab: string) => void }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'summary') }}
                className="rounded-md p-1.5 text-stone-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition-colors"
                aria-label="Generate Summary"
              />
            }
          >
            <BookOpen className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>Summary</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'flashcards') }}
                className="rounded-md p-1.5 text-stone-400 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 dark:hover:text-purple-400 transition-colors"
                aria-label="Generate Flashcards"
              />
            }
          >
            <Brain className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>Flashcards</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'exam') }}
                className="rounded-md p-1.5 text-stone-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40 dark:hover:text-amber-400 transition-colors"
                aria-label="Generate Exam"
              />
            }
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>Exam</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'chat') }}
                className="rounded-md p-1.5 text-stone-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 transition-colors"
                aria-label="Chat with Document"
              />
            }
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </TooltipTrigger>
          <TooltipContent>Chat</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export function DocumentCard({
  document,
  courseName,
  onDelete,
  onOpen,
  onRename,
  onMove,
  onQuickAction,
  isFavorite,
  onToggleFavorite,
  selectMode,
  isSelected,
  onToggleSelect,
}: DocumentCardProps) {
  const docType = document.type as DocumentType
  const Icon = typeIconMap[docType] ?? FileText
  const colors = typeColorMap[docType] ?? { icon: 'text-stone-600', bg: 'bg-stone-50', darkBg: 'dark:bg-stone-900' }
  const status = document.status as DocumentStatus
  const isReady = status === 'ready'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
    >
      <Card
        className={cn(
          'group relative flex cursor-pointer flex-col gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 transition-all duration-150',
          'hover:scale-[1.01] hover:shadow-sm',
          isSelected && 'ring-2 ring-purple-500 dark:ring-purple-400',
        )}
        role="button"
        tabIndex={0}
        onClick={selectMode ? () => onToggleSelect(document.id) : () => onOpen(document)}
        onKeyDown={(e) => { if (e.key === 'Enter') { selectMode ? onToggleSelect(document.id) : onOpen(document) } }}
      >
        {/* Top row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {selectMode && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSelect(document.id) }}
                className="text-stone-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                aria-label={isSelected ? 'Deselect' : 'Select'}
              >
                {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" /> : <Square className="h-5 w-5" />}
              </button>
            )}
            <div className={cn('rounded-lg p-2', colors.bg, colors.darkBg)}>
              <Icon className={cn('h-5 w-5', colors.icon)} />
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(document.id) }}
              className={cn(
                'rounded-md p-1 transition-all duration-150',
                isFavorite
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 hover:text-amber-400',
              )}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-400')} />
            </button>
            {!selectMode && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="rounded-md p-1 text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-600 dark:hover:text-stone-300 transition-all duration-150"
                  aria-label="Document options"
                >
                  <MoreVertical className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onOpen(document)}>Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRename(document)}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onMove(document)}>Move</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => onDelete(document.id)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Name */}
        <p className="line-clamp-2 text-sm font-medium text-stone-800 dark:text-stone-200 leading-snug">
          {document.name}
        </p>

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between pt-2">
          <Badge variant="secondary" className="text-[11px] font-normal text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border-0">
            {courseName}
          </Badge>
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            {formatFileDate(document.updatedAt)}
          </span>
        </div>

        {/* Status + quick actions */}
        <div className="flex items-center justify-between">
          <StatusBadge status={status} />
          {isReady && <QuickActions document={document} onQuickAction={onQuickAction} />}
        </div>

        {/* Study quick-action buttons */}
        <div className={cn(
          'flex items-center gap-1.5 pt-1 border-t border-stone-100 dark:border-stone-800',
          isReady
            ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150'
            : 'opacity-50 pointer-events-none',
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'flashcards') }}
            disabled={!isReady}
            className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-950/40 dark:hover:text-purple-300 transition-colors disabled:cursor-not-allowed"
          >
            Flashcards
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'exam') }}
            disabled={!isReady}
            className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950/40 dark:hover:text-amber-300 transition-colors disabled:cursor-not-allowed"
          >
            Quiz
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAction(document, 'chat') }}
            disabled={!isReady}
            className="rounded-md bg-stone-100 dark:bg-stone-800 px-2 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300 hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300 transition-colors disabled:cursor-not-allowed"
          >
            Ask AI
          </button>
        </div>
      </Card>
    </motion.div>
  )
}

export function DocumentListItem({
  document,
  courseName,
  onDelete,
  onOpen,
  onRename,
  onMove,
  onQuickAction,
  isFavorite,
  onToggleFavorite,
  selectMode,
  isSelected,
  onToggleSelect,
}: DocumentCardProps) {
  const docType = document.type as DocumentType
  const Icon = typeIconMap[docType] ?? FileText
  const colors = typeColorMap[docType] ?? { icon: 'text-stone-600', bg: 'bg-stone-50', darkBg: 'dark:bg-stone-900' }
  const status = document.status as DocumentStatus
  const isReady = status === 'ready'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -4 }}
      transition={{ duration: 0.12 }}
    >
      <Card
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-4 py-3 transition-all duration-150',
          'hover:shadow-sm',
          isSelected && 'ring-2 ring-purple-500 dark:ring-purple-400',
        )}
        role="button"
        tabIndex={0}
        onClick={selectMode ? () => onToggleSelect(document.id) : () => onOpen(document)}
      >
        {selectMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSelect(document.id) }}
            className="shrink-0 text-stone-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            aria-label={isSelected ? 'Deselect' : 'Select'}
          >
            {isSelected ? <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" /> : <Square className="h-5 w-5" />}
          </button>
        )}

        <div className={cn('shrink-0 rounded-lg p-2', colors.bg, colors.darkBg)}>
          <Icon className={cn('h-4 w-4', colors.icon)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-stone-800 dark:text-stone-200">{document.name}</p>
          <p className="text-xs text-stone-400 dark:text-stone-500">{courseName}</p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(document.id) }}
          className={cn(
            'shrink-0 rounded-md p-1 transition-all duration-150',
            isFavorite ? 'text-amber-400' : 'text-stone-300 dark:text-stone-600 opacity-0 group-hover:opacity-100 hover:text-amber-400',
          )}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-400')} />
        </button>

        {isReady && <QuickActions document={document} onQuickAction={onQuickAction} />}

        <StatusBadge status={status} />

        <span className="hidden shrink-0 text-[11px] text-stone-400 dark:text-stone-500 sm:block">
          {formatFileDate(document.updatedAt)}
        </span>

        {!selectMode && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="shrink-0 rounded-md p-1 text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-150"
              aria-label="Document options"
            >
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(document)}>Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRename(document)}>Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onMove(document)}>Move</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600 dark:text-red-400" onClick={() => onDelete(document.id)}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </Card>
    </motion.div>
  )
}
