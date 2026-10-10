import { describe, it, expect } from 'vitest';
import {
  getSupabaseClient,
  isUsingRealSupabase,
} from '../../src/client/network/supabaseClient.js';

describe('Hybrid Supabase Client Provider', () => {
  it('khi thiếu env variables thì tự động fallback sang local mock client', () => {
    // Không có VITE_SUPABASE_URL
    const client = getSupabaseClient('client-1');
    expect(client).toBeDefined();
    expect(typeof client.channel).toBe('function');
    expect(isUsingRealSupabase()).toBe(false);
  });

  it('nhận diện chính xác khi có env variables của Supabase Cloud', () => {
    const originalUrl = import.meta.env.VITE_SUPABASE_URL;
    const originalKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    try {
      import.meta.env.VITE_SUPABASE_URL = 'https://mssgbgefexgahlnbtlgo.supabase.co';
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
      expect(isUsingRealSupabase()).toBe(true);
    } finally {
      import.meta.env.VITE_SUPABASE_URL = originalUrl;
      import.meta.env.VITE_SUPABASE_ANON_KEY = originalKey;
    }
  });

  it('2 client tạo từ getSupabaseClient có thể liên lạc với nhau qua fallback hub', async () => {
    const client1 = getSupabaseClient('test-user-1');
    const client2 = getSupabaseClient('test-user-2');

    const channel1 = client1.channel('hybrid_test_room');
    const channel2 = client2.channel('hybrid_test_room');

    const received: unknown[] = [];
    channel2.on('broadcast', { event: 'PING' }, (payload) => {
      received.push(payload);
    });

    channel1.subscribe();
    channel2.subscribe();

    await channel1.send({
      type: 'broadcast',
      event: 'PING',
      payload: { message: 'pong' },
    });

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual({
      event: 'PING',
      type: 'broadcast',
      payload: { message: 'pong' },
    });
  });
});
