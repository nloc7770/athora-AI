/**
 * Prove the tutor's answers carry citations end to end: create a chat session
 * against a document that really has a RAGFlow dataset, ask a question, then
 * read the stored message back and report its `sources`.
 *
 * The seeded documents have no dataset, so retrieval returns nothing for them —
 * this deliberately picks a document with a real `ragflow_dataset_id`.
 *
 * Usage: node scripts/check-citations.mjs [email]
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const EMAIL = process.argv[2] ?? 'mit.student@athora.app'
const API = process.env.API_URL ?? 'http://localhost:3001'

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

const admin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
const user = list.users.find((u) => u.email === EMAIL)
if (!user) throw new Error(`no user ${EMAIL}`)

// A document with a real dataset — retrieval has something to find.
const { data: docs } = await admin
  .from('documents')
  .select('id, name, ragflow_dataset_id')
  .eq('user_id', user.id)
  .not('ragflow_dataset_id', 'is', null)
  .limit(1)
const doc = docs?.[0]
if (!doc) throw new Error('no document with a ragflow_dataset_id — nothing to retrieve from')
console.log(`document: ${doc.name} (dataset ${doc.ragflow_dataset_id})`)

const { data: link } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data: sess } = await anon.auth.verifyOtp({
  type: 'magiclink',
  token_hash: link.properties.hashed_token,
})
const token = sess.session.access_token
const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
  'X-Requested-With': 'XMLHttpRequest',
}

const created = await fetch(`${API}/chat/sessions`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ type: 'document_chat', documentId: doc.id }),
})
if (!created.ok) throw new Error(`create session -> ${created.status} ${await created.text()}`)
const chat = await created.json()
console.log(`chat session: ${chat.id}`)

// Non-streaming: the stream carries text only, so the citation payload is what
// the stored message holds.
const asked = await fetch(`${API}/chat/sessions/${chat.id}/messages`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ content: 'What is this document about? Cite the material.' }),
})
console.log(`ask -> ${asked.status}`)
if (!asked.ok) {
  console.log(await asked.text())
  process.exit(1)
}

const history = await fetch(`${API}/chat/sessions/${chat.id}/messages`, { headers })
const messages = await history.json()
for (const m of messages) {
  const n = m.sources?.length ?? 0
  console.log(`  ${m.role.padEnd(9)} sources=${n} ${m.content.slice(0, 70).replace(/\s+/g, ' ')}…`)
  if (n > 0) {
    const s = m.sources[0]
    console.log(`    chunkId=${String(s.chunkId).slice(0, 12)} score=${s.score} content="${String(s.content).slice(0, 80).replace(/\s+/g, ' ')}…"`)
  }
}

const assistant = messages.find((m) => m.role === 'assistant')
console.log(
  (assistant?.sources?.length ?? 0) > 0
    ? `PASS: assistant answer carries ${assistant.sources.length} citations`
    : 'FAIL: assistant answer has no citations',
)
