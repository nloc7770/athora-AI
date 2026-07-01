'use client'

import { useState, useEffect } from 'react'
import { FileText, Search } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

export default function DocumentsPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '20' })
    if (search) params.set('search', search)
    apiClient.get<any>(`/admin/content/documents?${params}`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page, search])

  const columns = [
    { key: 'name', header: 'Name', render: (d: any) => <span className="text-sm font-medium truncate max-w-[200px] block">{d.name}</span> },
    { key: 'type', header: 'Type', render: (d: any) => <Badge>{d.type}</Badge> },
    { key: 'status', header: 'Status', render: (d: any) => <Badge variant={d.status === 'ready' ? 'success' : d.status === 'error' ? 'destructive' : 'warning'}>{d.status}</Badge> },
    { key: 'user', header: 'Owner', render: (d: any) => <span className="text-xs text-zinc-500">{d.profiles?.email ?? '—'}</span> },
    { key: 'created_at', header: 'Created', render: (d: any) => <span className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleDateString()}</span> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Documents</h1>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No documents" />
      </div>
    </AdminLayout>
  )
}
