import { describe, it, expect } from 'vitest';
import {
  createInitialGame,
  assignRolesAndWords,
  tallyVotes,
  submitMrWhiteGuess,
  checkWinCondition,
  proceedToNextRound,
} from '../../src/core/game.js';
import type { WordPair, GameState } from '../../src/core/types.js';

describe('Mr. White Guess and Win Conditions', () => {
  const sampleWordPair: WordPair = {
    id: 'wp-1',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  };

  const setupGameWithRoles = (
    playerCount: number,
    spyCount: number,
    hasMrWhite: boolean
  ): GameState => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    const lobby = createInitialGame('ROOM1', players);
    return assignRolesAndWords(
      lobby,
      { spyCount, hasMrWhite },
      sampleWordPair,
      () => 0
    );
  };

  describe('checkWinCondition', () => {
    it('Dân thường thắng khi sạch bóng Gián điệp và Mr. White', () => {
      const state = setupGameWithRoles(4, 1, false);
      // Giết spy duy nhất
      const allCivilianState: GameState = {
        ...state,
        players: state.players.map((p) =>
          p.role === 'SPY' ? { ...p, isAlive: false } : p
        ),
      };

      expect(checkWinCondition(allCivilianState)).toBe('CIVILIANS');
    });

    it('Gián điệp thắng khi số Gián điệp >= số Dân thường', () => {
      const state = setupGameWithRoles(4, 1, false);
      // Giết bớt dân để còn 1 dân và 1 gián điệp
      const civilians = state.players.filter((p) => p.role === 'CIVILIAN');
      const deadCivilians = civilians.slice(0, 2).map((c) => c.id);

      const spyEqualState: GameState = {
        ...state,
        players: state.players.map((p) =>
          deadCivilians.includes(p.id) ? { ...p, isAlive: false } : p
        ),
      };

      // 1 Spy, 1 Civilian -> Gián điệp thắng
      expect(checkWinCondition(spyEqualState)).toBe('SPIES');
    });

    it('Trận đấu tiếp tục (null) khi phe ác chưa bị diệt hết và chưa áp đảo dân', () => {
      // 3 Dân, 1 Gián điệp, 1 Mr. White
      const state = setupGameWithRoles(5, 1, true);
      expect(checkWinCondition(state)).toBeNull();
    });
  });

  describe('submitMrWhiteGuess', () => {
    const setupMrWhiteGuessState = () => {
      const state = setupGameWithRoles(5, 1, true);
      const mrWhite = state.players.find((p) => p.role === 'MR_WHITE')!;

      // Cho tất cả vote Mr. White
      const votes: Record<string, string> = {};
      state.players
        .filter((p) => p.id !== mrWhite.id)
        .forEach((p) => {
          votes[p.id] = mrWhite.id;
        });

      const votingState: GameState = { ...state, phase: 'VOTING' };
      const { newState } = tallyVotes(votingState, votes);
      return { state: newState, mrWhiteId: mrWhite.id };
    };

    it('Mr. White đoán ĐÚNG từ khóa dân thường -> Mr. White THẮNG lập tức', () => {
      const { state, mrWhiteId } = setupMrWhiteGuessState();
      expect(state.phase).toBe('MR_WHITE_GUESS');

      // Đoán đúng, có thể khác chữ hoa/thường hoặc thừa khoảng trắng
      const guessedState = submitMrWhiteGuess(state, mrWhiteId, '  TRÀ SỮA  ');

      expect(guessedState.phase).toBe('GAME_OVER');
      expect(guessedState.winner).toBe('MR_WHITE');
      expect(guessedState.eliminatedPlayerPendingMrWhiteGuess).toBeNull();
    });

    it('Mr. White đoán SAI từ khóa -> Mr. White bị loại (isAlive = false)', () => {
      const { state, mrWhiteId } = setupMrWhiteGuessState();

      const guessedState = submitMrWhiteGuess(state, mrWhiteId, 'Cà phê đá');

      expect(guessedState.winner).toBeNull(); // Còn 1 spy và 3 civilian
      expect(guessedState.phase).toBe('VOTE_RESULT');
      expect(guessedState.eliminatedPlayerPendingMrWhiteGuess).toBeNull();

      const mrWhite = guessedState.players.find((p) => p.id === mrWhiteId);
      expect(mrWhite?.isAlive).toBe(false);
    });

    it('Mr. White đoán SAI và sau khi chết hết kẻ ác -> Dân thường thắng cuộc', () => {
      // Giả sử trước đó Spy đã chết, chỉ còn Mr. White
      const { state, mrWhiteId } = setupMrWhiteGuessState();
      const stateWithDeadSpy: GameState = {
        ...state,
        players: state.players.map((p) =>
          p.role === 'SPY' ? { ...p, isAlive: false } : p
        ),
      };

      const guessedState = submitMrWhiteGuess(stateWithDeadSpy, mrWhiteId, 'Trà đào');

      expect(guessedState.phase).toBe('GAME_OVER');
      expect(guessedState.winner).toBe('CIVILIANS');
    });

    it('ném lỗi nếu không phải phase MR_WHITE_GUESS hoặc sai playerId', () => {
      const { state, mrWhiteId } = setupMrWhiteGuessState();
      const wrongPhaseState: GameState = { ...state, phase: 'VOTING' };

      expect(() =>
        submitMrWhiteGuess(wrongPhaseState, mrWhiteId, 'Trà sữa')
      ).toThrowError(/phase/i);

      expect(() =>
        submitMrWhiteGuess(state, 'wrong-player-id', 'Trà sữa')
      ).toThrowError(/mr\. white/i);
    });
  });

  describe('proceedToNextRound', () => {
    it('chuyển từ VOTE_RESULT sang DESCRIBING round tiếp theo', () => {
      const state = setupGameWithRoles(4, 1, false);
      const voteResultState: GameState = {
        ...state,
        phase: 'VOTE_RESULT',
        roundNumber: 1,
        players: state.players.map((p, idx) =>
          idx === 0 ? { ...p, hasVoted: true, voteTargetId: 'p-2' } : p
        ),
      };

      const nextRoundState = proceedToNextRound(voteResultState);

      expect(nextRoundState.phase).toBe('DESCRIBING');
      expect(nextRoundState.roundNumber).toBe(2);
      expect(nextRoundState.currentDescriberIndex).toBe(0);

      // Đã reset vote
      for (const p of nextRoundState.players) {
        expect(p.hasVoted).toBe(false);
        expect(p.voteTargetId).toBeNull();
      }
    });

    it('ném lỗi nếu phase đã GAME_OVER', () => {
      const state = setupGameWithRoles(4, 1, false);
      const gameOverState: GameState = {
        ...state,
        phase: 'GAME_OVER',
        winner: 'CIVILIANS',
      };

      expect(() => proceedToNextRound(gameOverState)).toThrowError(/kết thúc/i);
    });
  });
});
