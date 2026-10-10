import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('Heartbeat Sync & Request Resync Flow', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Host phản hồi action REQUEST_RESYNC: broadcast lại SYNC_STATE và bắn lại ASSIGN_SECRET_WORD cho người yêu cầu', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const c2 = createMockSupabaseClient(hub, 'guest-2');
    const c3 = createMockSupabaseClient(hub, 'guest-3');

    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });
    const guest2 = new SpyRoomController(c2, { id: 'guest-2', name: 'Watson Cú' });
    const guest3 = new SpyRoomController(c3, { id: 'guest-3', name: 'Moriarty Sói' });

    await host.joinRoom('ROOM_RESYNC', 100);
    await guest2.joinRoom('ROOM_RESYNC', 200);
    await guest3.joinRoom('ROOM_RESYNC', 300);

    // Host bắt đầu game
    await host.startGame({ spyCount: 1, hasMrWhite: false });

    // Cả 3 người đã có state và secret
    const initialSecret2 = guest2.getSnapshot().mySecret;
    expect(initialSecret2).not.toBeNull();
    expect(guest2.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');

    // Giả lập guest2 bị refresh/mất secret (ví dụ F5 khôi phục trang)
    // Tạo 1 controller mới cho guest2 với cùng id 'guest-2'
    const guest2Reconnected = new SpyRoomController(
      createMockSupabaseClient(hub, 'guest-2'),
      { id: 'guest-2', name: 'Watson Cú' }
    );
    await guest2Reconnected.joinRoom('ROOM_RESYNC', 200);

    // Khi guest2Reconnected join vào phòng đang active, hệ thống tự động resync hoặc gọi requestResync()
    await guest2Reconnected.requestResync();

    // Sau khi Host nhận được REQUEST_RESYNC, guest2Reconnected phải nhận lại đúng secret và publicGameState
    expect(guest2Reconnected.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');
    expect(guest2Reconnected.getSnapshot().mySecret).not.toBeNull();
    expect(guest2Reconnected.getSnapshot().mySecret?.role).toBe(initialSecret2?.role);
    expect(guest2Reconnected.getSnapshot().mySecret?.word).toBe(initialSecret2?.word);
  });

  it('Host tự động phát sóng SYNC_STATE định kỳ (Heartbeat 3s) khi ván đấu đang diễn ra', async () => {
    vi.useFakeTimers();

    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const c2 = createMockSupabaseClient(hub, 'guest-2');
    const c3 = createMockSupabaseClient(hub, 'guest-3');

    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });
    const guest2 = new SpyRoomController(c2, { id: 'guest-2', name: 'Watson Cú' });
    const guest3 = new SpyRoomController(c3, { id: 'guest-3', name: 'Moriarty Sói' });

    await host.joinRoom('ROOM_HEARTBEAT', 100);
    await guest2.joinRoom('ROOM_HEARTBEAT', 200);
    await guest3.joinRoom('ROOM_HEARTBEAT', 300);

    await host.startGame({ spyCount: 1, hasMrWhite: false });

    const broadcastCountBefore = hub.recordedBroadcasts.filter(
      (b) => b.event === 'SYNC_STATE'
    ).length;

    // Tua nhanh 3 giây
    vi.advanceTimersByTime(3000);

    const broadcastCountAfter = hub.recordedBroadcasts.filter(
      (b) => b.event === 'SYNC_STATE'
    ).length;

    expect(broadcastCountAfter).toBeGreaterThan(broadcastCountBefore);

    // Khi rời phòng thì timer heartbeat phải được hủy
    await host.leaveRoom();
    const broadcastCountAfterLeave = hub.recordedBroadcasts.filter(
      (b) => b.event === 'SYNC_STATE'
    ).length;

    vi.advanceTimersByTime(3000);
    expect(
      hub.recordedBroadcasts.filter((b) => b.event === 'SYNC_STATE').length
    ).toBe(broadcastCountAfterLeave);

    vi.useRealTimers();
  });

  it('Client tự động trigger requestResync khi thấy Host Presence có gamePhase khác LOBBY nhưng client chưa có game state', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });

    const c2 = createMockSupabaseClient(hub, 'guest-2');
    const guest2 = new SpyRoomController(c2, { id: 'guest-2', name: 'Watson Cú' });

    const c3 = createMockSupabaseClient(hub, 'guest-3');
    const guest3 = new SpyRoomController(c3, { id: 'guest-3', name: 'Moriarty Sói' });

    await host.joinRoom('ROOM_AUTO_RESYNC', 100);
    await guest2.joinRoom('ROOM_AUTO_RESYNC', 200);
    await guest3.joinRoom('ROOM_AUTO_RESYNC', 300);

    // Host bắt đầu game
    await host.startGame({ spyCount: 1, hasMrWhite: false });

    // Host presence phải có gamePhase là 'DESCRIBING'
    const hostPresence = host.getSnapshot().presenceList.find((p) => p.isHost);
    expect(hostPresence?.gamePhase).toBe('DESCRIBING');

    // Một client F5 kết nối lại vào phòng
    const guestRejoined = new SpyRoomController(
      createMockSupabaseClient(hub, 'guest-2'),
      { id: 'guest-2', name: 'Watson Cú' }
    );
    await guestRejoined.joinRoom('ROOM_AUTO_RESYNC', 200);

    // guestRejoined nhận diện Host gamePhase !== 'LOBBY' và tự động resync thành công
    expect(guestRejoined.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');
    expect(guestRejoined.getSnapshot().mySecret).not.toBeNull();
  });
});
