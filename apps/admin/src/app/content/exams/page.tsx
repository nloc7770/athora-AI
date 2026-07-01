'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

export default function ExamsPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setIsLoading(true)
    apiClient.get<any>(`/admin/content/exams?page=${page}&limit=20`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page])

  const columns = [
    { key: 'name', header: 'Exam', render: (d: any) => <span className="text-sm font-medium">{d.name}</span> },
    { key: 'questions', header: 'Questions', render: (d: any) => <span className="text-sm">{d.question_count}</span> },
    { key: 'attempts', header: 'Attempts', render: (d: any) => <Badge variant="secondary">{d.exam_attempts?.[0]?.count ?? 0}</Badge> },
    { key: 'user', header: 'Owner', render: (d: any) => <span className="text-xs text-zinc-500">{d.profiles?.email ?? '—'}</span> },
    { key: 'created_at', header: 'Created', render: (d: any) => <span className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Exams</h1>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No exams" />
      </div>
    </AdminLayout>
  )
}
