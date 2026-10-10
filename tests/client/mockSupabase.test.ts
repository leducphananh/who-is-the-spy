import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';

describe('Mock Supabase Realtime Harness', () => {
  it('hỗ trợ gửi và nhận broadcast giữa 2 client trên cùng channel', async () => {
    const hub = new MockRealtimeHub();
    const clientA = createMockSupabaseClient(hub, 'user-a');
    const clientB = createMockSupabaseClient(hub, 'user-b');

    const channelA = clientA.channel('game_room:ABC');
    const channelB = clientB.channel('game_room:ABC');

    const receivedEventsB: unknown[] = [];
    channelB.on('broadcast', { event: 'TEST_MSG' }, (payload) => {
      receivedEventsB.push(payload);
    });

    channelA.subscribe();
    channelB.subscribe();

    await channelA.send({
      type: 'broadcast',
      event: 'TEST_MSG',
      payload: { text: 'Hello from client A' },
    });

    expect(receivedEventsB).toHaveLength(1);
    expect(receivedEventsB[0]).toEqual({
      event: 'TEST_MSG',
      type: 'broadcast',
      payload: { text: 'Hello from client A' },
    });
  });

  it('cô lập hoàn toàn các topic khác nhau (Topic Isolation)', async () => {
    const hub = new MockRealtimeHub();
    const clientA = createMockSupabaseClient(hub, 'user-a');
    const clientB = createMockSupabaseClient(hub, 'user-b');

    const publicChan = clientA.channel('game_room:ABC');
    const privateChanB = clientB.channel('game_room:ABC:user-b');

    const receivedByB: unknown[] = [];
    privateChanB.on('broadcast', { event: 'SECRET' }, (payload) => {
      receivedByB.push(payload);
    });

    publicChan.subscribe();
    privateChanB.subscribe();

    // Gửi trên public channel
    await publicChan.send({
      type: 'broadcast',
      event: 'SECRET',
      payload: { word: 'Bí mật' },
    });

    // Client B subscribe private channel không được nhận gói tin từ public channel
    expect(receivedByB).toHaveLength(0);
  });

  it('hỗ trợ Presence tracking, sync và leave giữa các client', async () => {
    const hub = new MockRealtimeHub();
    const clientA = createMockSupabaseClient(hub, 'user-a');
    const clientB = createMockSupabaseClient(hub, 'user-b');

    const chanA = clientA.channel('game_room:ABC');
    const chanB = clientB.channel('game_room:ABC');

    let syncCountB = 0;
    chanB.on('presence', { event: 'sync' }, () => {
      syncCountB++;
    });

    chanA.subscribe();
    chanB.subscribe();

    // Client A track presence
    await chanA.track({ id: 'user-a', name: 'Alice', isHost: true });

    // Client B có presenceState phản ánh Client A
    const presencesB = chanB.presenceState();
    expect(presencesB['user-a']).toBeDefined();
    expect(syncCountB).toBeGreaterThanOrEqual(1);

    // Client A untrack presence
    await chanA.untrack();
    const afterUntrack = chanB.presenceState();
    expect(afterUntrack['user-a']).toBeUndefined();
  });
});
