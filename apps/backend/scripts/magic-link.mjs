/**
 * Print a one-time login URL for any user, using the service key.
 *
 * Exists so verification scripts (screenshots, Playwright probes) can log in
 * as a demo account without anyone having to know or reset its password. The
 * link is single-use and short-lived.
 *
 * Usage: node scripts/magic-link.mjs [email] [redirectTo]
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const EMAIL = process.argv[2] ?? 'mit.student@athora.app'
const REDIRECT = process.argv[3] ?? 'http://localhost:3000/dashboard'

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
const { data, error } = await admin.auth.admin.generateLink({
  type: 'magiclink',
  email: EMAIL,
  options: { redirectTo: REDIRECT },
})
if (error) {
  console.error(`generateLink failed: ${error.message}`)
  process.exit(1)
}
console.log(data.properties.action_link)
