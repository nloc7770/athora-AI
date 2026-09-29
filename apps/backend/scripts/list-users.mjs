/**
 * List auth users with their content counts, richest first.
 *
 * Exists to answer "which demo account actually has data" before a screenshot
 * run: an empty account photographs as an empty state, which is worse than no
 * screenshot at all. Read-only — it never writes.
 *
 * Usage: node scripts/list-users.mjs
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const env = Object.fromEntries(
  fs
    .readFileSync(path.join(import.meta.dirname, '..', '.env'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => /^\s*[A-Z_0-9]+=/.test(l))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
})

const { data: list, error } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
if (error) throw new Error(`listUsers: ${error.message}`)

// One grouped count per table beats N queries per user.
async function countBy(table) {
  const { data, error: e } = await sb.from(table).select('user_id')
  if (e) return { __error: e.message }
  const m = {}
  for (const r of data ?? []) m[r.user_id] = (m[r.user_id] ?? 0) + 1
  return m
}

const [docs, sessions, courses, gens, sets] = await Promise.all([
  countBy('documents'),
  countBy('study_sessions'),
  countBy('courses'),
  countBy('ai_generations'),
  countBy('flashcard_sets'),
])

const rows = list.users.map((u) => ({
  email: u.email,
  name: u.user_metadata?.name ?? u.user_metadata?.full_name ?? '',
  docs: docs[u.id] ?? 0,
  sessions: sessions[u.id] ?? 0,
  courses: courses[u.id] ?? 0,
  gens: gens[u.id] ?? 0,
  sets: sets[u.id] ?? 0,
}))

rows.forEach((r) => {
  r.total = r.docs + r.sessions + r.courses + r.gens + r.sets
})
rows.sort((a, b) => b.total - a.total)

console.log(`${list.users.length} users\n`)
console.log('total docs sess crs gens sets  email (name)')
for (const r of rows) {
  console.log(
    `${String(r.total).padStart(5)} ${String(r.docs).padStart(4)} ${String(r.sessions).padStart(4)} ` +
      `${String(r.courses).padStart(3)} ${String(r.gens).padStart(4)} ${String(r.sets).padStart(4)}  ` +
      `${r.email}${r.name ? ` (${r.name})` : ''}`,
  )
}
for (const [label, m] of [['documents', docs], ['study_sessions', sessions], ['courses', courses], ['ai_generations', gens], ['flashcard_sets', sets]]) {
  if (m.__error) console.log(`\n! ${label}: ${m.__error}`)
}
