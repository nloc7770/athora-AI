# `@/components/page` — page-level primitives

Shared layout primitives for athora's authenticated pages (`/sessions`,
`/library`, `/flashcards`, `/exam`, `/tutor`, `/analytics`, `/settings`).

Every one of those pages currently hand-rolls its own layout. An audit found 7
different `<h1>` treatments, 5 different list shapes, 7 different empty states,
5 different max-widths and 4 different accent colours for the same primary
action. These primitives are the single source of truth for all of that.

```tsx
import {
  PageContainer,
  PageHeader,
  PageToolbar,
  SearchField,
  FilterChip,
  SegmentedControl,
  ListItem,
  ListCard,
  ListSkeleton,
  EmptyState,
} from '@/components/page'
```

## Rules for the refactor

1. **Full-bleed. Never add a `max-w-*` clamp.** `PageContainer` owns the gutters.
   The rail already reserves its own width; the content owns the rest. The one
   exception is inside `PageToolbar`, which caps its own search column.
2. **Accent is orange** — `--primary` / `--br-accent` is `#ff7a3c`. Delete every
   `#6C47FF`, `purple-600`, `violet-600`, `bg-purple-*` and `hover:border-purple-*`
   you find. `<Button>` with no `variant` is already orange; stop passing
   `className="bg-[#6C47FF] hover:bg-[#5a38e0] text-white"`.
3. **Use the `--br-*` tokens, not `stone-*`.** These pages render inside
   `.athora-brain`, which is dark-only. `bg-white dark:bg-stone-900` pairs are
   dead weight — the primitives use `var(--br-bg2)` / `var(--br-text)` etc.
4. **Exactly one `PageHeader` per page**, as the first child of `PageContainer`.
5. **Don't wrap primitives in spacing divs.** `PageContainer` is a flex column
   with a single `gap`; adding `mb-8` back defeats the point.
6. `ui/card` is not needed for list rows any more. `ListItem` / `ListCard`
   replace `<Card className="border border-stone-200 bg-white …">`.

## Primitives

| Primitive | Props | Replaces |
| --- | --- | --- |
| `PageContainer` | `children`, `className?` | `mx-auto max-w-4xl px-4 py-8 sm:px-6` + per-child `mb-*` |
| `PageHeader` | `title: string`, `subtitle?: ReactNode`, `count?: string \| number`, `icon?: ReactNode`, `actions?: ReactNode`, `className?` | 7 different `<h1>`/`<h2>` blocks and their flex rows |
| `EmptyState` | `illustration: EmptyStateIllustration`, `title: string`, `description?: ReactNode`, `action?: ReactNode`, `secondaryAction?: ReactNode`, `className?` | 7 dashed-border boxes with a lucide glyph in a grey circle |
| `PageToolbar` | `search?: ReactNode`, `filters?: ReactNode`, `children?: ReactNode`, `className?` | the hand-rolled search + chips + view-switch row |
| `SearchField` | `value: string`, `onValueChange: (v: string) => void`, `placeholder?: string`, `label?: string`, `hint?: boolean`, `className?` | `<Search className="absolute left-4 …" />` + `<Input className="pl-11 …" />`, at 3 different paddings |
| `FilterChip` | `active?: boolean`, `onClick?: () => void`, `count?: number`, `children`, `className?` | chips at 3 different sizes across 3 pages |
| `SegmentedControl` | `value: string`, `onValueChange: (v: string) => void`, `options: {value, label, icon?}[]`, `label?: string`, `className?` | two hand-rolled div-and-buttons segmented controls |
| `ListItem` | `title`, `meta?`, `icon?`, `thumbnail?`, `thumbnailAlt?`, `badge?`, `chevron?`, `action?`, `selected?`, `href?`, `onClick?`, `label?`, `className?` | 5 different row/card shapes, 2 of them non-focusable `<div onClick>` |
| `ListCard` | `title`, `description?`, `meta?`, `icon?`, `thumbnail?`, `thumbnailAlt?`, `badge?`, `action?`, `selected?`, `href?`, `onClick?`, `label?`, `className?` | the grid-page card variant of the above |
| `ListSkeleton` | `count?: number` (4), `variant?: 'row' \| 'card'` ('row'), `label?: string` ('Loading'), `className?` | per-page skeletons that didn't match the real row, and 5 pages that announced nothing |

`EmptyStateIllustration` =
`'documents' | 'library' | 'sessions' | 'flashcards' | 'exams' | 'search' |
'offline' | 'examResults' | 'flashcardsComplete' | 'uploadSuccess'`

### Notes that matter

- **`count` takes the whole phrase.** `count="12 documents"`, not `count={12}` —
  only the page knows the noun and the plural.
- **`icon` is a bare element.** `icon={<BookOpen />}`; the tile sizes and colours
  it. Don't pass classes.
- **`ListItem` click target.** Pass `href` (renders `<a>`) or `onClick` (renders
  `<button>`). The control is stretched over the whole row with an `::after`
  overlay, so the row is clickable and there is one focus ring around all of it.
  `action` sits above it on `z-10`, so clicking the delete button does **not**
  trigger the row — you no longer need `e.stopPropagation()`.
- **`action` is hover-revealed on desktop and always visible below `lg`**, where
  there is no hover. Give it an `aria-label`.
- **`label` on `ListItem`/`ListCard`** is only needed when `title` is not a plain
  string; otherwise the title is already the accessible name.
- **`chevron`** defaults to `true` when `href` is set, `false` otherwise.
- **Search-with-no-results is a different state from no-data-yet.** Use
  `illustration="search"` and omit `action` — "create one" is wrong advice when
  the user has 40 items and a bad query.
- **The illustrations have opaque near-white backgrounds** (they were drawn for
  the light theme). `EmptyState` feathers them with a radial `mask-image` and
  caps them at 160/192px so they read as a soft spotlight on `#0e0e16` instead of
  a white rectangle. Don't remove the mask, and don't render these WebPs raw
  anywhere else.

## Before / after

### Page shell + header + primary action

```tsx
// BEFORE — src/app/sessions/page.tsx
<div className="min-h-screen bg-stone-50 dark:bg-stone-950 px-4 py-8 sm:px-6">
  <div className="mx-auto max-w-4xl">
    <div className="mb-8 flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-stone-900 dark:text-stone-100">
        Study Spaces
      </h1>
      <Button className="gap-2 rounded-xl bg-[#6C47FF] hover:bg-[#5a38e0] text-white">
        <Plus className="h-4 w-4" />
        New Study Space
      </Button>
    </div>
    …
  </div>
</div>
```

```tsx
// AFTER
<PageContainer>
  <PageHeader
    title="Study Spaces"
    subtitle="A study space groups your documents, flashcards and quizzes for one topic."
    count={`${sessions.length} spaces`}
    icon={<BookOpen />}
    actions={
      <Button onClick={() => setShowModal(true)}>
        <Plus />
        New Study Space
      </Button>
    }
  />
  …
</PageContainer>
```

### Search + filters

```tsx
// BEFORE
<div className="relative mb-6">
  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
  <Input
    placeholder="Search study spaces..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="rounded-xl border-stone-200 bg-white pl-11 dark:border-stone-800 dark:bg-stone-900 …"
    aria-label="Search study spaces"
  />
</div>
```

```tsx
// AFTER
<PageToolbar
  search={
    <SearchField
      value={search}
      onValueChange={setSearch}
      placeholder="Search study spaces…"
      label="Search study spaces"
    />
  }
  filters={
    <>
      <FilterChip active={tab === 'all'} onClick={() => setTab('all')}>All</FilterChip>
      <FilterChip active={tab === 'recent'} onClick={() => setTab('recent')} count={4}>Recent</FilterChip>
    </>
  }
>
  <SegmentedControl
    value={view}
    onValueChange={setView}
    label="View mode"
    options={[
      { value: 'list', label: 'List', icon: <List /> },
      { value: 'grid', label: 'Grid', icon: <LayoutGrid /> },
    ]}
  />
</PageToolbar>
```

### A row

```tsx
// BEFORE — not focusable, needs stopPropagation, purple hover
<motion.div
  className="group cursor-pointer rounded-xl border border-stone-200 bg-white p-5 transition-all hover:border-purple-200 hover:shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:hover:border-purple-900"
  onClick={() => router.push(`/sessions/${session.id}`)}
>
  <div className="flex items-start justify-between gap-4">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{session.name}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Badge variant="secondary" className="gap-1 rounded-md bg-stone-100 …">
          <FileText className="h-3 w-3" />
          {session.document_count} documents
        </Badge>
        <span className="flex items-center gap-1 text-xs text-stone-400">
          <Calendar className="h-3 w-3" />
          {formatRelativeDate(session.updated_at)}
        </span>
      </div>
    </div>
    <Button
      variant="ghost" size="sm"
      className="opacity-0 transition-opacity group-hover:opacity-100"
      onClick={(e) => { e.stopPropagation(); setSessionToDelete(session) }}
    >
      <Trash2 className="h-4 w-4 text-stone-400 hover:text-red-500" />
    </Button>
  </div>
</motion.div>
```

```tsx
// AFTER
<ListItem
  href={`/sessions/${session.id}`}
  icon={<BookOpen />}
  title={session.name}
  meta={
    <>
      <span>{session.document_count ?? 0} documents</span>
      <span aria-hidden>·</span>
      <span>{formatRelativeDate(session.updated_at)}</span>
    </>
  }
  action={
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={`Delete study space ${session.name}`}
      onClick={() => setSessionToDelete(session)}
    >
      <Trash2 />
    </Button>
  }
/>
```

Rows go in a plain `<div className="flex flex-col gap-2">`. Cards go in
`<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">`.

### Loading and empty

```tsx
// BEFORE — geometry didn't match the real row; nothing announced
{isLoading ? (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="rounded-xl border border-stone-200 bg-white p-5 …">
        <div className="h-5 w-48 animate-pulse rounded-md bg-stone-100 …" />
      </div>
    ))}
  </div>
) : filtered.length === 0 ? (
  <div className="flex flex-col items-center rounded-xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center …">
    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-stone-100 …">
      <BookOpen className="h-6 w-6 text-stone-400" />
    </div>
    <p className="text-sm font-medium …">No study spaces yet</p>
    …
  </div>
) : ( … )}
```

```tsx
// AFTER
{isLoading ? (
  <ListSkeleton count={4} label="Loading study spaces" />
) : filtered.length === 0 ? (
  search ? (
    <EmptyState
      illustration="search"
      title="No study spaces match your search"
      description="Try a different keyword."
      secondaryAction={
        <Button variant="outline" onClick={() => setSearch('')}>Clear search</Button>
      }
    />
  ) : (
    <EmptyState
      illustration="sessions"
      title="No study spaces yet"
      description="A study space groups your documents, flashcards and quizzes for one topic."
      action={<Button onClick={() => setShowModal(true)}><Plus />New Study Space</Button>}
    />
  )
) : ( … )}
```
