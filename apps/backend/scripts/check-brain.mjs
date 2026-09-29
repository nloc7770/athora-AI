/**
 * Read GET /brain/graph as a real user and report the node census.
 *
 * Mints a session via the admin magic-link + verifyOtp pair rather than a
 * password, so verifying the graph never requires knowing (or changing) a
 * demo account's credentials.
 *
 * Usage: node scripts/check-brain.mjs [email]
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
const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type: 'magiclink', email: EMAIL })
if (lErr) throw new Error(`generateLink: ${lErr.message}`)

const anon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
const { data: sess, error: vErr } = await anon.auth.verifyOtp({
  type: 'magiclink',
  token_hash: link.properties.hashed_token,
})
if (vErr) throw new Error(`verifyOtp: ${vErr.message}`)

const res = await fetch(`${API}/brain/graph`, {
  headers: { Authorization: `Bearer ${sess.session.access_token}` },
})
console.log(`GET /brain/graph -> ${res.status}`)
if (!res.ok) {
  console.log(await res.text())
  process.exit(1)
}

const g = await res.json()
const census = {}
for (const n of g.nodes) census[n.kind] = (census[n.kind] ?? 0) + 1
console.log(`nodes ${g.nodes.length}  links ${g.links.length}  ${JSON.stringify(census)}`)

const ids = new Set(g.nodes.map((n) => n.id))
const orphans = g.links.filter((l) => !ids.has(l.source) || !ids.has(l.target))
console.log(`orphan links: ${orphans.length}`)

// The bug this guards: a mindmap's root node restates its session's name, so
// it used to render as a duplicate concept beside the session node.
const sessionLabels = new Set(g.nodes.filter((n) => n.kind === 'session').map((n) => n.label))
const dupes = g.nodes.filter((n) => n.kind === 'concept' && sessionLabels.has(n.label))
console.log(`concepts duplicating a session label: ${dupes.length}`)
if (dupes.length) console.log(`  e.g. ${dupes.slice(0, 5).map((n) => n.label).join(' | ')}`)

const label = (kind, n) => g.nodes.filter((x) => x.kind === kind).slice(0, n).map((x) => x.label)
console.log(`sessions: ${label('session', 4).join(' | ')}`)
console.log(`docs    : ${label('document', 3).join(' | ')}`)
console.log(`concepts: ${label('concept', 6).join(' | ')}`)
