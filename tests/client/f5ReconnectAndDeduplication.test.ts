import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';
import { SPY_ACTIVE_SESSION_KEY, SPY_HOST_RAW_STATE_KEY } from '../../src/client/network/types.js';
import type { GameState } from '../../src/core/types.js';

describe('Duplicate Presence Deduplication & Host F5 Reconnect Flow', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Deduplication: khi 1 user có nhiều presence entry cùng id, presenceList chỉ giữ đúng 1 người và bảo toàn joinedAt ban đầu', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'usr-1');
    const controller = new SpyRoomController(c1, { id: 'usr-1', name: 'Alice' });

    await controller.joinRoom('ROOM_DEDUP', 100);

    // Giả lập mock channel presenceMap chứa nhiều entries trùng id (do connection cũ chưa timeout)
    const mockChannel = (controller as unknown as { publicChannel: { presenceState: () => Record<string, unknown[]> } }).publicChannel;
    vi.spyOn(mockChannel, 'presenceState').mockReturnValue({
      'conn-old': [
        { id: 'usr-1', name: 'Alice', avatar: 'fox', isHost: true, isReady: true, joinedAt: 100, isAlive: true },
        { id: 'usr-2', name: 'Bob', avatar: 'owl', isHost: false, isReady: true, joinedAt: 200, isAlive: true },
      ],
      'conn-new': [
        // Trùng id usr-1 nhưng có joinedAt lớn hơn (reconnect)
        { id: 'usr-1', name: 'Alice (reconnected)', avatar: 'fox', isHost: true, isReady: true, joinedAt: 500, isAlive: true },
      ],
    });

    // Kích hoạt presence sync
    (controller as unknown as { handlePresenceSync: () => void }).handlePresenceSync();

    const snapshot = controller.getSnapshot();
    const list = snapshot.presenceList;

    // Phải chỉ có 2 người chơi (Alice và Bob), không được có 2 Alice
    expect(list.length).toBe(2);
    expect(list.filter((p) => p.id === 'usr-1').length).toBe(1);

    const alice = list.find((p) => p.id === 'usr-1');
    expect(alice).toBeDefined();
    // Phải giữ joinedAt sớm nhất (100)
    expect(alice?.joinedAt).toBe(100);
    expect(alice?.name).toBe('Alice (reconnected)');
  });

  it('Chặn Guest chiếm quyền Host sớm khi Host disconnect trong ván đấu (Grace Period 30s)', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const c2 = createMockSupabaseClient(hub, 'guest-2');
    const c3 = createMockSupabaseClient(hub, 'guest-3');

    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });
    const guest2 = new SpyRoomController(c2, { id: 'guest-2', name: 'Watson Cú' });
    const guest3 = new SpyRoomController(c3, { id: 'guest-3', name: 'Moriarty Sói' });

    await host.joinRoom('ROOM_GRACE', 100);
    await guest2.joinRoom('ROOM_GRACE', 200);
    await guest3.joinRoom('ROOM_GRACE', 300);

    await host.startGame({ spyCount: 1, hasMrWhite: false });
    expect(guest2.getSnapshot().publicGameState?.phase).toBe('DESCRIBING');

    // Host tạm thời disconnect / reload (untrack / leave)
    await host.leaveRoom();

    // Guest phát hiện Host rời phòng trong active match
    const guestSnapshot = guest2.getSnapshot();
    expect(guestSnapshot.publicGameState?.isPausedForHostReconnect).toBe(true);

    // QUAN TRỌNG: Guest TUYỆT ĐỐI không được chiếm quyền Host khi 30s chưa hết!
    expect(guestSnapshot.isHost).toBe(false);
  });

  it('Host F5: khôi phục rawGameState từ storage, giữ isHost = true, lập tức đánh thức trận đấu (gỡ pause) và phát SYNC_STATE', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const c2 = createMockSupabaseClient(hub, 'guest-2');
    const c3 = createMockSupabaseClient(hub, 'guest-3');

    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });
    const guest2 = new SpyRoomController(c2, { id: 'guest-2', name: 'Watson Cú' });
    const guest3 = new SpyRoomController(c3, { id: 'guest-3', name: 'Moriarty Sói' });

    await host.joinRoom('ROOM_F5', 100);
    await guest2.joinRoom('ROOM_F5', 200);
    await guest3.joinRoom('ROOM_F5', 300);

    await host.startGame({ spyCount: 1, hasMrWhite: false });
    const savedRawState: GameState = host.getRawGameState()!;
    expect(savedRawState).not.toBeNull();
    expect(savedRawState.phase).toBe('DESCRIBING');

    // Host rời phòng (mô phỏng F5 / đóng tab rồi mở lại)
    await host.leaveRoom();

    // Guest đang đếm ngược 30s chờ Host
    expect(guest2.getSnapshot().publicGameState?.isPausedForHostReconnect).toBe(true);
    expect(guest2.getSnapshot().isHost).toBe(false);

    // Host tạo controller mới (sau khi F5 reload trang) với rawGameState được nạp lại
    const hostReloaded = new SpyRoomController(
      createMockSupabaseClient(hub, 'host-1'),
      { id: 'host-1', name: 'Host Cáo' }
    );

    // Host joinRoom kèm joinedAt ban đầu và rawGameState đã lưu
    await hostReloaded.joinRoom('ROOM_F5', {
      joinedAt: 100,
      isHost: true,
      rawGameState: savedRawState,
    });

    const hostSnapshot = hostReloaded.getSnapshot();
    // Host phải giữ vai trò Host
    expect(hostSnapshot.isHost).toBe(true);
    // Ván đấu phải được gỡ pause ngay lập tức trên Host
    expect(hostSnapshot.publicGameState?.isPausedForHostReconnect).toBe(false);
    expect(hostSnapshot.publicGameState?.phase).toBe('DESCRIBING');

    // Guest nhận được SYNC_STATE từ Host -> trận đấu cũng được gỡ pause ngay lập tức
    const guestUpdatedSnapshot = guest2.getSnapshot();
    expect(guestUpdatedSnapshot.publicGameState?.isPausedForHostReconnect).toBe(false);
    expect(guestUpdatedSnapshot.publicGameState?.phase).toBe('DESCRIBING');
    expect(guestUpdatedSnapshot.isHost).toBe(false);
  });

  it('Host F5 với storage bị khuyết thiếu players: không gây crash Cannot read properties of undefined (reading find)', async () => {
    const hub = new MockRealtimeHub();
    const c1 = createMockSupabaseClient(hub, 'host-1');
    const host = new SpyRoomController(c1, { id: 'host-1', name: 'Host Cáo' });

    // Giả lập storage bị lỗi/khuyết thiếu trường players
    const corruptedRawState = {
      roomCode: 'ROOM_CORRUPT',
      phase: 'DESCRIBING',
      roundNumber: 1,
      currentDescriberIndex: 0,
      config: { spyCount: 1, hasMrWhite: false },
      winner: null,
      // players bị thiếu hoàn toàn (undefined)
    } as unknown as GameState;

    // Phải joinRoom an toàn mà không throw TypeError: Cannot read properties of undefined (reading 'find')
    await expect(
      host.joinRoom('ROOM_CORRUPT', {
        joinedAt: 100,
        isHost: true,
        rawGameState: corruptedRawState,
      })
    ).resolves.not.toThrow();

    const snapshot = host.getSnapshot();
    expect(snapshot.isConnected).toBe(true);
    expect(snapshot.isHost).toBe(true);
    expect(snapshot.publicGameState).toBeDefined();
    // rawGameState.players được tự động phục hồi an toàn
    const restoredRaw = host.getRawGameState();
    expect(Array.isArray(restoredRaw?.players)).toBe(true);
    expect(restoredRaw?.players.length).toBeGreaterThan(0);
  });

  it('leaveRoom() xóa sạch session storage và đưa toàn bộ state về rỗng/null', async () => {
    const hub = new MockRealtimeHub();
    const client = createMockSupabaseClient(hub, 'host-1');
    const controller = new SpyRoomController(client, { id: 'host-1', name: 'Host Cáo' });

    // Giả lập sessionStorage
    sessionStorage.setItem(SPY_ACTIVE_SESSION_KEY, JSON.stringify({ roomCode: 'ROOM_LEAVE', userId: 'host-1' }));
    sessionStorage.setItem(SPY_HOST_RAW_STATE_KEY, JSON.stringify({ roomCode: 'ROOM_LEAVE', hostId: 'host-1' }));

    await controller.joinRoom('ROOM_LEAVE', { isHost: true });
    expect(controller.getSnapshot().isConnected).toBe(true);
    expect(controller.getSnapshot().roomCode).toBe('ROOM_LEAVE');

    // Rời phòng
    await controller.leaveRoom();

    const snapshot = controller.getSnapshot();
    expect(snapshot.isConnected).toBe(false);
    expect(snapshot.roomCode).toBe('');
    expect(snapshot.isHost).toBe(false);
    expect(snapshot.presenceList).toHaveLength(0);
    expect(snapshot.publicGameState).toBeNull();
    expect(snapshot.mySecret).toBeNull();
    expect(controller.getRawGameState()).toBeNull();

    // SessionStorage phải được xóa sạch
    expect(sessionStorage.getItem(SPY_ACTIVE_SESSION_KEY)).toBeNull();
    expect(sessionStorage.getItem(SPY_HOST_RAW_STATE_KEY)).toBeNull();
  });
});
