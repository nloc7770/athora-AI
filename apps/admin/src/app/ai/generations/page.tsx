'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

export default function GenerationsPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (typeFilter) params.set('type', typeFilter)
    if (statusFilter) params.set('status', statusFilter)
    apiClient.get<any>(`/admin/ai/generations?${params}`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page, typeFilter, statusFilter])

  const columns = [
    { key: 'type', header: 'Type', render: (d: any) => <Badge>{d.type}</Badge> },
    { key: 'status', header: 'Status', render: (d: any) => <Badge variant={d.status === 'completed' ? 'success' : d.status === 'error' ? 'destructive' : 'warning'}>{d.status}</Badge> },
    { key: 'user', header: 'User', render: (d: any) => <span className="text-xs text-zinc-500">{d.profiles?.email ?? '—'}</span> },
    { key: 'tokens', header: 'Tokens', render: (d: any) => <span className="text-xs">{d.tokens_used ?? '—'}</span> },
    { key: 'created_at', header: 'Created', render: (d: any) => <span className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">AI Generations</h1>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-3">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-zinc-200 px-3 text-sm">
            <option value="">All types</option>
            <option value="summary">Summary</option>
            <option value="flashcards">Flashcards</option>
            <option value="exam">Exam</option>
            <option value="mindmap">Mindmap</option>
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="h-9 rounded-lg border border-zinc-200 px-3 text-sm">
            <option value="">All status</option>
            <option value="completed">Completed</option>
            <option value="error">Error</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
          </select>
        </div>
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No generations" />
      </div>
    </AdminLayout>
  )
}
