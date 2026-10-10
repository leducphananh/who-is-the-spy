import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('Zero-Knowledge Dual-Channel Secret Distribution', () => {
  it('đảm bảo tuyệt đối không rò rỉ từ khóa hay vai trò bí mật qua Kênh Công Khai (DevTools audit)', async () => {
    const hub = new MockRealtimeHub();

    // 4 clients
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');
    const client4 = createMockSupabaseClient(hub, 'p4');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });
    const c4 = new SpyRoomController(client4, { id: 'p4', name: 'Dave' });

    // Join room
    await c1.joinRoom('SECRET_ROOM', 100);
    await c2.joinRoom('SECRET_ROOM', 200);
    await c3.joinRoom('SECRET_ROOM', 300);
    await c4.joinRoom('SECRET_ROOM', 400);

    expect(c1.getSnapshot().isHost).toBe(true);

    // Host bắt đầu game với 1 Spy
    await c1.startGame({ spyCount: 1, hasMrWhite: false });

    // 1. Kiểm tra từng client đều nhận được secret của chính mình
    const s1 = c1.getSnapshot();
    const s2 = c2.getSnapshot();
    const s3 = c3.getSnapshot();
    const s4 = c4.getSnapshot();

    expect(s1.mySecret).not.toBeNull();
    expect(s2.mySecret).not.toBeNull();
    expect(s3.mySecret).not.toBeNull();
    expect(s4.mySecret).not.toBeNull();

    expect(s1.mySecret?.word).toBeTruthy();
    expect(s2.mySecret?.word).toBeTruthy();
    expect(s3.mySecret?.word).toBeTruthy();
    expect(s4.mySecret?.word).toBeTruthy();

    // 2. AUDIT BẢO MẬT: Kiểm tra toàn bộ gói tin gửi trên kênh công khai game_room:SECRET_ROOM
    const publicBroadcasts = hub.recordedBroadcasts.filter(
      (b) => b.topic === 'game_room:SECRET_ROOM'
    );

    expect(publicBroadcasts.length).toBeGreaterThan(0);

    // Thu thập tất cả các từ khóa bí mật của ván đấu
    const secretWords = [
      s1.mySecret!.word,
      s2.mySecret!.word,
      s3.mySecret!.word,
      s4.mySecret!.word,
    ];

    for (const broadcast of publicBroadcasts) {
      const payloadStr = JSON.stringify(broadcast.payload);

      // KHÔNG ĐƯỢC CHỨA từ khóa của bất kỳ ai trong broadcast trên kênh chung
      for (const word of secretWords) {
        expect(payloadStr).not.toContain(word);
      }

      // KHÔNG ĐƯỢC CHỨA trường 'civilianWord' hay 'spyWord'
      expect(payloadStr).not.toContain('"civilianWord"');
      expect(payloadStr).not.toContain('"spyWord"');

      // KHÔNG ĐƯỢC CHỨA vai trò 'SPY' hay 'CIVILIAN'
      expect(payloadStr).not.toContain('"role"');
    }

    // 3. Kiểm tra kênh cá nhân chỉ gửi đúng cho người nhận tương ứng
    const privateBroadcastsP2 = hub.recordedBroadcasts.filter(
      (b) => b.topic === 'game_room:SECRET_ROOM:p2'
    );
    expect(privateBroadcastsP2).toHaveLength(1);
    expect(privateBroadcastsP2[0]?.event).toBe('ASSIGN_SECRET_WORD');
    expect((privateBroadcastsP2[0]?.payload as { word: string }).word).toBe(
      s2.mySecret?.word
    );
  });

  it('người chơi Guest cố tình gọi startGame sẽ bị ném lỗi và từ chối', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Host' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Guest' });

    await c1.joinRoom('ROOM_GUEST', 100);
    await c2.joinRoom('ROOM_GUEST', 200);

    await expect(
      c2.startGame({ spyCount: 1, hasMrWhite: false })
    ).rejects.toThrowError(/chỉ host/i);
  });

  it('phân phát vai trò Mr. White nhận từ khóa rỗng và role là MR_WHITE', async () => {
    const hub = new MockRealtimeHub();
    const clients = Array.from({ length: 5 }, (_, i) =>
      createMockSupabaseClient(hub, `p${i + 1}`)
    );
    const controllers = clients.map(
      (c, i) => new SpyRoomController(c, { id: `p${i + 1}`, name: `Player ${i + 1}` })
    );

    for (let i = 0; i < 5; i++) {
      await controllers[i]!.joinRoom('ROOM_WHITE', (i + 1) * 100);
    }

    // Host bắt đầu game có Mr White
    await controllers[0]!.startGame({ spyCount: 1, hasMrWhite: true });

    const secrets = controllers.map((c) => c.getSnapshot().mySecret!);
    const mrWhiteSecret = secrets.find((s) => s.role === 'MR_WHITE');
    const spySecret = secrets.find((s) => s.role === 'SPY');
    const civilianSecrets = secrets.filter((s) => s.role === 'CIVILIAN');

    expect(mrWhiteSecret).toBeDefined();
    expect(mrWhiteSecret?.word).toBe(''); // Không nhận từ nào

    expect(spySecret).toBeDefined();
    expect(spySecret?.word.trim()).not.toBe('');

    expect(civilianSecrets).toHaveLength(3);
    civilianSecrets.forEach((c) => expect(c.word.trim()).not.toBe(''));
  });
});
