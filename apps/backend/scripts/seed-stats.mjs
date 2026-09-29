/**
 * Row counts for one user, so a seed run can be checked without opening the app.
 *
 * Usage: node scripts/seed-stats.mjs [email]
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const EMAIL = process.argv[2] ?? 'mit.student@athora.app'

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

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
const user = list.users.find((u) => u.email === EMAIL)
if (!user) throw new Error(`no user ${EMAIL}`)

const count = async (table, build = (q) => q) => {
  const { count, error } = await build(sb.from(table).select('*', { count: 'exact', head: true }).eq('user_id', user.id))
  return error ? `ERR ${error.message}` : count
}

console.log(`user: ${EMAIL}`)
console.log('  courses          ', await count('courses'))
console.log('  study_sessions   ', await count('study_sessions'))
console.log('  documents        ', await count('documents'))
console.log('  ai_generations   ', await count('ai_generations'))
console.log('  flashcard_sets   ', await count('flashcard_sets'))
console.log('  exams            ', await count('exams'))
console.log('  study_activities ', await count('study_activities'))

// Children have no user_id of their own; count them through the parent.
const { data: sets } = await sb.from('flashcard_sets').select('id').eq('user_id', user.id)
const setIds = (sets ?? []).map((s) => s.id)
if (setIds.length) {
  const { count } = await sb.from('flashcards').select('*', { count: 'exact', head: true }).in('set_id', setIds)
  console.log('  flashcards       ', count)
}

const { data: exams } = await sb.from('exams').select('id').eq('user_id', user.id)
const examIds = (exams ?? []).map((x) => x.id)
if (examIds.length) {
  const { count } = await sb.from('exam_questions').select('*', { count: 'exact', head: true }).in('exam_id', examIds)
  console.log('  exam_questions   ', count)
  const { count: attempts } = await sb
    .from('exam_attempts')
    .select('*', { count: 'exact', head: true })
    .in('exam_id', examIds)
  console.log('  exam_attempts    ', attempts)
}
