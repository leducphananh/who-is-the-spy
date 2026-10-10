import { describe, it, expect } from 'vitest';
import {
  MockRealtimeHub,
  createMockSupabaseClient,
} from './mockSupabase.js';
import { SpyRoomController } from '../../src/client/network/SpyRoomController.js';

describe('Host Authority Peer Action Processing', () => {
  const setupGame = async (count = 4) => {
    const hub = new MockRealtimeHub();
    const clients = Array.from({ length: count }, (_, i) =>
      createMockSupabaseClient(hub, `p${i + 1}`)
    );
    const controllers = clients.map(
      (c, i) => new SpyRoomController(c, { id: `p${i + 1}`, name: `Player ${i + 1}` })
    );

    for (let i = 0; i < count; i++) {
      await controllers[i]!.joinRoom('AUTH_ROOM', (i + 1) * 100);
    }

    // Host bắt đầu game
    await controllers[0]!.startGame({ spyCount: 1, hasMrWhite: false });
    return { controllers, hub };
  };

  it('lượt mô tả: chỉ người đang có lượt mới được gọi nextTurn, người khác gọi sẽ bị từ chối', async () => {
    const { controllers } = await setupGame(4);
    const host = controllers[0]!;
    const guest1 = controllers[1]!;

    const publicState = host.getSnapshot().publicGameState!;
    expect(publicState.phase).toBe('DESCRIBING');

    const currentDescriber = publicState.players[publicState.currentDescriberIndex]!;
    const otherPlayer = controllers.find((c) => c.getSnapshot().localPlayerId !== currentDescriber.id)!;

    // Người KHÔNG CÓ LƯỢT cố tình gọi nextTurn
    await otherPlayer.nextTurn();
    // Vị trí người mô tả KHÔNG ĐỔI
    expect(host.getSnapshot().publicGameState!.currentDescriberIndex).toBe(
      publicState.currentDescriberIndex
    );

    // Người ĐANG CÓ LƯỢT gọi nextTurn
    const activeController = controllers.find((c) => c.getSnapshot().localPlayerId === currentDescriber.id)!;
    await activeController.nextTurn();

    // Vị trí chuyển sang người tiếp theo và đồng bộ đến tất cả client
    expect(host.getSnapshot().publicGameState!.currentDescriberIndex).toBe(
      publicState.currentDescriberIndex + 1
    );
    expect(guest1.getSnapshot().publicGameState!.currentDescriberIndex).toBe(
      publicState.currentDescriberIndex + 1
    );
  });

  it('bỏ phiếu: Host tự động kiểm phiếu (tallyVotes) khi tất cả người chơi còn sống đã bỏ phiếu', async () => {
    const { controllers } = await setupGame(3);

    // Cho 3 người mô tả xong để chuyển sang VOTING
    for (let i = 0; i < 3; i++) {
      const state = controllers[0]!.getSnapshot().publicGameState!;
      const describer = state.players[state.currentDescriberIndex]!;
      const ctrl = controllers.find((c) => c.getSnapshot().localPlayerId === describer.id)!;
      await ctrl.nextTurn();
    }

    // Đã chuyển sang phase VOTING
    expect(controllers[0]!.getSnapshot().publicGameState!.phase).toBe('VOTING');

    // 2 người đầu vote p3
    await controllers[0]!.castVote('p3');
    expect(controllers[0]!.getSnapshot().publicGameState!.phase).toBe('VOTING');

    await controllers[1]!.castVote('p3');
    expect(controllers[0]!.getSnapshot().publicGameState!.phase).toBe('VOTING');

    // Người thứ 3 vote p1 -> Đủ 3/3 phiếu -> Host tự động tallyVotes
    await controllers[2]!.castVote('p1');

    const finalState = controllers[0]!.getSnapshot().publicGameState!;
    expect(finalState.phase).not.toBe('VOTING');
    expect(finalState.lastVoteResult).not.toBeNull();
    expect(finalState.lastVoteResult?.eliminatedPlayerId).toBe('p3');

    // Toàn bộ client đều nhận được kết quả này
    for (const c of controllers) {
      expect(c.getSnapshot().publicGameState?.lastVoteResult?.eliminatedPlayerId).toBe('p3');
    }
  });

  it('chuyển round: Host xử lý proceedToNextRound và cập nhật roundNumber mới', async () => {
    const { controllers } = await setupGame(3);

    // 3 người mô tả -> VOTING
    for (let i = 0; i < 3; i++) {
      const state = controllers[0]!.getSnapshot().publicGameState!;
      const describer = state.players[state.currentDescriberIndex]!;
      const ctrl = controllers.find((c) => c.getSnapshot().localPlayerId === describer.id)!;
      await ctrl.nextTurn();
    }

    // Hòa phiếu: p1 vote p2, p2 vote p1, p3 vote p2 (khoan, để hòa thì p1 vote p2, p2 vote p1, p3 không vote hoặc vote p3?)
    // Bỏ phiếu hòa: p1 vote p2, p2 vote p1 (2 người 1 phiếu)
    await controllers[0]!.castVote('p2');
    await controllers[1]!.castVote('p1');
    await controllers[2]!.castVote('p3'); // Mỗi người 1 phiếu -> Hòa phiếu!

    const stateAfterVote = controllers[0]!.getSnapshot().publicGameState!;
    expect(stateAfterVote.phase).toBe('VOTE_RESULT');
    expect(stateAfterVote.lastVoteResult?.isTie).toBe(true);

    // Chuyển sang round tiếp theo
    await controllers[0]!.proceedToNextRound();

    const stateRound2 = controllers[0]!.getSnapshot().publicGameState!;
    expect(stateRound2.roundNumber).toBe(2);
    expect(stateRound2.phase).toBe('DESCRIBING');

    // Tất cả client đều nhận được roundNumber 2
    for (const c of controllers) {
      expect(c.getSnapshot().publicGameState?.roundNumber).toBe(2);
    }
  });
});
