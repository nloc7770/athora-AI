"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { useAuthStore } from "@/stores/auth-store"
import { useToastStore } from "@/stores/toast-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export const errorMessage = (e: unknown) =>
  e instanceof Error ? e.message : "Something went wrong"

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordDialog({ open, onOpenChange }: DialogProps) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = (value: boolean) => {
    if (!value) {
      setCurrent("")
      setNext("")
      setConfirm("")
      setError(null)
    }
    onOpenChange(value)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (next.length < 6) return setError("New password must be at least 6 characters")
    if (next !== confirm) return setError("Passwords do not match")
    if (next === current) return setError("New password must differ from the current one")

    setBusy(true)
    setError(null)
    try {
      await apiClient.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      })
      useToastStore.getState().addToast("Password updated", "success")
      close(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>Enter your current password to set a new one.</DialogDescription>
          </DialogHeader>
          <PasswordField id="pw-current" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordField id="pw-new" label="New password" value={next} onChange={setNext} autoComplete="new-password" />
          <PasswordField id="pw-confirm" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !current || !next || !confirm}>
              {busy ? "Updating..." : "Update password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const CONFIRM_WORD = "DELETE"

export function DeleteAccountDialog({ open, onOpenChange }: DialogProps) {
  const router = useRouter()
  const [typed, setTyped] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const close = (value: boolean) => {
    if (busy) return
    if (!value) {
      setTyped("")
      setError(null)
    }
    onOpenChange(value)
  }

  const handleDelete = async () => {
    setBusy(true)
    setError(null)
    try {
      await apiClient.delete("/users/me")
      // Server already cleared cookies; /auth/logout would 401 on a deleted user
      useAuthStore.setState({ user: null, isAuthenticated: false })
      useToastStore.getState().addToast("Your account has been deleted", "info")
      router.replace("/")
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently deletes your profile, documents, flashcards, exams and study history.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label htmlFor="delete-confirm" className="text-sm text-stone-700 dark:text-stone-300">
            Type <span className="font-mono font-semibold">{CONFIRM_WORD}</span> to confirm
          </label>
          <Input
            id="delete-confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            className="h-9"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={busy || typed !== CONFIRM_WORD}
          >
            {busy ? "Deleting..." : "Delete account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete: string
}

function PasswordField({ id, label, value, onChange, autoComplete }: PasswordFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      <Input
        id={id}
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="h-9"
      />
    </div>
  )
}
