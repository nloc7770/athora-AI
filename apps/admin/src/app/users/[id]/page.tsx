'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Ban, CreditCard, FileText, Layers, Brain, GraduationCap } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

interface UserDetail {
  id: string
  name: string | null
  email: string
  role: string
  banned_at: string | null
  ban_reason: string | null
  created_at: string
  stats: {
    documents: number
    sessions: number
    flashcardSets: number
    exams: number
  }
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const [user, setUser] = useState<UserDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showBanModal, setShowBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')

  useEffect(() => {
    apiClient.get<UserDetail>(`/admin/users/${userId}`)
      .then(setUser)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [userId])

  async function handleBan(reason: string) {
    if (!reason) return
    try {
      await apiClient.post(`/admin/users/${userId}/ban`, { reason })
      setUser((prev) => prev ? { ...prev, banned_at: new Date().toISOString(), ban_reason: reason } : prev)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to ban user'
      alert(message)
    }
  }

  async function handleUnban() {
    try {
      await apiClient.post(`/admin/users/${userId}/unban`)
      setUser((prev) => prev ? { ...prev, banned_at: null, ban_reason: null } : prev)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unban user'
      alert(message)
    }
  }

  async function handleRoleChange(role: string) {
    await apiClient.patch(`/admin/users/${userId}`, { role })
    setUser((prev) => prev ? { ...prev, role } : prev)
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      </AdminLayout>
    )
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-zinc-500">User not found</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/users')}>
            Back to Users
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => router.push('/users')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
        </Button>

        {/* Profile Card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-lg font-bold text-zinc-600">
                {(user.name ?? user.email)?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">{user.name ?? 'No name'}</h2>
                <p className="text-sm text-zinc-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={user.role === 'super_admin' ? 'warning' : user.role === 'admin' ? 'success' : 'default'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.banned_at ? 'destructive' : 'success'}>
                    {user.banned_at ? 'Banned' : 'Active'}
                  </Badge>
                </div>
                {user.ban_reason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {user.ban_reason}</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              {user.banned_at ? (
                <Button variant="outline" size="sm" onClick={handleUnban}>
                  Unban
                </Button>
              ) : (
                <Button variant="destructive" size="sm" onClick={() => setShowBanModal(true)}>
                  <Ban className="h-3.5 w-3.5 mr-1" /> Ban
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-400 mt-4">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard title="Documents" value={user.stats.documents} icon={FileText} />
          <StatCard title="Sessions" value={user.stats.sessions} icon={Layers} />
          <StatCard title="Flashcard Sets" value={user.stats.flashcardSets} icon={Brain} />
          <StatCard title="Exams" value={user.stats.exams} icon={GraduationCap} />
        </div>

        {showBanModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-zinc-900">Ban User</h3>
              <p className="mt-1 text-sm text-zinc-500">Provide a reason for banning this user.</p>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                placeholder="Reason for ban..."
                className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                rows={3}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowBanModal(false)} className="rounded-md px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100">Cancel</button>
                <button onClick={() => { handleBan(banReason); setShowBanModal(false); setBanReason(''); }} className="rounded-md bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700">Ban User</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
