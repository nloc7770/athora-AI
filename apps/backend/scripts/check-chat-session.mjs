/**
 * Show a chat session's binding, to confirm the brain's ASK column created it
 * against the picked document rather than as an empty tutor chat.
 *
 * Usage: node scripts/check-chat-session.mjs [email] [limit]
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const EMAIL = process.argv[2] ?? 'mit.student@athora.app'
const LIMIT = Number(process.argv[3] ?? 5)

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

const { data, error } = await sb
  .from('chat_sessions')
  .select('id, type, document_id, study_session_id, created_at')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(LIMIT)

if (error) {
  console.error('ERR', error.message)
  process.exit(1)
}
for (const s of data ?? []) {
  console.log(
    `${s.created_at.slice(11, 19)}  type=${s.type.padEnd(14)} doc=${String(s.document_id ?? '-').slice(0, 8)}  study=${String(s.study_session_id ?? '-').slice(0, 8)}  id=${s.id.slice(0, 8)}`,
  )
}
