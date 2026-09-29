"use client"

import { type ReactElement, useCallback, useMemo, useState } from "react"
import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PageContainer, PageHeader } from "@/components/page"
import {
  Settings,
  Bell,
  BellOff,
  Loader2,
  LogOut,
  Trash2,
  Camera,
  Lock,
} from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <BrainShell>
        <SettingsContent />
      </BrainShell>
    </ProtectedRoute>
  )
}

/**
 * READING MEASURE. PageContainer is full-bleed, but a settings form is a stack
 * of single-column fields — stretched to 1400px the label/control pairing falls
 * apart and the save button ends up a screen away from the field it saves. So
 * the shell and the header are full-bleed and only the form column is capped at
 * `max-w-2xl`. It is LEFT-aligned rather than centred so the first card's edge
 * lines up with the H1 above it; a centred column under a full-bleed header
 * reads as a mis-alignment, not as a decision.
 */
const FORM_MEASURE = "flex w-full max-w-2xl flex-col gap-5 sm:gap-6"

function SettingsContent() {
  const { user, logout } = useAuthStore()

  const [name, setName] = useState(user?.name ?? "")
  const [dailyGoal, setDailyGoal] = useState(30)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // No Appearance control here: the app is dark-only. BrainShell — the shell
  // this page renders inside — forces `dark` on documentElement for the whole
  // session, so a Light option could only fight it (removing the class until
  // the next mount). `athora-theme` is left untouched in localStorage; nothing
  // reads it now, so there is no migration to do.

  const hasChanges = useMemo(() => {
    return name !== (user?.name ?? "")
  }, [name, user?.name])

  const handleSaveProfile = useCallback(async () => {
    setIsSaving(true)
    try {
      // TODO: integrate with API to update user profile
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handleSignOut = useCallback(async () => {
    await logout()
  }, [logout])

  const avatarInitial = user?.email?.charAt(0).toUpperCase() ?? "U"

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and preferences"
        icon={<Settings />}
      />

      {!user ? (
        // There was no loading state at all: the fields rendered blank while the
        // auth store hydrated, and nothing was announced.
        <div role="status" className="flex items-center justify-center py-20">
          <Loader2 aria-hidden className="size-6 animate-spin text-primary" />
          <span className="sr-only">Loading your settings…</span>
        </div>
      ) : (
        <div className={FORM_MEASURE}>
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="size-14">
                    <AvatarFallback className="bg-[var(--br-accent-wash)] text-lg font-medium text-primary">
                      {avatarInitial}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="outline"
                    size="icon-xs"
                    className="absolute -bottom-0.5 -right-0.5 rounded-full"
                    aria-label="Change avatar"
                  >
                    <Camera />
                  </Button>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--br-text)]">
                    Profile photo
                  </p>
                  <p className="text-xs text-[var(--br-text3)]">
                    JPG, PNG or GIF. 1MB max.
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="settings-name"
                  className="text-sm font-medium text-[var(--br-text2)]"
                >
                  Display name
                </label>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="h-9"
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="settings-email"
                  className="text-sm font-medium text-[var(--br-text2)]"
                >
                  Email
                </label>
                <Input
                  id="settings-email"
                  value={user?.email ?? ""}
                  disabled
                  className="h-9"
                />
                <p className="text-xs text-[var(--br-text3)]">
                  Contact support to change your email address.
                </p>
              </div>

              {/* Save */}
              <div className="flex justify-end pt-1">
                <Button
                  disabled={!hasChanges || isSaving}
                  onClick={handleSaveProfile}
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Study Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Study Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Daily goal */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--br-text2)]">
                    Daily study goal
                  </label>
                  <span className="text-sm font-medium text-primary tabular-nums">
                    {dailyGoal} min
                  </span>
                </div>
                <Slider
                  id="settings-daily-goal"
                  value={[dailyGoal]}
                  onValueChange={(val) => {
                    const v = Array.isArray(val) ? val[0] : val
                    setDailyGoal(v)
                  }}
                  min={5}
                  max={120}
                  step={5}
                />
                <div className="flex justify-between text-xs text-[var(--br-text3)]">
                  <span>5 min</span>
                  <span>120 min</span>
                </div>
              </div>

              {/* Notifications */}
              <div className="space-y-3">
                <ToggleRow
                  label="Push notifications"
                  description="Get notified about study reminders and progress"
                  enabled={notificationsEnabled}
                  onToggle={() => setNotificationsEnabled(!notificationsEnabled)}
                  icon={notificationsEnabled ? <Bell /> : <BellOff />}
                />
                <ToggleRow
                  label="Daily reminder"
                  description="Remind me to study at my scheduled time"
                  enabled={reminderEnabled}
                  onToggle={() => setReminderEnabled(!reminderEnabled)}
                  icon={<Bell />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                size="lg"
                className="w-full justify-start font-normal"
              >
                <Lock />
                Change password
              </Button>

              <Button
                variant="ghost"
                size="lg"
                onClick={handleSignOut}
                className="w-full justify-start font-normal"
              >
                <LogOut />
                Sign out
              </Button>

              <div className="border-t border-[var(--br-border)] pt-3">
                <Button
                  variant="destructive"
                  size="lg"
                  className="w-full justify-start font-normal"
                >
                  <Trash2 />
                  Delete account
                </Button>
                <p className="mt-1.5 px-2.5 text-xs text-[var(--br-text3)]">
                  Permanently delete your account and all associated data.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  )
}

interface ToggleRowProps {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  icon: ReactElement
}

function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
  icon,
}: ToggleRowProps) {
  const labelId = `toggle-${label.replace(/\s+/g, "-").toLowerCase()}`

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex size-8 items-center justify-center rounded-lg border border-[var(--br-accent-line)] bg-[var(--br-accent-wash)] text-primary [&_svg]:size-4"
        >
          {icon}
        </div>
        <div>
          <p id={labelId} className="text-sm font-medium text-[var(--br-text2)]">
            {label}
          </p>
          <p className="text-xs text-[var(--br-text3)]">{description}</p>
        </div>
      </div>
      {/* Still hand-rolled: there is no ui/switch in this codebase and adding one
          is outside this refactor's scope. Semantics are unchanged
          (role="switch" + aria-checked); only the accent moved to --primary and
          it now labels itself and shows a focus ring. */}
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby={labelId}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
          enabled ? "bg-primary" : "bg-[var(--br-bg3)]"
        }`}
      >
        <span
          aria-hidden
          className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
