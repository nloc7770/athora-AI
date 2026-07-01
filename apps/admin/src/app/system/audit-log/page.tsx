'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

export default function AuditLogPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setIsLoading(true)
    apiClient.get<any>(`/admin/audit-log?page=${page}&limit=30`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page])

  const columns = [
    { key: 'action', header: 'Action', render: (d: any) => <Badge>{d.action}</Badge> },
    { key: 'resource', header: 'Resource', render: (d: any) => <span className="text-xs">{d.resource_type} {d.resource_id ? `(${d.resource_id.slice(0, 8)}...)` : ''}</span> },
    { key: 'admin', header: 'Admin', render: (d: any) => <span className="text-xs text-zinc-500">{d.profiles?.email ?? d.admin_id?.slice(0, 8)}</span> },
    { key: 'created_at', header: 'When', render: (d: any) => <span className="text-xs text-zinc-500">{new Date(d.created_at).toLocaleString()}</span> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Audit Log</h1>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No audit entries" />
      </div>
    </AdminLayout>
  )
}
