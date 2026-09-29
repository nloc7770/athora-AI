import { BrainService, BRAIN_CAPS } from './brain.service';

type Fixtures = Record<string, unknown[]>;

/**
 * Chainable supabase stub that resolves to the fixture for whichever table
 * from() named. Every filter/order/limit is a pass-through — the service's
 * assembly logic is what's under test, not PostgREST.
 */
function makeSupabase(fixtures: Fixtures) {
  const service = {
    getAdminClient: () => ({
      from: (table: string) => {
        const result = { data: fixtures[table] ?? [], error: null };
        const builder: Record<string, unknown> = {};
        for (const m of ['select', 'eq', 'not', 'in', 'order', 'limit']) {
          builder[m] = () => builder;
        }
        builder['then'] = (resolve: (v: unknown) => void) => resolve(result);
        return builder;
      },
    }),
  };
  return service as never;
}

const SESSION = { id: 's-1', name: 'Biology', status: 'active', created_at: '2026-01-01' };
const DOC = {
  id: 'd-1',
  session_id: 's-1',
  name: 'Chapter 1',
  type: 'pdf',
  status: 'ready',
  created_at: '2026-01-02',
};

function mindmap(sessionId: string, documentId: string | null, nodes: unknown[], createdAt: string) {
  return { id: `g-${createdAt}`, session_id: sessionId, document_id: documentId, result: { nodes }, created_at: createdAt };
}

describe('BrainService.getGraph', () => {
  it('builds core → session → document → concept', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [DOC],
        ai_generations: [mindmap('s-1', 'd-1', [{ id: 'c1', label: 'Mitosis' }], '2026-02-01')],
      }),
    );

    const { nodes, links } = await svc.getGraph('u-1');

    expect(nodes.map((n) => n.kind)).toEqual(['core', 'session', 'document', 'concept']);
    expect(nodes.find((n) => n.kind === 'concept')).toMatchObject({
      id: 's-1:c1',
      label: 'Mitosis',
      sessionId: 's-1',
    });
    expect(links).toEqual([
      { source: 'core', target: 's-1', kind: 'core-session' },
      { source: 's-1', target: 'd-1', kind: 'session-doc' },
      { source: 'd-1', target: 's-1:c1', kind: 'doc-concept' },
    ]);
  });

  it('drops the mindmap root so it does not duplicate the session node', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [DOC],
        ai_generations: [
          mindmap(
            's-1',
            'd-1',
            [
              // The generator prompt demands exactly one root with no parentId,
              // and it restates the topic — which the session node already is.
              { id: 'root', label: 'Biology' },
              { id: 'c1', label: 'Mitosis', parentId: 'root' },
              { id: 'c2', label: 'Meiosis', parentId: 'c1' },
            ],
            '2026-02-01',
          ),
        ],
      }),
    );

    const { nodes } = await svc.getGraph('u-1');
    const concepts = nodes.filter((n) => n.kind === 'concept');

    expect(concepts.map((c) => c.label)).toEqual(['Mitosis', 'Meiosis']);
    // Exactly one node carries the session's name: the session itself.
    expect(nodes.filter((n) => n.label === 'Biology')).toHaveLength(1);
  });

  it('keeps every node when the mindmap has no hierarchy at all', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [DOC],
        ai_generations: [
          // No parentId anywhere: dropping "roots" here would empty the list.
          mindmap('s-1', 'd-1', [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }], '2026-02-01'),
        ],
      }),
    );

    const concepts = (await svc.getGraph('u-1')).nodes.filter((n) => n.kind === 'concept');
    expect(concepts.map((c) => c.label)).toEqual(['Alpha', 'Beta']);
  });

  it('uses only the latest completed mindmap per session', async () => {
    // Query orders created_at desc, so the newest row arrives first.
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [DOC],
        ai_generations: [
          mindmap('s-1', 'd-1', [{ id: 'new', label: 'Newest' }], '2026-03-01'),
          mindmap('s-1', 'd-1', [{ id: 'old', label: 'Stale' }], '2026-01-01'),
        ],
      }),
    );

    const { nodes } = await svc.getGraph('u-1');
    const concepts = nodes.filter((n) => n.kind === 'concept');

    expect(concepts).toHaveLength(1);
    expect(concepts[0].label).toBe('Newest');
  });

  it('hangs a session-less document off the core', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [],
        documents: [{ ...DOC, session_id: null }],
        ai_generations: [],
      }),
    );

    const { links } = await svc.getGraph('u-1');
    expect(links).toEqual([{ source: 'core', target: 'd-1', kind: 'session-doc' }]);
  });

  it('anchors concepts to the session when the mindmap document is absent', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [],
        ai_generations: [mindmap('s-1', 'missing-doc', [{ id: 'c1', label: 'Osmosis' }], '2026-02-01')],
      }),
    );

    const { links } = await svc.getGraph('u-1');
    expect(links).toContainEqual({ source: 's-1', target: 's-1:c1', kind: 'doc-concept' });
  });

  it('caps concepts and round-robins so one big mindmap cannot starve another', async () => {
    const many = (prefix: string, n: number) =>
      Array.from({ length: n }, (_, i) => ({ id: `${prefix}${i}`, label: `${prefix} ${i}` }));

    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION, { ...SESSION, id: 's-2', name: 'Chemistry' }],
        documents: [],
        ai_generations: [
          // Comfortably over the cap, so the assertion is about the ceiling
          // rather than about the fixture's own size.
          mindmap('s-1', null, many('big', BRAIN_CAPS.concepts + 150), '2026-02-01'),
          mindmap('s-2', null, many('small', 5), '2026-02-01'),
        ],
      }),
    );

    const { nodes } = await svc.getGraph('u-1');
    const concepts = nodes.filter((n) => n.kind === 'concept');

    expect(concepts).toHaveLength(BRAIN_CAPS.concepts);
    // The small session still got all five of its concepts in.
    expect(concepts.filter((c) => c.id.startsWith('s-2:'))).toHaveLength(5);
  });

  it('skips malformed mindmap nodes instead of throwing', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [],
        ai_generations: [
          mindmap(
            's-1',
            null,
            [
              null,
              'not an object',
              { id: '', label: 'empty id' },
              { id: 'no-label' },
              { id: 'blank', label: '   ' },
              { id: 42, label: 'numeric id' },
              { id: 'good', label: 'Kept' },
            ],
            '2026-02-01',
          ),
        ],
      }),
    );

    const { nodes } = await svc.getGraph('u-1');
    const concepts = nodes.filter((n) => n.kind === 'concept');

    expect(concepts).toHaveLength(1);
    expect(concepts[0].label).toBe('Kept');
  });

  it('truncates very long concept labels', async () => {
    const svc = new BrainService(
      makeSupabase({
        study_sessions: [SESSION],
        documents: [],
        ai_generations: [mindmap('s-1', null, [{ id: 'c1', label: 'x'.repeat(500) }], '2026-02-01')],
      }),
    );

    const { nodes } = await svc.getGraph('u-1');
    expect(nodes.find((n) => n.kind === 'concept')!.label).toHaveLength(80);
  });

  it('returns a core-only graph for a brand-new user', async () => {
    const svc = new BrainService(makeSupabase({ study_sessions: [], documents: [], ai_generations: [] }));

    const { nodes, links } = await svc.getGraph('u-new');
    expect(nodes).toEqual([{ id: 'core', kind: 'core', label: 'My Brain', val: 40 }]);
    expect(links).toEqual([]);
  });
});
