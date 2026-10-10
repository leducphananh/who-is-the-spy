import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('Host Migration and Grace Period Reconnect', () => {
  it('ở phase LOBBY: khi Host rời phòng, quyền Host tự động chuyển giao tức thì cho người vào sớm nhất tiếp theo', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Host Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });

    await c1.joinRoom('LOBBY_ROOM', 100);
    await c2.joinRoom('LOBBY_ROOM', 200);
    await c3.joinRoom('LOBBY_ROOM', 300);

    expect(c1.getSnapshot().isHost).toBe(true);
    expect(c2.getSnapshot().isHost).toBe(false);

    // Host Alice rời phòng ở LOBBY
    await c1.leaveRoom();

    // Bob (joinedAt 200 sớm hơn Charlie 300) trở thành Host mới!
    expect(c2.getSnapshot().isHost).toBe(true);
    expect(c3.getSnapshot().isHost).toBe(false);
  });

  it('ở ACTIVE GAME: khi Host ngắt kết nối, kích hoạt trạng thái tạm dừng 30s', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Host Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });

    await c1.joinRoom('ACTIVE_ROOM', 100);
    await c2.joinRoom('ACTIVE_ROOM', 200);
    await c3.joinRoom('ACTIVE_ROOM', 300);

    // Bắt đầu game 3 người (1 Spy, 2 Civilian)
    await c1.startGame({ spyCount: 1, hasMrWhite: false });
    expect(c2.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');

    // Host rời phòng (mất kết nối)
    await c1.leaveRoom();

    // Bob và Charlie nhận được trạng thái tạm dừng chờ Host reconnect
    const snap2 = c2.getSnapshot();
    expect(snap2.publicGameState?.isPausedForHostReconnect).toBe(true);
    expect(snap2.publicGameState?.hostReconnectSecondsRemaining).toBe(30);
  });

  it('ở ACTIVE GAME: nếu Host reconnect trong 30s, ván đấu tiếp tục bình thường', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Host Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });

    await c1.joinRoom('RECONNECT_ROOM', 100);
    await c2.joinRoom('RECONNECT_ROOM', 200);
    await c3.joinRoom('RECONNECT_ROOM', 300);
    await c1.startGame({ spyCount: 1, hasMrWhite: false });

    // Lưu lại trạng thái ván đấu trước khi mất mạng (giống sessionStorage của client)
    const savedState = c1.getRawGameState()!;
    expect(savedState).not.toBeNull();

    // Host rời phòng
    await c1.leaveRoom();
    expect(c2.getSnapshot().publicGameState?.isPausedForHostReconnect).toBe(true);

    // Host kết nối lại với cùng id
    const c1Reconnected = new SpyRoomController(client1, { id: 'p1', name: 'Host Alice' });
    await c1Reconnected.joinRoom('RECONNECT_ROOM', 50); // joinedAt sớm nhất

    // Phục hồi trận đấu với state đã sao lưu
    await c1Reconnected.resumeMatchAfterReconnect(savedState);

    expect(c2.getSnapshot().publicGameState?.isPausedForHostReconnect).toBe(false);
    expect(c2.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');
  });

  it('ở ACTIVE GAME: nếu hết 30s mà Host không reconnect, hủy ván và đưa về LOBBY với Host mới', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Host Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });

    await c1.joinRoom('TIMEOUT_ROOM', 100);
    await c2.joinRoom('TIMEOUT_ROOM', 200);
    await c3.joinRoom('TIMEOUT_ROOM', 300);
    await c1.startGame({ spyCount: 1, hasMrWhite: false });

    // Host rời phòng
    await c1.leaveRoom();
    expect(c2.getSnapshot().publicGameState?.isPausedForHostReconnect).toBe(true);

    // Kích hoạt timeout hết 30s
    c2.triggerHostReconnectTimeout();

    // Ván đấu bị hủy về LOBBY, Bob trở thành Host mới
    const snap2 = c2.getSnapshot();
    expect(snap2.isHost).toBe(true);
    expect(snap2.publicGameState?.phase).toBe('LOBBY');
    expect(snap2.publicGameState?.isPausedForHostReconnect).toBe(false);
  });
});
