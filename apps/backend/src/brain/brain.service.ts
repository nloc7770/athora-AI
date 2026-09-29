import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export type BrainNodeKind = 'core' | 'session' | 'document' | 'concept';

export interface BrainNode {
  id: string;
  kind: BrainNodeKind;
  label: string;
  docType?: 'pdf' | 'doc' | 'audio' | 'note' | 'video';
  status?: string;
  /** Navigation target for documents/concepts: the owning session. */
  sessionId?: string;
  /** Relative size hint for the renderer. */
  val: number;
}

export interface BrainLink {
  source: string;
  target: string;
  kind: 'core-session' | 'session-doc' | 'doc-concept';
}

export interface BrainGraph {
  nodes: BrainNode[];
  links: BrainLink[];
}

/**
 * Read ceilings, exported so tests assert against the constant instead of a
 * copy of its value — a hardcoded 250 in the spec meant raising the cap looked
 * like a regression.
 *
 * Sized for a real student's library: ~50 sessions across a degree, several
 * documents each. The renderer draws every node as a halo sprite, so these are
 * also the point where a weak GPU starts to feel it.
 */
export const BRAIN_CAPS = {
  sessions: 120,
  documents: 700,
  concepts: 800,
} as const;

const MAX_CONCEPT_LABEL = 80;

interface MindmapRawNode {
  id?: unknown;
  label?: unknown;
  parentId?: unknown;
}

@Injectable()
export class BrainService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * The student's knowledge brain: sessions as hubs, documents as leaves,
   * concepts from the LATEST completed mindmap per session. Pure Supabase
   * reads — no RAGFlow, no LLM, no new tables.
   */
  async getGraph(userId: string): Promise<BrainGraph> {
    const client = this.supabase.getAdminClient();

    const [sessionsRes, docsRes, mindsRes] = await Promise.all([
      client
        .from('study_sessions')
        .select('id, name, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(BRAIN_CAPS.sessions),
      client
        .from('documents')
        .select('id, session_id, name, type, status, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(BRAIN_CAPS.documents),
      client
        .from('ai_generations')
        .select('id, session_id, document_id, result, created_at')
        .eq('user_id', userId)
        .eq('type', 'mindmap')
        .eq('status', 'completed')
        .not('session_id', 'is', null)
        .order('created_at', { ascending: false }),
    ]);

    const nodes: BrainNode[] = [
      { id: 'core', kind: 'core', label: 'My Brain', val: 40 },
    ];
    const links: BrainLink[] = [];

    const sessions = (sessionsRes.data ?? []) as Array<Record<string, any>>;
    const documents = (docsRes.data ?? []) as Array<Record<string, any>>;
    const mindmaps = (mindsRes.data ?? []) as Array<Record<string, any>>;

    // Only sessions that will actually appear get a node.
    const sessionIds = new Set(sessions.map((s) => s.id as string));
    const docIds = new Set(documents.map((d) => d.id as string));

    for (const s of sessions) {
      nodes.push({
        id: s.id,
        kind: 'session',
        label: s.name ?? 'Untitled session',
        status: s.status,
        val: 8,
      });
      links.push({ source: 'core', target: s.id, kind: 'core-session' });
    }

    for (const d of documents) {
      // Orphan docs (no session) hang off the core so they still render.
      const target = d.session_id && sessionIds.has(d.session_id) ? d.session_id : 'core';
      nodes.push({
        id: d.id,
        kind: 'document',
        label: d.name ?? 'Untitled document',
        docType: d.type,
        status: d.status,
        sessionId: d.session_id ?? undefined,
        val: 3,
      });
      links.push({ source: target, target: d.id, kind: 'session-doc' });
    }

    // Concepts: latest completed mindmap per session wins. LLM output is
    // untrusted — skip malformed entries, cap label length.
    const latestMindmapBySession = new Map<string, Record<string, any>>();
    for (const m of mindmaps) {
      const sid = m.session_id as string;
      if (!latestMindmapBySession.has(sid)) latestMindmapBySession.set(sid, m);
    }

    // Round-robin across sessions so one huge mindmap cannot starve the rest.
    const perSessionConcepts = new Map<string, MindmapRawNode[]>();
    for (const [sid, m] of latestMindmapBySession) {
      if (!sessionIds.has(sid)) continue;
      perSessionConcepts.set(sid, this.extractMindmapNodes(m.result));
    }

    let conceptCount = 0;
    let progressed = true;
    while (conceptCount < BRAIN_CAPS.concepts && progressed) {
      progressed = false;
      for (const [sid, raw] of perSessionConcepts) {
        const next = raw.shift();
        if (!next) continue;
        progressed = true;
        const conceptId = `${sid}:${next.id}`;
        nodes.push({
          id: conceptId,
          kind: 'concept',
          label: next.label as string,
          sessionId: sid,
          val: 1,
        });
        // Concept anchors to the mindmap's document when known, else the session.
        const docId = (latestMindmapBySession.get(sid)?.document_id as string | null) ?? undefined;
        links.push({
          source: docId && docIds.has(docId) ? docId : sid,
          target: conceptId,
          kind: 'doc-concept',
        });
        conceptCount++;
        if (conceptCount >= BRAIN_CAPS.concepts) break;
      }
    }

    return { nodes, links };
  }

  /** Defensive parse of ai_generations.result for mindmap shape. */
  private extractMindmapNodes(result: unknown): MindmapRawNode[] {
    if (!result || typeof result !== 'object') return [];
    const nodes = (result as Record<string, unknown>).nodes;
    if (!Array.isArray(nodes)) return [];
    const out: MindmapRawNode[] = [];
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      const { id, label, parentId } = n as MindmapRawNode;
      if (typeof id !== 'string' || id.length === 0) continue;
      if (typeof label !== 'string' || label.trim().length === 0) continue;
      out.push({
        id,
        label: label.slice(0, MAX_CONCEPT_LABEL),
        parentId: typeof parentId === 'string' && parentId.length > 0 ? parentId : undefined,
      });
    }

    // Drop the mindmap's root. The generator prompt demands "exactly one root
    // node with no parentId" and that root always restates the topic — which
    // the session node already is. Kept as a concept it rendered as a second
    // node with the identical label hanging off its own session.
    // Guarded on "some node has a parent": a flat list with no hierarchy at
    // all must not be emptied.
    return out.some((n) => n.parentId) ? out.filter((n) => n.parentId) : out;
  }
}
