import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('Network E2E Multi-Client Integration Suite', () => {
  it('mô phỏng trọn vẹn 1 ván đấu 4 máy qua mạng Supabase Realtime (Zero-Knowledge -> Describing -> Voting -> Win & Reveal)', async () => {
    const hub = new MockRealtimeHub();

    // 4 máy khách (clients)
    const client1 = createMockSupabaseClient(hub, 'p1');
    const client2 = createMockSupabaseClient(hub, 'p2');
    const client3 = createMockSupabaseClient(hub, 'p3');
    const client4 = createMockSupabaseClient(hub, 'p4');

    const c1 = new SpyRoomController(client1, { id: 'p1', name: 'Alice (Host)' });
    const c2 = new SpyRoomController(client2, { id: 'p2', name: 'Bob' });
    const c3 = new SpyRoomController(client3, { id: 'p3', name: 'Charlie' });
    const c4 = new SpyRoomController(client4, { id: 'p4', name: 'Dave' });

    const controllers = [c1, c2, c3, c4];

    // 1. Cả 4 máy lần lượt nhập mã phòng 'MATCH99'
    await c1.joinRoom('MATCH99', 100);
    await c2.joinRoom('MATCH99', 200);
    await c3.joinRoom('MATCH99', 300);
    await c4.joinRoom('MATCH99', 400);

    // Kiểm tra Presence trên cả 4 máy
    for (const c of controllers) {
      const snap = c.getSnapshot();
      expect(snap.isConnected).toBe(true);
      expect(snap.presenceList).toHaveLength(4);
    }
    expect(c1.getSnapshot().isHost).toBe(true);
    expect(c2.getSnapshot().isHost).toBe(false);

    // 2. Host bấm bắt đầu ván đấu (1 Gián điệp)
    await c1.startGame({ spyCount: 1, hasMrWhite: false });

    // Kiểm tra Zero-Knowledge: Mỗi máy CHỈ nhận được từ khóa của chính mình
    const secrets = controllers.map((c) => c.getSnapshot().mySecret!);
    for (const s of secrets) {
      expect(s).toBeDefined();
      expect(s.word).toBeTruthy();
    }

    const spies = controllers.filter((c) => c.getSnapshot().mySecret?.role === 'SPY');
    const civilians = controllers.filter((c) => c.getSnapshot().mySecret?.role === 'CIVILIAN');

    expect(spies).toHaveLength(1);
    expect(civilians).toHaveLength(3);

    const spyController = spies[0]!;
    const spyId = spyController.getSnapshot().localPlayerId;

    // Kiểm tra PublicGameState trên tất cả các máy: TUYỆT ĐỐI không có revealedRole/revealedWord
    for (const c of controllers) {
      const pubState = c.getSnapshot().publicGameState!;
      expect(pubState.phase).toBe('DESCRIBING');
      for (const p of pubState.players) {
        expect(p.revealedRole).toBeUndefined();
        expect(p.revealedWord).toBeUndefined();
      }
    }

    // 3. Vòng mô tả: Lần lượt 4 người bấm nextTurn khi tới lượt
    for (let i = 0; i < 4; i++) {
      const state = c1.getSnapshot().publicGameState!;
      const currentDescriber = state.players[state.currentDescriberIndex]!;
      const activeController = controllers.find(
        (c) => c.getSnapshot().localPlayerId === currentDescriber.id
      )!;

      await activeController.nextTurn();
    }

    // Sau khi cả 4 người mô tả xong, hệ thống tự động chuyển sang phase VOTING trên toàn bộ 4 máy
    for (const c of controllers) {
      expect(c.getSnapshot().publicGameState?.phase).toBe('VOTING');
    }

    // 4. Bỏ phiếu kín: Mọi người dồn phiếu vote Gián điệp
    for (const c of controllers) {
      await c.castVote(spyId);
    }

    // Sau khi đủ 4 phiếu, Host tự động tallyVotes -> Gián điệp bị loại -> Dân thường thắng!
    for (const c of controllers) {
      const finalState = c.getSnapshot().publicGameState!;
      expect(finalState.phase).toBe('GAME_OVER');
      expect(finalState.winner).toBe('CIVILIANS');

      // 5. Kết thúc trận đấu (GAME_OVER): Lúc này toàn bộ vai trò và từ khóa MỚI ĐƯỢC LẬT MỞ
      const revealedSpy = finalState.players.find((p) => p.id === spyId)!;
      expect(revealedSpy.revealedRole).toBe('SPY');
      expect(revealedSpy.revealedWord).toBe(spyController.getSnapshot().mySecret?.word);

      const revealedCivilians = finalState.players.filter((p) => p.id !== spyId);
      for (const civ of revealedCivilians) {
        expect(civ.revealedRole).toBe('CIVILIAN');
        expect(civ.revealedWord).toBeTruthy();
      }
    }
  });
});
