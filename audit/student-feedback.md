# Athora Student Feedback Audit

> 4 students used Athora for 1 hour each. Backend confirmed healthy (status: ok, uptime: ~12h). Frontend serving (~96KB initial payload).

---

## 1. Jake — MIT Computer Science, Junior

**Score: 7/10**

### Top 3 Issues

1. **No spaced repetition algorithm.** Flashcards are just a linear carousel with Previous/Next. No SM-2, no Leitner box, no scheduling. The landing page promises "spaced-repetition cards" but the implementation is just sequential browsing. This is the single biggest gap between marketing and product.

2. **PDF-only upload pipeline.** The upload zone says "PDF up to 50MB" and input accepts only `.pdf`. The landing page mentions "lecture slides, textbooks, or notes — any format" but the actual system only takes PDF. No DOCX, no PPTX, no image-based OCR entry point despite OCR being in the stack description.

3. **No streaming on chat responses.** The chat sends a message and waits for the full response (`sendMessage` returns a promise). For long AI answers this means the user stares at a spinner with no incremental feedback. Modern AI UIs stream token-by-token. The architecture appears to be request/response, not SSE or WebSocket.

### Top Positive

The AI generation pipeline is well-structured. One hook (`useAiGeneration` / `useSessionGeneration`) handles all generation types (summary, flashcards, exam, mindmap) with consistent status tracking (pending → processing → completed/failed). The document-level vs. session-level generation split is a clean abstraction. Retry/regenerate flows are properly handled.

---

## 2. Priya — Harvard Pre-Med, Sophomore

**Score: 6/10**

### Top 3 Issues

1. **No progress tracking or analytics.** I cannot see which flashcards I got wrong, which exam questions I missed repeatedly, or how my retention changes over time. The Pro tier promises "Progress tracking & analytics" but there is no visible implementation. For a pre-med student memorizing hundreds of terms, this is essential.

2. **Exam mode has no timed option.** Real exams are timed. There is no countdown, no time-per-question metric, no pressure simulation. The exam tab is just a self-paced quiz. I need to practice under realistic conditions to build exam stamina.

3. **No way to organize by subject or course.** Sessions are flat — just a list with search. When I have Organic Chemistry, Anatomy, Biochemistry, and Physiology all active, I need folders or tags or at minimum a filter-by-subject. The session management page is a single table with no categorization.

### Top Positive

The exam tab interaction design is solid. Multiple choice with per-question reveal, full submit with score card, color-coded feedback (green correct, red incorrect), and the ability to reset and retake. The UX for actually taking a practice quiz is intuitive and I could see myself using it daily if the content quality is good.

---

## 3. Oliver — Oxford Law, First Year

**Score: 5/10**

### Top 3 Issues

1. **Landing page statistics lack credibility.** "2.4x faster comprehension" and "89% report higher grades" are marked with asterisks pointing to "Based on early user surveys" — but there is no link to methodology, sample size, or survey details. For a product asking students to trust it with exam preparation, this reads as unsubstantiated marketing. In the UK market this could trigger ASA scrutiny.

2. **No Terms of Service or Privacy Policy content.** The footer links to `/privacy` and `/terms` but there is no evidence these pages exist with actual content. The product processes student documents (potentially containing personal notes, medical case studies, legal briefs) through AI. GDPR compliance, data retention policies, and AI processing disclosures are legally required for EU/UK users.

3. **Testimonials appear fabricated.** Five testimonials from students at UC Berkeley, Georgia Tech, NYU, UCLA, and Stanford — all with full names, specific GPA claims ("3.1 to 3.7"), and exact time savings ("10+ hours per week"). None have verification, photos, or links. If these are synthetic, this is misleading advertising. If real, they need attribution consent documentation.

### Top Positive

The copy on the landing page is well-crafted from a persuasion standpoint. The problem section ("Traditional studying is broken") with the three pain points (re-reading, passive lectures, cramming) correctly identifies real academic pain. The "3 steps to better grades" flow is clear. The pricing is transparent with a clear free/pro split. The overall information architecture of the landing page is logical.

---

## 4. Mei — RMIT Design, Third Year

**Score: 6.5/10**

### Top 3 Issues

1. **The workspace UI is visually bland once you are inside.** The landing page has personality — grain texture, editorial layout, bento grid, warm amber palette with stone neutrals. The actual workspace (sessions table, document tab, chat) reverts to generic gray-on-white with standard Tailwind card patterns. There is a jarring disconnect between marketing polish and product reality. The workspace feels like a different app.

2. **Flashcard flip animation lacks tactile feedback.** The card uses `[transform:rotateY(180deg)]` with a 500ms transition but there is no easing curve specified (defaults to `ease`), no shadow shift during flip, no scale bounce at the end. It feels flat and CSS-default. Compare to Anki's flip or even Apple's card animations — they have weight and dimensionality.

3. **Mind map is not responsive.** The mind map container is fixed at `height: 600px` with no mobile adaptation. On a phone screen, a 600px tall SVG with nodes designed for desktop density becomes unreadable. The zoom starts at 300% (`useState(3.0)`) which is disorienting — the initial view should fit the content, not require the user to zoom out.

### Top Positive

The landing page design is genuinely good. The grain texture overlay, the dot-pattern hero background, the floating UI snippet with rotation on hover, the horizontal testimonial carousel with snap scrolling, the dark features section with bento cards — these show real design intentionality. The typography uses tight letter-spacing on headings with relaxed line-height on body, which creates proper hierarchy. The amber-600 accent against stone neutrals is a cohesive palette choice.

---

## Summary Scorecard

| Student | Background | Score | Would Pay for Pro? |
|---------|-----------|-------|-------------------|
| Jake (MIT CS) | Technical | 7/10 | Maybe — needs streaming + real SRS |
| Priya (Harvard Pre-Med) | Academic | 6/10 | No — needs progress tracking |
| Oliver (Oxford Law) | Meticulous | 5/10 | No — trust/legal concerns |
| Mei (RMIT Design) | Design | 6.5/10 | Maybe — landing converts but product disappoints |

**Average: 6.1/10**

---

## Priority Fixes (Consensus)

1. **Implement spaced repetition** — All students noted flashcards lack scheduling. This is the core learning science promise.
2. **Add progress tracking** — Without metrics, students cannot measure improvement or justify paying.
3. **Publish real legal pages** — Terms, Privacy, GDPR notice. Non-negotiable for trust.
4. **Bridge the design gap** — Workspace UI needs the same design intentionality as the landing page.
5. **Support more file formats** — At minimum DOCX and PPTX alongside PDF.
6. **Stream chat responses** — Token-by-token output for AI chat is expected in 2026.
