import { afterEach, describe, expect, it, vi } from 'vitest';
import { supabaseBackend } from '../../src/sync/supabase';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch() {
  const fetchMock = vi.fn().mockResolvedValue(new Response('[]', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('supabaseBackend URL normalization', () => {
  it('builds the REST path once when the config URL is the bare project URL', async () => {
    const fetchMock = stubFetch();
    await supabaseBackend({ url: 'https://proj.supabase.co', anonKey: 'k' }).pull('CODE');
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toBe(
      'https://proj.supabase.co/rest/v1/sevens_members?group_code=eq.CODE&select=payload',
    );
  });

  it('does not double up the path when the config URL already ends in /rest/v1', async () => {
    // Supabase's dashboard shows this REST endpoint right next to the bare
    // project URL on the same settings page, so pasting it here is an easy
    // mistake to make — it must not produce .../rest/v1/rest/v1/....
    const fetchMock = stubFetch();
    await supabaseBackend({ url: 'https://proj.supabase.co/rest/v1/', anonKey: 'k' }).pull('CODE');
    const requestedUrl = fetchMock.mock.calls[0][0] as string;
    expect(requestedUrl).toBe(
      'https://proj.supabase.co/rest/v1/sevens_members?group_code=eq.CODE&select=payload',
    );
  });
});
