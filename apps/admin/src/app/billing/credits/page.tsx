'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

export default function CreditsPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const [showAdjustModal, setShowAdjustModal] = useState(false)
  const [adjustUserId, setAdjustUserId] = useState<string | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  useEffect(() => {
    setIsLoading(true)
    apiClient.get<any>(`/admin/credits?page=${page}&limit=20`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page])

  function openAdjustModal(userId: string) {
    setAdjustUserId(userId)
    setAdjustAmount('')
    setAdjustReason('')
    setShowAdjustModal(true)
  }

  function closeAdjustModal() {
    setShowAdjustModal(false)
    setAdjustUserId(null)
    setAdjustAmount('')
    setAdjustReason('')
  }

  async function handleAdjustSubmit() {
    if (!adjustUserId) return

    const parsed = parseInt(adjustAmount, 10)
    if (isNaN(parsed)) {
      setError('Amount must be a valid number')
      return
    }
    if (!adjustReason.trim()) {
      setError('Reason is required')
      return
    }

    try {
      await apiClient.post(`/admin/credits/${adjustUserId}/adjust`, {
        amount: parsed,
        reason: adjustReason.trim(),
        type: 'admin_adj',
      })
      closeAdjustModal()
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      const res = await apiClient.get<any>(`/admin/credits?${params}`)
      setData(res.data)
      setError(null)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to adjust credits'
      setError(message)
    }
  }

  const columns = [
    { key: 'user', header: 'User', render: (d: any) => <span className="text-sm">{d.profiles?.name ?? d.profiles?.email ?? '—'}</span> },
    { key: 'balance', header: 'Balance', render: (d: any) => <span className="text-sm font-bold text-zinc-900">{d.balance}</span> },
    { key: 'earned', header: 'Lifetime Earned', render: (d: any) => <span className="text-xs text-emerald-600">+{d.lifetime_earned}</span> },
    { key: 'spent', header: 'Lifetime Spent', render: (d: any) => <span className="text-xs text-red-600">-{d.lifetime_spent}</span> },
    { key: 'actions', header: '', render: (d: any) => <Button size="sm" variant="outline" onClick={() => openAdjustModal(d.user_id)}>Adjust</Button> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Credit Accounts</h1>
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No credit accounts" />
      </div>

      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-zinc-900">Adjust Credits</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Positive value adds credits, negative value deducts.
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="adjust-amount" className="block text-sm font-medium text-zinc-700">
                  Amount
                </label>
                <input
                  id="adjust-amount"
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="e.g. 50 or -10"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label htmlFor="adjust-reason" className="block text-sm font-medium text-zinc-700">
                  Reason
                </label>
                <input
                  id="adjust-reason"
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Why this adjustment?"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={closeAdjustModal}>
                Cancel
              </Button>
              <Button onClick={handleAdjustSubmit}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
