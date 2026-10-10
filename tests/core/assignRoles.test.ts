import { describe, it, expect } from 'vitest';
import { createInitialGame, assignRolesAndWords } from '../../src/core/game.js';
import type { WordPair } from '../../src/core/types.js';

describe('Game Initialization and Role Assignment', () => {
  const sampleWordPair: WordPair = {
    id: 'wp-1',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  };

  const createPlayers = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Player ${i + 1}`,
    }));

  it('createInitialGame khởi tạo đúng trạng thái phòng LOBBY', () => {
    const players = createPlayers(4);
    const state = createInitialGame('ROOM99', players);

    expect(state.roomCode).toBe('ROOM99');
    expect(state.phase).toBe('LOBBY');
    expect(state.players).toHaveLength(4);
    expect(state.roundNumber).toBe(1);
    expect(state.currentDescriberIndex).toBe(0);
    expect(state.winner).toBeNull();
    expect(state.lastVoteResult).toBeNull();
    expect(state.eliminatedPlayerPendingMrWhiteGuess).toBeNull();

    for (const p of state.players) {
      expect(p.isAlive).toBe(true);
      expect(p.hasVoted).toBe(false);
      expect(p.voteTargetId).toBeNull();
    }
  });

  describe('assignRolesAndWords validations', () => {
    it('ném lỗi nếu số người chơi < 3 hoặc > 10', () => {
      const state2 = createInitialGame('R1', createPlayers(2));
      expect(() =>
        assignRolesAndWords(state2, { spyCount: 1, hasMrWhite: false }, sampleWordPair)
      ).toThrowError(/người chơi/i);

      const state11 = createInitialGame('R2', createPlayers(11));
      expect(() =>
        assignRolesAndWords(state11, { spyCount: 2, hasMrWhite: true }, sampleWordPair)
      ).toThrowError(/người chơi/i);
    });

    it('ném lỗi nếu spyCount < 1', () => {
      const state = createInitialGame('R1', createPlayers(4));
      expect(() =>
        assignRolesAndWords(state, { spyCount: 0, hasMrWhite: false }, sampleWordPair)
      ).toThrowError(/gián điệp/i);
    });

    it('ném lỗi nếu số kẻ ác (Spy + Mr. White) >= số Dân thường', () => {
      // 4 người chơi, 2 spy + 1 Mr White = 3 ác, 1 dân -> ác >= dân -> ném lỗi
      const state = createInitialGame('R1', createPlayers(4));
      expect(() =>
        assignRolesAndWords(state, { spyCount: 2, hasMrWhite: true }, sampleWordPair)
      ).toThrowError(/dân thường/i);

      // 4 người chơi, 2 spy + 0 Mr White = 2 ác, 2 dân -> ác >= dân -> ném lỗi
      expect(() =>
        assignRolesAndWords(state, { spyCount: 2, hasMrWhite: false }, sampleWordPair)
      ).toThrowError(/dân thường/i);
    });
  });

  describe('Phân bổ vai trò & từ khóa chính xác', () => {
    it('gán đúng tỉ lệ vai cho phòng 4 người (1 Spy, 0 Mr. White)', () => {
      const state = createInitialGame('R1', createPlayers(4));
      const nextState = assignRolesAndWords(
        state,
        { spyCount: 1, hasMrWhite: false },
        sampleWordPair
      );

      expect(nextState.phase).toBe('ROLE_REVEAL');
      expect(nextState.civilianWord).toBe(sampleWordPair.civilianWord);
      expect(nextState.spyWord).toBe(sampleWordPair.spyWord);

      const spies = nextState.players.filter((p) => p.role === 'SPY');
      const mrWhites = nextState.players.filter((p) => p.role === 'MR_WHITE');
      const civilians = nextState.players.filter((p) => p.role === 'CIVILIAN');

      expect(spies).toHaveLength(1);
      expect(mrWhites).toHaveLength(0);
      expect(civilians).toHaveLength(3);

      expect(spies[0]?.word).toBe(sampleWordPair.spyWord);
      civilians.forEach((c) => expect(c.word).toBe(sampleWordPair.civilianWord));
    });

    it('gán đúng tỉ lệ vai cho phòng 6 người (1 Spy, 1 Mr. White, 4 Dân)', () => {
      const state = createInitialGame('R1', createPlayers(6));
      const nextState = assignRolesAndWords(
        state,
        { spyCount: 1, hasMrWhite: true },
        sampleWordPair
      );

      const spies = nextState.players.filter((p) => p.role === 'SPY');
      const mrWhites = nextState.players.filter((p) => p.role === 'MR_WHITE');
      const civilians = nextState.players.filter((p) => p.role === 'CIVILIAN');

      expect(spies).toHaveLength(1);
      expect(mrWhites).toHaveLength(1);
      expect(civilians).toHaveLength(4);

      expect(spies[0]?.word).toBe(sampleWordPair.spyWord);
      expect(mrWhites[0]?.word).toBe('');
      civilians.forEach((c) => expect(c.word).toBe(sampleWordPair.civilianWord));
    });

    it('gán đúng tỉ lệ vai cho phòng 8 người (2 Spies, 1 Mr. White, 5 Dân)', () => {
      const state = createInitialGame('R1', createPlayers(8));
      const nextState = assignRolesAndWords(
        state,
        { spyCount: 2, hasMrWhite: true },
        sampleWordPair
      );

      const spies = nextState.players.filter((p) => p.role === 'SPY');
      const mrWhites = nextState.players.filter((p) => p.role === 'MR_WHITE');
      const civilians = nextState.players.filter((p) => p.role === 'CIVILIAN');

      expect(spies).toHaveLength(2);
      expect(mrWhites).toHaveLength(1);
      expect(civilians).toHaveLength(5);

      spies.forEach((s) => expect(s.word).toBe(sampleWordPair.spyWord));
      expect(mrWhites[0]?.word).toBe('');
      civilians.forEach((c) => expect(c.word).toBe(sampleWordPair.civilianWord));
    });

    it('xáo trộn ngẫu nhiên tất định với mock RNG', () => {
      const state = createInitialGame('R1', createPlayers(4));

      // Với mock RNG cố định không đổi vị trí
      const deterministicRng = () => 0;
      const nextState = assignRolesAndWords(
        state,
        { spyCount: 1, hasMrWhite: false },
        sampleWordPair,
        deterministicRng
      );

      // Tất cả người chơi ban đầu được bảo toàn danh tính
      expect(nextState.players.map((p) => p.id)).toEqual(['p-1', 'p-2', 'p-3', 'p-4']);
      // Không làm đột biến state ban đầu (immutability)
      expect(state.phase).toBe('LOBBY');
      expect(nextState.phase).toBe('ROLE_REVEAL');
    });
  });
});
