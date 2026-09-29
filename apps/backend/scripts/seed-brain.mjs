/**
 * Seed a dense knowledge brain from real Wikipedia article structure.
 *
 * Why Wikipedia and not lorem ipsum: the brain graph is a hierarchy
 * (session -> document -> concept) and it only looks right when the labels
 * are real. A Wikipedia article's own table of contents already IS that
 * hierarchy: L1 sections are chapters (-> documents), L2 subsections are
 * concepts (-> concept nodes). One API call per subject gives both levels.
 *
 * Fills the whole study app, not just the graph: documents, mindmaps,
 * summaries, AI-generated exams, chat transcripts, flashcard sets, practice
 * exams and study activity history.
 *
 * The session workspace's Summary, Exam and Chat tabs read their own tables,
 * not the flashcard/document ones — which is why they stayed empty until this
 * script wrote them. Each result shape below was read off its consumer, and
 * the comment on each says which file and line it came from.
 *
 * Idempotent: every row it writes is tagged SEED_TAG, and a re-run deletes
 * the previous tagged rows first. Untagged rows (real user data) are never
 * touched.
 *
 * Usage: node scripts/seed-brain.mjs [email]
 */
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const SEED_TAG = '[athora-seed]'
const TARGET_EMAIL = process.argv[2] ?? 'mit.student@athora.app'
const UA = 'AthoraSeed/1.0 (educational seed; admin@athora.app)'
const WIKI = 'https://en.wikipedia.org/w/api.php'

/** Wikipedia asks for serial requests; 6 in flight is polite and still quick. */
const FETCH_CONCURRENCY = 6

// A real degree's worth of subjects. Each entry is one Wikipedia article whose
// section tree becomes one study session.
const SUBJECTS = [
  // Computer Science
  { course: 'Computer Science', code: 'CS101', page: 'Machine_learning', session: 'Machine Learning Fundamentals' },
  { course: 'Computer Science', code: 'CS201', page: 'Data_structure', session: 'Data Structures' },
  { course: 'Computer Science', code: 'CS220', page: 'Algorithm', session: 'Algorithms and Complexity' },
  { course: 'Computer Science', code: 'CS310', page: 'Operating_system', session: 'Operating Systems' },
  { course: 'Computer Science', code: 'CS340', page: 'Computer_network', session: 'Computer Networks' },
  { course: 'Computer Science', code: 'CS360', page: 'Database', session: 'Database Systems' },
  { course: 'Computer Science', code: 'CS400', page: 'Computer_security', session: 'Computer Security' },
  { course: 'Computer Science', code: 'CS410', page: 'Artificial_intelligence', session: 'Artificial Intelligence' },
  { course: 'Computer Science', code: 'CS430', page: 'Compiler', session: 'Compiler Design' },
  { course: 'Computer Science', code: 'CS450', page: 'Computer_graphics', session: 'Computer Graphics' },
  // Mathematics
  { course: 'Mathematics', code: 'MATH121', page: 'Linear_algebra', session: 'Linear Algebra' },
  { course: 'Mathematics', code: 'MATH131', page: 'Calculus', session: 'Calculus I' },
  { course: 'Mathematics', code: 'MATH220', page: 'Statistics', session: 'Probability and Statistics' },
  { course: 'Mathematics', code: 'MATH241', page: 'Probability_theory', session: 'Probability Theory' },
  { course: 'Mathematics', code: 'MATH260', page: 'Graph_theory', session: 'Discrete Mathematics' },
  { course: 'Mathematics', code: 'MATH310', page: 'Number_theory', session: 'Number Theory' },
  { course: 'Mathematics', code: 'MATH350', page: 'Differential_equations', session: 'Differential Equations' },
  { course: 'Mathematics', code: 'MATH410', page: 'Topology', session: 'Topology' },
  // Physics
  { course: 'Physics', code: 'PHYS101', page: 'Classical_mechanics', session: 'Classical Mechanics' },
  { course: 'Physics', code: 'PHYS210', page: 'Thermodynamics', session: 'Thermodynamics' },
  { course: 'Physics', code: 'PHYS230', page: 'Electromagnetism', session: 'Electromagnetism' },
  { course: 'Physics', code: 'PHYS240', page: 'Optics', session: 'Optics' },
  { course: 'Physics', code: 'PHYS320', page: 'Quantum_mechanics', session: 'Quantum Mechanics' },
  { course: 'Physics', code: 'PHYS410', page: 'Special_relativity', session: 'Special Relativity' },
  { course: 'Physics', code: 'PHYS430', page: 'Particle_physics', session: 'Particle Physics' },
  // Chemistry
  { course: 'Chemistry', code: 'CHEM101', page: 'Organic_chemistry', session: 'Organic Chemistry' },
  { course: 'Chemistry', code: 'CHEM210', page: 'Chemical_bond', session: 'Chemical Bonding' },
  { course: 'Chemistry', code: 'CHEM220', page: 'Inorganic_chemistry', session: 'Inorganic Chemistry' },
  { course: 'Chemistry', code: 'CHEM330', page: 'Biochemistry', session: 'Biochemistry' },
  // Biology
  { course: 'Biology', code: 'BIO110', page: 'Cell_biology', session: 'Cell Biology' },
  { course: 'Biology', code: 'BIO150', page: 'Evolution', session: 'Evolutionary Biology' },
  { course: 'Biology', code: 'BIO220', page: 'Genetics', session: 'Genetics' },
  { course: 'Biology', code: 'BIO240', page: 'Neuroscience', session: 'Neuroscience' },
  { course: 'Biology', code: 'BIO260', page: 'Ecology', session: 'Ecology' },
  { course: 'Biology', code: 'BIO310', page: 'Molecular_biology', session: 'Molecular Biology' },
  // Economics
  { course: 'Economics', code: 'ECON101', page: 'Microeconomics', session: 'Microeconomics' },
  { course: 'Economics', code: 'ECON201', page: 'Macroeconomics', session: 'Macroeconomics' },
  { course: 'Economics', code: 'ECON310', page: 'Econometrics', session: 'Econometrics' },
  { course: 'Economics', code: 'ECON330', page: 'Finance', session: 'Corporate Finance' },
  // Psychology
  { course: 'Psychology', code: 'PSY101', page: 'Cognitive_psychology', session: 'Cognitive Psychology' },
  { course: 'Psychology', code: 'PSY210', page: 'Social_psychology', session: 'Social Psychology' },
  { course: 'Psychology', code: 'PSY220', page: 'Developmental_psychology', session: 'Developmental Psychology' },
  // Humanities
  { course: 'Humanities', code: 'PHIL101', page: 'Philosophy', session: 'Introduction to Philosophy' },
  { course: 'Humanities', code: 'PHIL210', page: 'Logic', session: 'Formal Logic' },
  { course: 'Humanities', code: 'LING101', page: 'Linguistics', session: 'Linguistics' },
  // Engineering
  { course: 'Engineering', code: 'ENG210', page: 'Materials_science', session: 'Materials Science' },
  { course: 'Engineering', code: 'ENG310', page: 'Control_theory', session: 'Control Theory' },
  { course: 'Engineering', code: 'ENG320', page: 'Signal_processing', session: 'Signal Processing' },
  // Medicine
  { course: 'Medicine', code: 'MED101', page: 'Anatomy', session: 'Human Anatomy' },
  { course: 'Medicine', code: 'MED110', page: 'Physiology', session: 'Physiology' },
  { course: 'Medicine', code: 'MED220', page: 'Pharmacology', session: 'Pharmacology' },
  // Law
  { course: 'Law', code: 'LAW101', page: 'Contract', session: 'Contract Law' },
  { course: 'Law', code: 'LAW120', page: 'Tort', session: 'Tort Law' },
]

/** One hue per course, so the graph separates by discipline at a glance. */
const COURSE_COLORS = {
  'Computer Science': '#ff7a3c',
  Mathematics: '#8b5cf6',
  Physics: '#06b6d4',
  Chemistry: '#f59e0b',
  Biology: '#10b981',
  Economics: '#ec4899',
  Psychology: '#14b8a6',
  Humanities: '#b98cff',
  Engineering: '#4aa8ff',
  Medicine: '#ff7a9c',
  Law: '#f0c853',
}

// documents.type CHECK on the LIVE database allows exactly these four.
// Migration 00011 (which adds 'doc') has not been applied there, so seeding
// 'doc' fails the check constraint — measured, not assumed.
const DOC_TYPES = ['pdf', 'pdf', 'pdf', 'note', 'audio', 'video']

// study_activities.activity_type CHECK on the live database still has the
// migration-00013 list; 00014's extra values are not applied there either.
const ACTIVITY_TYPES = ['flashcard_review', 'exam_attempt', 'chat_message', 'document_upload']

function env() {
  const file = path.join(import.meta.dirname, '..', '.env')
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^\s*[A-Z_0-9]+=/.test(l))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      }),
  )
}

async function wiki(params) {
  const url = `${WIKI}?${new URLSearchParams({ format: 'json', formatversion: '2', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`wiki ${res.status} ${params.page ?? params.titles}`)
  return res.json()
}

/** Article table of contents -> { chapters: [{ title, concepts: [] }], intro }. */
async function fetchOutline(page) {
  const [sec, ext] = await Promise.all([
    wiki({ action: 'parse', page, prop: 'sections' }),
    wiki({ action: 'query', prop: 'extracts', titles: page.replace(/_/g, ' '), explaintext: '1', exintro: '1' }),
  ])

  const SKIP = /^(see also|references|further reading|external links|notes|bibliography|sources|footnotes)$/i
  const chapters = []
  for (const s of sec.parse?.sections ?? []) {
    const line = String(s.line ?? '').replace(/<[^>]+>/g, '').trim()
    if (!line || SKIP.test(line)) continue
    if (s.toclevel === 1) chapters.push({ title: line, concepts: [] })
    else if (s.toclevel <= 3 && chapters.length) chapters.at(-1).concepts.push(line)
  }

  return {
    chapters: chapters.filter((c) => c.title.length <= 90).slice(0, 9),
    intro: ext.query?.pages?.[0]?.extract ?? '',
  }
}

/** Run `worker` over `items`, at most `limit` in flight. */
async function pool(items, limit, worker) {
  const out = new Array(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (let i = cursor++; i < items.length; i = cursor++) {
        out[i] = await worker(items[i], i)
      }
    }),
  )
  return out
}

const rnd = (n) => Math.floor(Math.random() * n)
const pick = (arr) => arr[rnd(arr.length)]
const daysAgo = (d) => new Date(Date.now() - d * 86400_000).toISOString()

/**
 * `n` DISTINCT members of `arr` (or as many as it holds). `pick` three times
 * over a few hundred titles repeats one roughly 1% of the time, and a multiple
 * choice question showing the same option twice is visibly wrong.
 */
function sample(arr, n) {
  const pool = [...arr]
  const out = []
  while (out.length < n && pool.length > 0) out.push(pool.splice(rnd(pool.length), 1)[0])
  return out
}

// A period after one of these is not the end of a sentence. Without the guard
// a real article splits mid-clause: Tort's lead produced a takeaway bullet
// ending "... colonial past (e.g." and the next starting "Québec, ...",
// because the splitter treats the "e.g." period as a full stop. Merging the
// fragment back is safer than dropping it — a run-on sentence that the length
// filter then discards is invisible, a half clause in a bullet is not.
const ABBREVIATION_END =
  /\b(?:e\.g|i\.e|etc|cf|vs|al|approx|resp|vol|fig|eq|ch|sec|pp|dr|prof|mr|mrs|ms|st|inc|ltd|jr|sr)\.$/i

/** Sentences long enough to stand alone as a card back or an answer. */
function sentencesOf(intro, limit) {
  const parts = intro.split(/(?<=[.!?])\s+/).reduce((out, part) => {
    const last = out[out.length - 1]
    if (last !== undefined && ABBREVIATION_END.test(last)) out[out.length - 1] = `${last} ${part}`
    else out.push(part)
    return out
  }, [])

  return parts
    .map((s) => s.trim())
    .filter((s) => s.length > 45 && s.length < 320)
    .slice(0, limit)
}

function examQuestions(sub, outline, allChapterTitles, siblingTitles = []) {
  const questions = []
  const chapters = outline.chapters.map((c) => c.title)

  // Multiple choice: which of these is covered by this subject?
  //
  // Distractors are real chapters of OTHER subjects, so the question is
  // answerable. They are drawn from the subject's OWN COURSE first: a law
  // question whose wrong options are "Standard Model" and "Administration,
  // drug policy and safety" is answerable but reads as a broken generator, and
  // teaches nothing. Sibling subjects in the same discipline give wrong answers
  // that are actually plausible, which is what makes a distractor useful.
  // Global titles only top the pool up when the course is too small.
  const preferred = siblingTitles.filter((t) => !chapters.includes(t))
  const fallback = allChapterTitles.filter((t) => !chapters.includes(t))

  chapters.slice(0, 5).forEach((title, i) => {
    // Enough same-discipline distractors? Use them. Otherwise top up with the
    // global pool so the question always has four options.
    const near = sample(preferred, 3)
    const foreign =
      near.length >= 3
        ? near
        : [...near, ...sample(fallback.filter((t) => !near.includes(t)), 3 - near.length)]
    // sample(), not pick() x3: three independent picks can land on the same
    // foreign chapter and print it as two of the four options.
    const options = [title, ...foreign]
    questions.push({
      question: `Which of these is a topic covered in ${sub.session}?`,
      type: 'multiple_choice',
      options: options.map((o) => ({ text: o, isCorrect: o === title })),
      correct_answer: title,
      explanation: `"${title}" is a section of the ${sub.session} material.`,
      order_index: i,
    })
  })

  // Short answer: the article's own opening sentences ARE the model answers.
  sentencesOf(outline.intro, 4).forEach((sentence, i) => {
    questions.push({
      question: `${sub.session}: summarise the key idea behind "${pick(chapters) || sub.session}".`,
      type: 'short_answer',
      options: null,
      correct_answer: sentence,
      explanation: `Source: en.wikipedia.org/wiki/${sub.page}`,
      order_index: chapters.slice(0, 5).length + i,
    })
  })

  return questions
}

/**
 * ai_generations row of type 'summary' -> result shape.
 *
 * Copied from the consumer, not guessed:
 * apps/web/src/app/sessions/[id]/_components/summary-tab.tsx
 *   :27      generations.filter((g) => g.type === 'summary')
 *   :28      latest = filtered[0]        (newest first — see the note below)
 *   :147-154 result.overview             -> string
 *   :160-193 result.chapters[]           -> { title, keyPoints: string[] }
 *   :198-215 result.takeaways[]          -> string[]
 * and it only falls through to that render on a status that is none of
 * pending/processing/failed (summary-tab.tsx:97-125), so the row is seeded
 * 'completed'. The CHECK on ai_generations.status allows
 * pending/processing/completed/error (00004_ai_pipeline.sql:47) — 'error', not
 * 'failed' — so 'completed' is the only value the tab renders and the database
 * accepts. Same shape as SummaryOutput (dto/generate.dto.ts:26-31).
 *
 * Every line is the article's own: chapter titles and subsection titles out of
 * its table of contents, sentences out of its lead. The sentence pool is split
 * by index so the same sentence never appears twice on one page.
 */
function summaryResult(sub, outline) {
  // Wikipedia's plaintext extract carries doubled spaces around parentheticals
  // ("Ecology (from Ancient Greek  οἶκος ...)"). HTML collapses them anyway;
  // collapsing here keeps the stored text as clean as the rendered text.
  const prose = sentencesOf(outline.intro, 6 + outline.chapters.length).map((s) =>
    s.replace(/\s+/g, ' '),
  )
  const chapters = outline.chapters.map((ch, j) => {
    // Real subsection titles first, then one real sentence. A chapter with no
    // subsections and no sentence left falls back to its own title rather than
    // rendering an empty bullet list.
    const keyPoints = [...ch.concepts.slice(0, 3), prose[2 + j]].filter(Boolean)
    return {
      title: ch.title,
      keyPoints: keyPoints.length > 0 ? keyPoints : [ch.title],
    }
  })
  const rest = prose.slice(2 + outline.chapters.length, 6 + outline.chapters.length)

  return {
    title: sub.session,
    overview:
      prose.slice(0, 2).join(' ') ||
      `${sub.session} covers ${outline.chapters.length} chapters, from "${outline.chapters[0].title}" onwards.`,
    chapters,
    takeaways:
      rest.length > 0 ? rest : outline.chapters.slice(0, 4).map((c) => c.title),
  }
}

/**
 * ai_generations row of type 'exam' -> result.questions shape.
 *
 * Copied from the consumer:
 * apps/web/src/app/sessions/[id]/_components/exam-tab.tsx
 *   :63      generations.filter((g) => g.type === 'exam')
 *   :64      latest = filtered.find((g) => g.status === 'completed')
 *   :73      latest?.result?.questions ?? []
 *   :23-28   ExamQuestion { question: string; options: string[]; correctAnswer?: number; correct_answer?: number }
 *   :111,293 const correctIdx = typeof q.correctAnswer === 'number' ? q.correctAnswer : q.correct_answer
 *   :320     q.options.map((opt, optIdx) => ...)
 * So: the option list is plain STRINGS, and the correct one is addressed by
 * NUMBER index. The persisted exam_questions rows carry `options` as
 * { text, isCorrect } objects and the answer as text (exam.generator.ts:115-123),
 * so this adapts one shape to the other instead of generating the questions a
 * second time — the exam the tab shows is then exactly the exam in the exams
 * table below.
 *
 * The option order is rotated by question index because examQuestions() always
 * emits the correct title first; without the rotation every answer would be
 * option A, which is both unconvincing and unrepresentative.
 *
 * Only multiple_choice survives the filter. A short_answer question has no
 * options to render, and exam-tab.tsx renders no answer text at all — only the
 * option list and a reveal toggle — so a question without options would draw a
 * card with a dead "Reveal answer" link and nothing behind it.
 */
function toExamTabQuestions(questions) {
  const LIKELIHOOD = ['high', 'medium', 'high', 'medium', 'low']
  return questions
    .filter((q) => q.type === 'multiple_choice' && Array.isArray(q.options))
    .map((q, idx) => {
      const shift = idx % q.options.length
      const options = [...q.options.slice(shift), ...q.options.slice(0, shift)].map((o) => o.text)
      const correct = q.options.find((o) => o.isCorrect)?.text ?? q.correct_answer
      return {
        question: q.question,
        type: 'multiple_choice',
        options,
        // Both spellings: the tab resolves the index from `correct_answer`
        // (exam-tab.tsx:111), while ExamOutput (dto/generate.dto.ts:43) declares
        // correctAnswer as the option TEXT. Writing both satisfies each reader.
        correctAnswer: correct,
        correct_answer: options.indexOf(correct),
        explanation: q.explanation,
        predictedLikelihood: LIKELIHOOD[idx % LIKELIHOOD.length],
      }
    })
}

/**
 * Chat transcript for one study session.
 *
 * Table and column names read off the schema and the reader, not guessed:
 * supabase/migrations/00004_ai_pipeline.sql:18-28  chat_sessions
 *   (user_id, document_id, title, type CHECK (document_chat|tutor))
 * supabase/migrations/00004_ai_pipeline.sql:31-39  chat_messages
 *   (session_id, role CHECK (user|assistant), content, sources JSONB,
 *    tokens_used, created_at), messages cascade with their session
 * supabase/migrations/00007_missing_columns.sql:10 chat_sessions.study_session_id
 *   — the column the session page's Chat tab is keyed on:
 * apps/backend/src/chat/chat.service.ts:251-279 getSessions() filters
 *   .eq('study_session_id', ...) and orders updated_at DESC, which is what
 *   useChatSessions({ sessionId }) calls (apps/web/src/hooks/use-chat.ts:62-80)
 *   and what the tab auto-selects (sessions/[id]/page.tsx:104-108)
 * apps/backend/src/chat/chat.service.ts:236-249 getHistory() orders created_at
 *   ASC — so the transcript is inserted oldest-first, one message per step.
 *
 * `sources` is left null on purpose: it is a RAGFlow chunk list
 * (chat.service.ts:519-543) and these documents were never ingested into
 * RAGFlow, so any chunkId in it would be fabricated rather than derived. The
 * Chat tab does not render sources either.
 *
 * Content is the article's real lead and its real section names, shaped as the
 * tutor exchange the transcript is meant to show.
 */
function chatScript(sub, outline) {
  const chapters = outline.chapters
  const prose = sentencesOf(outline.intro, 8)
  const line = (...parts) => parts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()

  const first = chapters[0]
  const second = chapters[1] ?? first
  const third = chapters[2] ?? second

  // Real subsections, each still tagged with the chapter it came from, so the
  // assistant can name a topic without ever answering "X sits under X".
  const topics = chapters.flatMap((ch) =>
    ch.concepts.map((c) => ({ topic: c, chapter: ch.title })),
  )

  const script = [
    {
      role: 'user',
      content: `I'm revising ${sub.session} this week — where should I start?`,
    },
    {
      role: 'assistant',
      content: line(`Start with "${first.title}".`, prose[0]),
    },
  ]

  // Only when the article actually has a subsection to explain. Cell_biology's
  // four sections have none, and an unconditional exchange there would ask the
  // student to explain "History" and then answer `"History" sits under
  // "History"` — which is what this guard exists to prevent.
  if (topics.length > 0) {
    const { topic, chapter } = topics[0]
    script.push(
      { role: 'user', content: `Can you explain "${topic}"? I keep mixing it up.` },
      {
        role: 'assistant',
        content: line(`"${topic}" is one of the topics under "${chapter}".`, prose[1]),
      },
    )
  }

  script.push(
    { role: 'user', content: `Quiz me on "${second.title}".` },
    {
      role: 'assistant',
      content: line(
        second.concepts.length > 0
          ? `What does "${second.title}" break down into? It covers: ${second.concepts.slice(0, 4).join(', ')}.`
          : `Without looking, say what "${second.title}" covers.`,
        prose[2],
      ),
    },
  )

  // Closing exchange. Needs a second chapter to talk about at all, and a third
  // to compare against — a one-chapter article gets a shorter transcript
  // rather than one that names the same chapter twice.
  if (second !== first) {
    const pairing = topics[1]
    script.push(
      {
        role: 'user',
        content:
          third !== second
            ? `How does "${third.title}" fit in with "${second.title}"?`
            : `What should I revise after "${second.title}"?`,
      },
      {
        role: 'assistant',
        content: line(
          third !== second
            ? `"${third.title}" comes later in the material, after "${second.title}".`
            : `Go back over "${second.title}" before moving on.`,
          pairing
            ? `When you can explain "${pairing.topic}" in two sentences without notes, you are ready.`
            : null,
          prose[3],
        ),
      },
    )
  }

  return script
}

async function main() {
  const e = env()
  const sb = createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: list, error: uErr } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 })
  if (uErr) throw new Error(`listUsers: ${uErr.message}`)
  const user = list.users.find((u) => u.email === TARGET_EMAIL)
  if (!user) throw new Error(`no user ${TARGET_EMAIL}`)
  console.log(`seeding -> ${user.email} (${user.id})`)

  // --- wipe previous seed only (tagged rows) -------------------------------
  const { data: old } = await sb
    .from('study_sessions')
    .select('id')
    .eq('user_id', user.id)
    .like('description', `${SEED_TAG}%`)
  const oldIds = (old ?? []).map((r) => r.id)
  if (oldIds.length) {
    // ai_generations + documents cascade/null on session delete, but the docs
    // themselves are ours to remove — delete children first, explicitly.
    await sb.from('ai_generations').delete().in('session_id', oldIds)
    await sb.from('documents').delete().in('session_id', oldIds)
    await sb.from('study_sessions').delete().in('id', oldIds)
    console.log(`cleared ${oldIds.length} previously seeded sessions`)
  }
  // chat_sessions is NOT cascaded by the study_session delete — its FK is
  // ON DELETE SET NULL (00007_missing_columns.sql:10) — so a seeded chat would
  // outlive its session as an orphan. It is tagged in `title` and removed
  // explicitly; chat_messages cascade with it (00004_ai_pipeline.sql:33).
  const { data: oldChats } = await sb
    .from('chat_sessions')
    .select('id')
    .eq('user_id', user.id)
    .like('title', `${SEED_TAG}%`)
  if (oldChats?.length) {
    await sb.from('chat_sessions').delete().in('id', oldChats.map((c) => c.id))
    console.log(`cleared ${oldChats.length} previously seeded chat sessions`)
  }
  // exams carries no session_id, so it is tagged by name instead. Its
  // questions and attempts cascade.
  const { data: oldExams } = await sb
    .from('exams')
    .select('id')
    .eq('user_id', user.id)
    .like('name', `${SEED_TAG}%`)
  if (oldExams?.length) {
    await sb.from('exams').delete().in('id', oldExams.map((x) => x.id))
    console.log(`cleared ${oldExams.length} previously seeded exams`)
  }
  // study_activities survives a session delete (session_id is SET NULL), so it
  // is removed by its own tag.
  await sb.from('study_activities').delete().eq('user_id', user.id).contains('metadata', { seed: true })
  await sb.from('courses').delete().eq('user_id', user.id).like('description', `${SEED_TAG}%`)

  // --- fetch all outlines (real content) ----------------------------------
  console.log(`fetching ${SUBJECTS.length} Wikipedia outlines...`)
  const outlines = await pool(SUBJECTS, FETCH_CONCURRENCY, (s) =>
    fetchOutline(s.page).catch((err) => {
      console.log(`  ! ${s.page}: ${err.message}`)
      return null
    }),
  )

  // Deduped: "History", "Overview" and "Applications" are L1 sections of a
  // dozen different articles, so the raw list holds the same title many times
  // over and a distractor drawn from it can repeat the correct option.
  const allChapterTitles = [
    ...new Set(outlines.flatMap((o) => (o?.chapters ?? []).map((c) => c.title))),
  ]

  // Same titles, bucketed by course. Exam distractors are drawn from here
  // first, so a question about Tort Law offers other LAW chapters rather than
  // whatever "Standard Model" came from — plausible wrong answers are the whole
  // point of a distractor, and a cross-discipline option reads as a bug.
  const titlesByCourse = new Map()
  SUBJECTS.forEach((s, i) => {
    const o = outlines[i]
    if (!o) return
    const set = titlesByCourse.get(s.course) ?? new Set()
    for (const c of o.chapters) set.add(c.title)
    titlesByCourse.set(s.course, set)
  })

  // --- courses ------------------------------------------------------------
  const courseRows = [...new Set(SUBJECTS.map((s) => s.course))].map((name) => ({
    user_id: user.id,
    name,
    code: name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 4),
    color: COURSE_COLORS[name] ?? '#8b93ff',
    description: `${SEED_TAG} ${name} coursework`,
  }))
  const { data: courses, error: cErr } = await sb.from('courses').insert(courseRows).select('id, name')
  if (cErr) throw new Error(`courses: ${cErr.message}`)
  const courseId = Object.fromEntries(courses.map((c) => [c.name, c.id]))

  let nDocs = 0
  let nConcepts = 0
  let nSessions = 0
  let nExams = 0
  let nCards = 0
  let nActivities = 0
  let nSummaries = 0
  let nGenExams = 0
  let nChats = 0
  let nMessages = 0

  for (let i = 0; i < SUBJECTS.length; i++) {
    const sub = SUBJECTS[i]
    const out = outlines[i]
    if (!out || out.chapters.length === 0) continue

    // Spread the term across the past ~4 months, newest work first.
    const created = daysAgo(120 - i * 2)

    const { data: session, error: sErr } = await sb
      .from('study_sessions')
      .insert({
        user_id: user.id,
        name: sub.session,
        description: `${SEED_TAG} ${sub.course} · ${out.chapters.length} chapters · source: en.wikipedia.org/wiki/${sub.page}`,
        status: 'active',
        created_at: created,
        updated_at: created,
      })
      .select('id')
      .single()
    if (sErr) {
      console.log(`  ! session ${sub.session}: ${sErr.message}`)
      continue
    }
    nSessions++

    // Chapters -> documents. Real chapter titles from the article's TOC.
    const docRows = out.chapters.map((ch, j) => {
      const type = DOC_TYPES[(i + j) % DOC_TYPES.length]
      const ext = type === 'audio' ? 'm4a' : type === 'video' ? 'mp4' : type === 'note' ? 'md' : 'pdf'
      return {
        user_id: user.id,
        course_id: courseId[sub.course] ?? null,
        session_id: session.id,
        name: `${sub.code} · ${ch.title}.${ext}`,
        type,
        file_url: `https://en.wikipedia.org/wiki/${sub.page}#${encodeURIComponent(ch.title.replace(/ /g, '_'))}`,
        file_size: 180_000 + rnd(4_200_000),
        pages: type === 'pdf' ? 6 + rnd(38) : null,
        duration: type === 'audio' || type === 'video' ? 240 + rnd(3200) : null,
        // CHECK allows ready/processing/error only (migration 00016 not applied).
        // Leave a couple mid-flight so the HUD's "learning" counter is non-zero.
        status: j === 0 && i % 7 === 3 ? 'processing' : 'ready',
        processing_progress: j === 0 && i % 7 === 3 ? 40 + rnd(50) : 100,
        created_at: daysAgo(118 - i * 2 + j * 0.2),
      }
    })
    const { data: docs, error: dErr } = await sb.from('documents').insert(docRows).select('id, name')
    if (dErr) {
      console.log(`  ! docs ${sub.session}: ${dErr.message}`)
      continue
    }
    nDocs += docs.length

    // Mindmap. Flat node list with parentId — the shape buildFlowData()
    // expects when no edges are given, and the shape BrainService reads.
    const nodes = [{ id: 'root', label: sub.session }]
    out.chapters.forEach((ch, j) => {
      const cid = `c${j}`
      nodes.push({ id: cid, label: ch.title, parentId: 'root' })
      for (const [k, concept] of ch.concepts.slice(0, 5).entries()) {
        nodes.push({ id: `${cid}-${k}`, label: concept, parentId: cid })
      }
    })
    nConcepts += nodes.length - 1

    const { error: gErr } = await sb.from('ai_generations').insert({
      user_id: user.id,
      session_id: session.id,
      document_id: docs[0]?.id ?? null,
      type: 'mindmap',
      status: 'completed',
      result: { title: sub.session, nodes },
      model_used: 'chathunter7.8',
      tokens_used: 800 + rnd(2600),
      created_at: daysAgo(116 - i * 2),
    })
    if (gErr) console.log(`  ! mindmap ${sub.session}: ${gErr.message}`)

    // --- summary (this row is the entire Summary tab) ---------------------
    // summary-tab.tsx:27-28 filters by type and takes filtered[0], the newest
    // row, so one completed row per session is exactly what it needs.
    const { error: sumErr } = await sb.from('ai_generations').insert({
      user_id: user.id,
      session_id: session.id,
      document_id: docs[0]?.id ?? null,
      type: 'summary',
      status: 'completed',
      result: summaryResult(sub, out),
      model_used: 'chathunter7.8',
      tokens_used: 1400 + rnd(2400),
      created_at: daysAgo(115.5 - i * 2),
    })
    // PRINTED, never swallowed: a CHECK the live schema disagrees with (status
    // or type) has to be visible or the tab just stays empty with no reason.
    if (sumErr) console.log(`  ! summary ${sub.session}: ${sumErr.message}`)
    else nSummaries++

    // --- flashcards: two sets, one from prose, one from the chapter list ---
    const prose = sentencesOf(out.intro, 8)
    const sets = []
    if (prose.length >= 2) {
      sets.push({
        name: `${sub.session} — Key Concepts`,
        cards: prose.map((s, k) => ({
          front: `${out.chapters[k % out.chapters.length].title}: what is the key idea?`,
          back: s,
        })),
      })
    }
    const terms = out.chapters.flatMap((c) => c.concepts).filter((c) => c.length < 70).slice(0, 8)
    if (terms.length >= 2) {
      sets.push({
        name: `${sub.session} — Topic Drill`,
        cards: terms.map((t) => ({
          front: `Define or explain: ${t}`,
          back: `A topic under ${sub.session}. Source: en.wikipedia.org/wiki/${sub.page}`,
        })),
      })
    }

    for (const set of sets) {
      const { data: created_set } = await sb
        .from('flashcard_sets')
        .insert({
          user_id: user.id,
          course_id: courseId[sub.course] ?? null,
          document_id: docs[0]?.id ?? null,
          name: set.name,
          description: `${SEED_TAG} auto-generated from ${sub.page}`,
        })
        .select('id')
        .single()
      if (!created_set) continue
      const { data: cards } = await sb
        .from('flashcards')
        .insert(
          set.cards.map((c, k) => ({
            set_id: created_set.id,
            front: c.front,
            back: c.back,
            difficulty: ['easy', 'medium', 'medium', 'hard'][k % 4],
          })),
        )
        .select('id')
      nCards += cards?.length ?? 0
    }

    // --- practice exam -----------------------------------------------------
    const questions = examQuestions(sub, out, allChapterTitles, [
      ...(titlesByCourse.get(sub.course) ?? []),
    ])
    if (questions.length > 0) {
      const { data: exam } = await sb
        .from('exams')
        .insert({
          user_id: user.id,
          course_id: courseId[sub.course] ?? null,
          name: `${SEED_TAG} ${sub.session} — Practice Exam`,
          question_count: questions.length,
          difficulty: ['easy', 'mixed', 'hard'][i % 3],
          time_limit: 15 + questions.length * 2,
          created_at: daysAgo(114 - i * 2),
        })
        .select('id')
        .single()
      if (exam) {
        await sb.from('exam_questions').insert(questions.map((q) => ({ ...q, exam_id: exam.id })))
        nExams++

        // A third of them already sat: gives the analytics page real history.
        if (i % 3 === 0) {
          await sb.from('exam_attempts').insert({
            exam_id: exam.id,
            user_id: user.id,
            answers: Object.fromEntries(questions.map((q, k) => [k, k % 4 === 0 ? q.correct_answer : ''])),
            score: 40 + rnd(60),
            time_spent: 600 + rnd(2400),
            completed_at: daysAgo(112 - i * 2),
          })
        }
      }

      // The Exam tab reads THIS row, not the exams tables above — it never
      // touches exam_questions (exam-tab.tsx:63-73). Written even when the
      // exams insert failed, so one bad row cannot empty the tab on its own;
      // examId is attached only when there is an exam to point at, matching
      // ExamOutput.examId (dto/generate.dto.ts:47).
      const { error: examGenErr } = await sb.from('ai_generations').insert({
        user_id: user.id,
        session_id: session.id,
        document_id: docs[0]?.id ?? null,
        type: 'exam',
        status: 'completed',
        result: {
          questions: toExamTabQuestions(questions),
          ...(exam ? { examId: exam.id } : {}),
        },
        model_used: 'chathunter7.8',
        tokens_used: 900 + rnd(2100),
        created_at: daysAgo(113.5 - i * 2),
      })
      if (examGenErr) console.log(`  ! exam generation ${sub.session}: ${examGenErr.message}`)
      else nGenExams++
    }

    // --- chat transcript ---------------------------------------------------
    const script = chatScript(sub, out)
    // One timestamp per message, 3 minutes apart, oldest first — the reader
    // orders by created_at ASC (chat.service.ts:236-241).
    const chatBase = new Date(daysAgo(114 - i * 2)).getTime()
    const { data: chat, error: chatErr } = await sb
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        document_id: docs[0]?.id ?? null,
        // This is the column the session page's Chat tab queries on.
        study_session_id: session.id,
        // CHECK allows document_chat | tutor (00004_ai_pipeline.sql:25).
        type: 'document_chat',
        title: `${SEED_TAG} ${sub.session} — Document Chat`,
        created_at: new Date(chatBase).toISOString(),
        updated_at: new Date(chatBase + script.length * 180_000).toISOString(),
      })
      .select('id')
      .single()
    if (chatErr) {
      console.log(`  ! chat ${sub.session}: ${chatErr.message}`)
    } else {
      const { error: msgErr } = await sb.from('chat_messages').insert(
        script.map((m, k) => ({
          session_id: chat.id,
          role: m.role,
          content: m.content,
          sources: null,
          tokens_used: m.role === 'assistant' ? 120 + rnd(240) : null,
          created_at: new Date(chatBase + k * 180_000).toISOString(),
        })),
      )
      if (msgErr) console.log(`  ! chat messages ${sub.session}: ${msgErr.message}`)
      else {
        nChats++
        nMessages += script.length
      }
    }

    // --- study activity history -------------------------------------------
    const activities = Array.from({ length: 8 }, (_, k) => ({
      user_id: user.id,
      activity_type: ACTIVITY_TYPES[(i + k) % ACTIVITY_TYPES.length],
      session_id: session.id,
      duration_seconds: 120 + rnd(3000),
      metadata: { seed: true, session: sub.session },
      created_at: daysAgo(118 - i * 2 + k * 1.5),
    }))
    const { error: aErr } = await sb.from('study_activities').insert(activities)
    if (!aErr) nActivities += activities.length

    console.log(
      `  ${sub.session}: ${docs.length} docs, ${nodes.length - 1} concepts, ${sets.length} sets, ` +
        `${questions.length} questions, ${script.length} chat messages`,
    )
  }

  console.log(
    `\ndone: ${nSessions} sessions, ${nDocs} documents, ${nConcepts} concepts, ` +
      `${nSummaries} summaries, ${nGenExams} exam generations, ${nChats} chat sessions ` +
      `(${nMessages} messages), ${nExams} exams, ${nCards} flashcards, ${nActivities} activities`,
  )
  console.log(`brain caps: ${JSON.stringify(BRAIN_CAPS_HINT)}`)
}

// Mirrors BRAIN_CAPS in src/brain/brain.service.ts — printed so a seed that
// outgrows the read ceiling is obvious rather than silently truncated.
const BRAIN_CAPS_HINT = { sessions: 120, documents: 700, concepts: 800 }

main().catch((err) => {
  console.error('SEED FAILED:', err.message)
  process.exit(1)
})
