import { foldSystemIntoUser } from './llm.service';

describe('foldSystemIntoUser', () => {
  it('moves system content into the first user turn and drops the system role', () => {
    const out = foldSystemIntoUser([
      { role: 'system', content: 'CTX' },
      { role: 'assistant', content: 'hi' },
      { role: 'user', content: 'Q1' },
      { role: 'user', content: 'Q2' },
    ]);
    expect(out.some((m) => (m.role as string) === 'system')).toBe(false);
    expect(out[1].content).toBe('[INSTRUCTIONS]\nCTX\n[/INSTRUCTIONS]\n\nQ1');
    expect(out[2].content).toBe('Q2');
  });

  it('passes messages through untouched when there is no system message', () => {
    const msgs = [{ role: 'user' as const, content: 'Q' }];
    expect(foldSystemIntoUser(msgs)).toEqual(msgs);
  });

  it('emits a user turn when there is only a system message', () => {
    expect(foldSystemIntoUser([{ role: 'system', content: 'CTX' }])).toEqual([
      { role: 'user', content: '[INSTRUCTIONS]\nCTX\n[/INSTRUCTIONS]' },
    ]);
  });
});
