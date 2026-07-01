"use client"

import { type ReactElement, useCallback, useEffect, useMemo, useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuthStore } from "@/stores/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Bell,
  BellOff,
  LogOut,
  Trash2,
  Camera,
  Lock,
} from "lucide-react"

type Theme = "light" | "dark" | "system"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <SettingsContent />
      </AppLayout>
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user, logout } = useAuthStore()

  const [name, setName] = useState(user?.name ?? "")
  const [dailyGoal, setDailyGoal] = useState(30)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [theme, setTheme] = useState<Theme>("system")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("athora-theme") as Theme | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("athora-theme", theme)
    const root = document.documentElement

    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
      root.classList.toggle("dark", prefersDark)
    }
  }, [theme])

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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800">
          <Settings className="h-5 w-5 text-stone-600 dark:text-stone-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-stone-900 dark:text-stone-100">
            Settings
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Manage your account and preferences
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="mb-5 text-sm font-medium text-stone-900 dark:text-stone-100">
            Profile
          </h2>
          <div className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#6C47FF] to-violet-500 text-lg font-medium text-white">
                  {avatarInitial}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-stone-600 transition-colors duration-150 hover:bg-stone-200 dark:border-stone-900 dark:bg-stone-700 dark:text-stone-300 dark:hover:bg-stone-600"
                  aria-label="Change avatar"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-900 dark:text-stone-100">
                  Profile photo
                </p>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  JPG, PNG or GIF. 1MB max.
                </p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="settings-name"
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
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
                className="text-sm font-medium text-stone-700 dark:text-stone-300"
              >
                Email
              </label>
              <Input
                id="settings-email"
                value={user?.email ?? ""}
                disabled
                className="h-9"
              />
              <p className="text-xs text-stone-400 dark:text-stone-500">
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
          </div>
        </section>

        {/* Appearance Section */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="mb-5 text-sm font-medium text-stone-900 dark:text-stone-100">
            Appearance
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              Choose your preferred theme
            </p>
            <div className="inline-flex rounded-lg border border-stone-200 p-0.5 dark:border-stone-700">
              <ThemeButton
                active={theme === "light"}
                onClick={() => setTheme("light")}
                icon={<Sun className="h-4 w-4" />}
                label="Light"
              />
              <ThemeButton
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                icon={<Moon className="h-4 w-4" />}
                label="Dark"
              />
              <ThemeButton
                active={theme === "system"}
                onClick={() => setTheme("system")}
                icon={<Monitor className="h-4 w-4" />}
                label="System"
              />
            </div>
          </div>
        </section>

        {/* Study Preferences Section */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="mb-5 text-sm font-medium text-stone-900 dark:text-stone-100">
            Study Preferences
          </h2>
          <div className="space-y-6">
            {/* Daily goal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-stone-700 dark:text-stone-300">
                  Daily study goal
                </label>
                <span className="text-sm font-medium text-[#6C47FF]">
                  {dailyGoal} min
                </span>
              </div>
              <Slider
                value={[dailyGoal]}
                onValueChange={(val) => {
                  const v = Array.isArray(val) ? val[0] : val
                  setDailyGoal(v)
                }}
                min={5}
                max={120}
                step={5}
              />
              <div className="flex justify-between text-xs text-stone-400 dark:text-stone-500">
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
                icon={
                  notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )
                }
              />
              <ToggleRow
                label="Daily reminder"
                description="Remind me to study at my scheduled time"
                enabled={reminderEnabled}
                onToggle={() => setReminderEnabled(!reminderEnabled)}
                icon={<Bell className="h-4 w-4" />}
              />
            </div>
          </div>
        </section>

        {/* Account Section */}
        <section className="rounded-xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="mb-5 text-sm font-medium text-stone-900 dark:text-stone-100">
            Account
          </h2>
          <div className="space-y-3">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-stone-700 transition-colors duration-150 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <Lock className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              Change password
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-stone-700 transition-colors duration-150 hover:bg-stone-50 dark:text-stone-300 dark:hover:bg-stone-800"
            >
              <LogOut className="h-4 w-4 text-stone-400 dark:text-stone-500" />
              Sign out
            </button>

            <div className="border-t border-stone-200 pt-3 dark:border-stone-800">
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors duration-150 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 className="h-4 w-4" />
                Delete account
              </button>
              <p className="mt-1 px-3 text-xs text-stone-400 dark:text-stone-500">
                Permanently delete your account and all associated data.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

interface ThemeButtonProps {
  active: boolean
  onClick: () => void
  icon: ReactElement
  label: string
}

function ThemeButton({ active, onClick, icon, label }: ThemeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        active
          ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
          : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      }`}
    >
      {icon}
      {label}
    </button>
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
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            {label}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {description}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={onToggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ${
          enabled
            ? "bg-[#6C47FF]"
            : "bg-stone-300 dark:bg-stone-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  )
}
