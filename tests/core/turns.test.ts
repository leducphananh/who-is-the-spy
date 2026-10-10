import { describe, it, expect } from 'vitest';
import {
  createInitialGame,
  assignRolesAndWords,
  startDescribing,
  nextTurn,
} from '../../src/core/game.js';
import type { WordPair } from '../../src/core/types.js';

describe('Describing Phase and Turn Transitions', () => {
  const sampleWordPair: WordPair = {
    id: 'wp-1',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  };

  const setupGame = (playerCount: number = 4) => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    const lobby = createInitialGame('ROOM1', players);
    return assignRolesAndWords(
      lobby,
      { spyCount: 1, hasMrWhite: false },
      sampleWordPair,
      () => 0
    );
  };

  it('startDescribing chuyển trạng thái sang DESCRIBING và chọn người còn sống đầu tiên', () => {
    const state = setupGame(4);
    const describingState = startDescribing(state);

    expect(describingState.phase).toBe('DESCRIBING');
    expect(describingState.currentDescriberIndex).toBe(0);
    expect(describingState.players[0]?.isAlive).toBe(true);
  });

  it('startDescribing bỏ qua người chơi đầu tiên nếu người đó đã chết', () => {
    const state = setupGame(4);
    // Giả sử p-1 đã bị loại
    const modifiedState = {
      ...state,
      players: state.players.map((p, idx) => (idx === 0 ? { ...p, isAlive: false } : p)),
    };

    const describingState = startDescribing(modifiedState);
    expect(describingState.phase).toBe('DESCRIBING');
    expect(describingState.currentDescriberIndex).toBe(1);
    expect(describingState.players[1]?.isAlive).toBe(true);
  });

  it('nextTurn chuyển tuần tự qua các người chơi còn sống', () => {
    const state = startDescribing(setupGame(4));
    expect(state.currentDescriberIndex).toBe(0);

    // Chuyển sang người 1
    const turn1 = nextTurn(state);
    expect(turn1.isRoundComplete).toBe(false);
    expect(turn1.newState.currentDescriberIndex).toBe(1);

    // Chuyển sang người 2
    const turn2 = nextTurn(turn1.newState);
    expect(turn2.isRoundComplete).toBe(false);
    expect(turn2.newState.currentDescriberIndex).toBe(2);

    // Chuyển sang người 3
    const turn3 = nextTurn(turn2.newState);
    expect(turn3.isRoundComplete).toBe(false);
    expect(turn3.newState.currentDescriberIndex).toBe(3);
  });

  it('nextTurn tự động bỏ qua người chơi đã chết ở giữa vòng', () => {
    const state = setupGame(4);
    // Giết player index 1 (p-2)
    const stateWithDead = {
      ...state,
      players: state.players.map((p, idx) => (idx === 1 ? { ...p, isAlive: false } : p)),
    };
    const activeState = startDescribing(stateWithDead);
    expect(activeState.currentDescriberIndex).toBe(0);

    // Người tiếp theo phải là index 2, bỏ qua index 1
    const turn1 = nextTurn(activeState);
    expect(turn1.isRoundComplete).toBe(false);
    expect(turn1.newState.currentDescriberIndex).toBe(2);
  });

  it('nextTurn khi đi hết tất cả người chơi còn sống thì hoàn tất vòng và chuyển sang VOTING', () => {
    let state = startDescribing(setupGame(3));
    // 3 người: index 0, 1, 2

    const step1 = nextTurn(state); // sang index 1
    expect(step1.isRoundComplete).toBe(false);
    expect(step1.newState.currentDescriberIndex).toBe(1);

    const step2 = nextTurn(step1.newState); // sang index 2
    expect(step2.isRoundComplete).toBe(false);
    expect(step2.newState.currentDescriberIndex).toBe(2);

    const finalStep = nextTurn(step2.newState); // hết vòng!
    expect(finalStep.isRoundComplete).toBe(true);
    expect(finalStep.newState.phase).toBe('VOTING');

    // Tất cả người chơi được reset trạng thái vote
    for (const p of finalStep.newState.players) {
      expect(p.hasVoted).toBe(false);
      expect(p.voteTargetId).toBeNull();
    }
  });
});
