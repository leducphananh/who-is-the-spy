import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('SpyRoomController - Room Lifecycle and Presence', () => {
  it('cho phép khởi tạo và subscribe snapshot qua Observer pattern', () => {
    const hub = new MockRealtimeHub();
    const client = createMockSupabaseClient(hub, 'p1');
    const controller = new SpyRoomController(client, {
      id: 'p1',
      name: 'Alice',
      avatar: 'av1',
    });

    const snapshot = controller.getSnapshot();
    expect(snapshot.localPlayerId).toBe('p1');
    expect(snapshot.localPlayerName).toBe('Alice');
    expect(snapshot.isConnected).toBe(false);
    expect(snapshot.roomCode).toBe('');
    expect(snapshot.presenceList).toHaveLength(0);
  });

  it('khi joinRoom: kết nối thành công và track presence bản thân lên kênh chung', async () => {
    const hub = new MockRealtimeHub();
    const client = createMockSupabaseClient(hub, 'p1');
    const controller = new SpyRoomController(client, {
      id: 'p1',
      name: 'Alice',
      avatar: 'av1',
    });

    let notificationCount = 0;
    const unsubscribe = controller.subscribe(() => {
      notificationCount++;
    });

    await controller.joinRoom('ABC123');

    const snapshot = controller.getSnapshot();
    expect(snapshot.isConnected).toBe(true);
    expect(snapshot.roomCode).toBe('ABC123');
    expect(snapshot.presenceList).toHaveLength(1);
    expect(snapshot.presenceList[0]?.id).toBe('p1');
    expect(snapshot.isHost).toBe(true); // Người đầu tiên vào phòng là Host
    expect(notificationCount).toBeGreaterThan(0);

    unsubscribe();
  });

  it('nhiều client cùng vào phòng: đồng bộ danh sách presence và chỉ 1 người là Host', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');

    const controller1 = new SpyRoomController(client1, {
      id: 'p1',
      name: 'Alice',
      avatar: 'av1',
    });
    const controller2 = new SpyRoomController(client2, {
      id: 'p2',
      name: 'Bob',
      avatar: 'av2',
    });

    // P1 vào trước lúc joinedAt = 1000
    await controller1.joinRoom('ROOM99', 1000);
    // P2 vào sau lúc joinedAt = 2000
    await controller2.joinRoom('ROOM99', 2000);

    const snap1 = controller1.getSnapshot();
    const snap2 = controller2.getSnapshot();

    expect(snap1.presenceList).toHaveLength(2);
    expect(snap2.presenceList).toHaveLength(2);

    // P1 là Host vì vào trước
    expect(snap1.isHost).toBe(true);
    // P2 là Guest
    expect(snap2.isHost).toBe(false);
  });

  it('leaveRoom ngắt kết nối và dọn dẹp channels', async () => {
    const hub = new MockRealtimeHub();
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Alice' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });

    await c1.joinRoom('ROOM1');
    await c2.joinRoom('ROOM1');

    expect(c2.getSnapshot().presenceList).toHaveLength(2);

    // C1 rời phòng
    await c1.leaveRoom();

    expect(c1.getSnapshot().isConnected).toBe(false);
    expect(c1.getSnapshot().roomCode).toBe('');
    expect(c2.getSnapshot().presenceList).toHaveLength(1);
  });
});
