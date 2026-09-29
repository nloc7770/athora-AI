/**
 * Give seed-brain's documents a REAL RAGFlow dataset.
 *
 * seed-brain inserts `documents` rows marked 'ready' whose file_url is a
 * Wikipedia section anchor — nothing was ever uploaded, so ragflow_dataset_id
 * is null and every chat over them retrieves 0 chunks. This fetches the actual
 * section text each row points at, uploads it to RAGFlow as markdown, parses
 * it, and writes the dataset/document ids back — the same columns the real
 * upload pipeline (document-processor.service.ts) fills.
 *
 * Usage:
 *   node scripts/index-seeded-docs.mjs <studySessionId>   # one session
 *   node scripts/index-seeded-docs.mjs --all [email]      # every unindexed session
 *
 * Idempotent: documents that already have a dataset are skipped.
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

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })
const RF = env.RAGFLOW_API_URL
const RF_AUTH = { Authorization: `Bearer ${env.RAGFLOW_API_KEY}` }
const WIKI = 'https://en.wikipedia.org/w/api.php'
const UA = 'athora-seed/1.0 (local dev)'

async function rf(method, url, body) {
  const isForm = body instanceof FormData
  const res = await fetch(`${RF}${url}`, {
    method,
    headers: isForm ? RF_AUTH : { ...RF_AUTH, 'Content-Type': 'application/json' },
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json()
  if (json.code !== 0) throw new Error(`RAGFlow ${method} ${url}: ${json.message}`)
  return json.data
}

async function wiki(params) {
  const url = `${WIKI}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  // Wikipedia 429s a burst of parse calls; back off and retry instead of failing the doc.
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) {
      await new Promise((r) => setTimeout(r, 300))
      return res.json()
    }
    if ((res.status !== 429 && res.status < 500) || attempt >= 6) throw new Error(`wiki ${res.status}`)
    const wait = Number(res.headers.get('retry-after')) * 1000 || 2000 * 2 ** attempt
    await new Promise((r) => setTimeout(r, wait))
  }
}

/** HTML of a parsed section -> readable markdown-ish text. */
function htmlToText(html) {
  return html
    .replace(/<(style|script|table|figure)[\s\S]*?<\/\1>/gi, '')
    .replace(/<sup[^>]*class="[^"]*reference[^"]*"[\s\S]*?<\/sup>/gi, '')
    .replace(/<span class="mw-editsection">[\s\S]*?<\/span><\/span>/gi, '')
    .replace(/<h(\d)[^>]*>([\s\S]*?)<\/h\1>/gi, (_, n, t) => `\n\n${'#'.repeat(Math.min(Number(n), 4))} ${t}\n`)
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/p>|<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&#91;|&#93;/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

const sectionCache = new Map()
/** Real text of the section a seeded file_url anchors to. */
async function sectionText(fileUrl) {
  const u = new URL(fileUrl)
  const page = decodeURIComponent(u.pathname.replace('/wiki/', ''))
  const anchor = decodeURIComponent(u.hash.slice(1))
  if (!sectionCache.has(page)) {
    sectionCache.set(page, (await wiki({ action: 'parse', page, prop: 'sections' })).parse.sections)
  }
  const sec = sectionCache
    .get(page)
    .find((s) => s.anchor === anchor || s.line.replace(/<[^>]+>/g, '') === anchor.replace(/_/g, ' '))
  if (!sec) throw new Error(`no section "${anchor}" in ${page}`)
  const parsed = await wiki({ action: 'parse', page, section: sec.index, prop: 'text', disablelimitreport: '1' })
  return htmlToText(parsed.parse.text)
}

async function indexSession(studySessionId) {
  const { data: docs, error } = await sb
    .from('documents')
    .select('id, user_id, name, file_url, ragflow_dataset_id')
    .eq('session_id', studySessionId)
  if (error) throw error
  const todo = docs.filter((d) => !d.ragflow_dataset_id && d.file_url?.includes('wikipedia.org/wiki/'))
  if (todo.length === 0) return console.log(`= ${studySessionId}: nothing to index`)

  // Reuse the session's dataset if one exists, else create it with the name
  // getOrCreateDataset() would have used.
  const { data: ss } = await sb.from('study_sessions').select('ragflow_dataset_id').eq('id', studySessionId).single()
  let datasetId = ss?.ragflow_dataset_id
  if (!datasetId) {
    const name = `session_${studySessionId}`
    const existing = await rf('GET', `/api/v1/datasets?name=${encodeURIComponent(name)}`).catch(() => [])
    datasetId =
      existing?.[0]?.id ??
      (await rf('POST', '/api/v1/datasets', { name, description: `Dataset for user ${todo[0].user_id}` })).id
    await sb.from('study_sessions').update({ ragflow_dataset_id: datasetId }).eq('id', studySessionId)
  }

  const uploaded = []
  for (const doc of todo) {
    try {
      const text = await sectionText(doc.file_url)
      if (text.length < 100) throw new Error(`section text too short (${text.length} chars)`)
      const title = doc.name.replace(/\.[^.]+$/, '')
      const form = new FormData()
      form.append(
        'file',
        new Blob([`# ${title}\n\n${text}\n`], { type: 'text/markdown' }),
        `${title.replace(/[^\w.-]+/g, '_')}.md`,
      )
      const [rdoc] = await rf('POST', `/api/v1/datasets/${datasetId}/documents`, form)
      await sb.from('documents').update({ ragflow_dataset_id: datasetId, ragflow_document_id: rdoc.id }).eq('id', doc.id)
      uploaded.push(rdoc.id)
      console.log(`  + ${doc.name} (${text.length} chars)`)
    } catch (e) {
      console.log(`  ! ${doc.name}: ${e.message}`)
    }
  }
  if (uploaded.length === 0) return

  await rf('POST', `/api/v1/datasets/${datasetId}/chunks`, { document_ids: uploaded })
  // Same terminal states pollForCompletion() recognises.
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const data = await rf('GET', `/api/v1/datasets/${datasetId}/documents?page_size=100`)
    const mine = (data.docs ?? data).filter((d) => uploaded.includes(d.id))
    if (mine.every((d) => ['DONE', 'FAIL', 'CANCEL'].includes(d.run))) {
      const chunks = mine.reduce((n, d) => n + (d.chunk_count ?? 0), 0)
      const failed = mine.filter((d) => d.run !== 'DONE').map((d) => d.name)
      console.log(
        `= ${studySessionId}: dataset ${datasetId}, ${mine.length - failed.length} parsed, ${chunks} chunks` +
          (failed.length ? `, FAILED: ${failed.join(', ')}` : ''),
      )
      return
    }
  }
  console.log(`= ${studySessionId}: parse still running after 10 min — check RAGFlow`)
}

const arg = process.argv[2]
if (!arg) throw new Error('usage: index-seeded-docs.mjs <studySessionId> | --all [email]')

if (arg === '--all') {
  const email = process.argv[3] ?? 'mit.student@athora.app'
  const { data: list } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = list.users.find((u) => u.email === email)
  if (!user) throw new Error(`no user ${email}`)
  // Keyed on DOCUMENTS still missing a dataset, not sessions: a session whose
  // dataset was created but whose docs failed must be picked up on a rerun.
  const { data: pending } = await sb
    .from('documents')
    .select('session_id')
    .eq('user_id', user.id)
    .is('ragflow_dataset_id', null)
    .like('file_url', '%wikipedia.org/wiki/%')
  const sessionIds = [...new Set((pending ?? []).map((d) => d.session_id).filter(Boolean))]
  console.log(`${sessionIds.length} sessions with unindexed docs`)
  // ponytail: one session at a time to keep RAGFlow's parse queue sane; parallelise if too slow.
  for (const id of sessionIds) await indexSession(id)
} else {
  await indexSession(arg)
}
