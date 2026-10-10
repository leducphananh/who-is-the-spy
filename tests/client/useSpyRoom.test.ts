import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from '../client/mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';
import { useSpyRoom } from '../../src/client/hooks/useSpyRoom.js';

describe('useSpyRoom React Hook Wrapper', () => {
  it('cung cấp đầy đủ snapshot properties và action methods từ controller', () => {
    const hub = new MockRealtimeHub();
    const client = createMockSupabaseClient(hub, 'p1');
    const controller = new SpyRoomController(client, { id: 'p1', name: 'Alice' });

    // useSyncExternalStore có thể chạy trực tiếp nếu có React context hoặc kiểm tra kết quả trả về của hook
    const hookResult = useSpyRoom(controller);

    expect(hookResult.localPlayerId).toBe('p1');
    expect(hookResult.localPlayerName).toBe('Alice');
    expect(hookResult.isConnected).toBe(false);
    expect(hookResult.isHost).toBe(false);
    expect(hookResult.publicGameState).toBeNull();
    expect(hookResult.mySecret).toBeNull();

    expect(typeof hookResult.startGame).toBe('function');
    expect(typeof hookResult.nextTurn).toBe('function');
    expect(typeof hookResult.castVote).toBe('function');
    expect(typeof hookResult.submitMrWhiteGuess).toBe('function');
    expect(typeof hookResult.proceedToNextRound).toBe('function');
    expect(typeof hookResult.joinRoom).toBe('function');
    expect(typeof hookResult.leaveRoom).toBe('function');
  });

  it('gọi action qua hook result ủy quyền chính xác cho controller', async () => {
    const hub = new MockRealtimeHub();
    const client = createMockSupabaseClient(hub, 'p1');
    const controller = new SpyRoomController(client, { id: 'p1', name: 'Alice' });

    const hookResult = useSpyRoom(controller);
    await hookResult.joinRoom('HOOK_ROOM');

    const updated = useSpyRoom(controller);
    expect(updated.isConnected).toBe(true);
    expect(updated.roomCode).toBe('HOOK_ROOM');
    expect(updated.isHost).toBe(true);
  });
});
