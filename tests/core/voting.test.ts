import { describe, it, expect } from 'vitest';
import {
  createInitialGame,
  assignRolesAndWords,
  castVote,
  tallyVotes,
} from '../../src/core/game.js';
import type { WordPair, GameState } from '../../src/core/types.js';

describe('Voting and Tallying', () => {
  const sampleWordPair: WordPair = {
    id: 'wp-1',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  };

  const setupVotingGame = (playerCount: number = 4, hasMrWhite: boolean = false): GameState => {
    const players = Array.from({ length: playerCount }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Player ${i + 1}`,
    }));
    const lobby = createInitialGame('ROOM1', players);
    const assigned = assignRolesAndWords(
      lobby,
      { spyCount: 1, hasMrWhite },
      sampleWordPair,
      () => 0
    );
    // Chuyển sang phase VOTING
    return {
      ...assigned,
      phase: 'VOTING',
    };
  };

  describe('castVote validations', () => {
    it('ghi nhận phiếu bầu hợp lệ giữa các người chơi còn sống', () => {
      const state = setupVotingGame(4);
      const votedState = castVote(state, 'p-1', 'p-2');

      const voter = votedState.players.find((p) => p.id === 'p-1');
      expect(voter?.hasVoted).toBe(true);
      expect(voter?.voteTargetId).toBe('p-2');
    });

    it('ném lỗi nếu không phải phase VOTING', () => {
      const state = { ...setupVotingGame(4), phase: 'DESCRIBING' as const };
      expect(() => castVote(state, 'p-1', 'p-2')).toThrowError(/phase/i);
    });

    it('ném lỗi nếu người vote đã chết hoặc không tồn tại', () => {
      const state = setupVotingGame(4);
      const deadVoterState = {
        ...state,
        players: state.players.map((p) => (p.id === 'p-1' ? { ...p, isAlive: false } : p)),
      };
      expect(() => castVote(deadVoterState, 'p-1', 'p-2')).toThrowError(/người bỏ phiếu/i);
      expect(() => castVote(state, 'non-existent', 'p-2')).toThrowError(/người bỏ phiếu/i);
    });

    it('ném lỗi nếu mục tiêu vote đã chết hoặc không tồn tại', () => {
      const state = setupVotingGame(4);
      const deadTargetState = {
        ...state,
        players: state.players.map((p) => (p.id === 'p-2' ? { ...p, isAlive: false } : p)),
      };
      expect(() => castVote(deadTargetState, 'p-1', 'p-2')).toThrowError(/mục tiêu/i);
      expect(() => castVote(state, 'p-1', 'non-existent')).toThrowError(/mục tiêu/i);
    });
  });

  describe('tallyVotes logic', () => {
    it('loại người nhận đa số phiếu phạt (Majority vote)', () => {
      let state = setupVotingGame(4);
      // p-1, p-2, p-3 cùng vote p-4 (3 phiếu)
      // p-4 vote p-1 (1 phiếu)
      state = castVote(state, 'p-1', 'p-4');
      state = castVote(state, 'p-2', 'p-4');
      state = castVote(state, 'p-3', 'p-4');
      state = castVote(state, 'p-4', 'p-1');

      const { newState, voteResult } = tallyVotes(state);

      expect(voteResult.isTie).toBe(false);
      expect(voteResult.eliminatedPlayerId).toBe('p-4');
      expect(voteResult.voteCounts['p-4']).toBe(3);
      expect(voteResult.voteCounts['p-1']).toBe(1);

      const eliminatedPlayer = newState.players.find((p) => p.id === 'p-4');
      expect(eliminatedPlayer?.isAlive).toBe(false);
    });

    it('hỗ trợ kiểm phiếu bằng explicitVotes record truyền vào', () => {
      const state = setupVotingGame(4);
      const explicitVotes = {
        'p-1': 'p-3',
        'p-2': 'p-3',
        'p-3': 'p-1',
        'p-4': 'p-3',
      };

      const { newState, voteResult } = tallyVotes(state, explicitVotes);
      expect(voteResult.isTie).toBe(false);
      expect(voteResult.eliminatedPlayerId).toBe('p-3');
      expect(newState.players.find((p) => p.id === 'p-3')?.isAlive).toBe(false);
    });

    it('khi hòa phiếu: không loại ai, isTie = true, chuyển sang VOTE_RESULT', () => {
      let state = setupVotingGame(4);
      // p-1 & p-2 vote p-3 (2 phiếu)
      // p-3 & p-4 vote p-2 (2 phiếu)
      state = castVote(state, 'p-1', 'p-3');
      state = castVote(state, 'p-2', 'p-3');
      state = castVote(state, 'p-3', 'p-2');
      state = castVote(state, 'p-4', 'p-2');

      const { newState, voteResult } = tallyVotes(state);

      expect(voteResult.isTie).toBe(true);
      expect(voteResult.eliminatedPlayerId).toBeNull();
      expect(voteResult.tiePlayerIds).toEqual(expect.arrayContaining(['p-2', 'p-3']));
      expect(newState.phase).toBe('VOTE_RESULT');
      expect(newState.lastVoteResult).toEqual(voteResult);

      // Tất cả 4 người chơi vẫn còn sống nguyên vẹn!
      expect(newState.players.filter((p) => p.isAlive)).toHaveLength(4);
    });

    it('khi không ai bỏ phiếu: coi như hòa phiếu và không loại ai', () => {
      const state = setupVotingGame(4);
      const { newState, voteResult } = tallyVotes(state);

      expect(voteResult.isTie).toBe(true);
      expect(voteResult.eliminatedPlayerId).toBeNull();
      expect(newState.players.filter((p) => p.isAlive)).toHaveLength(4);
      expect(newState.phase).toBe('VOTE_RESULT');
    });

    it('nếu người bị vote nhiều nhất là MR_WHITE: không loại ngay mà chuyển sang MR_WHITE_GUESS', () => {
      // Setup game 5 người có Mr. White
      const state = setupVotingGame(5, true);
      const mrWhite = state.players.find((p) => p.role === 'MR_WHITE')!;
      expect(mrWhite).toBeDefined();

      const otherPlayers = state.players.filter((p) => p.id !== mrWhite.id);

      // Tất cả người khác vote Mr. White
      const votes: Record<string, string> = {};
      otherPlayers.forEach((p) => {
        votes[p.id] = mrWhite.id;
      });

      const { newState, voteResult } = tallyVotes(state, votes);

      expect(voteResult.isTie).toBe(false);
      expect(voteResult.eliminatedPlayerId).toBe(mrWhite.id);
      expect(newState.phase).toBe('MR_WHITE_GUESS');
      expect(newState.eliminatedPlayerPendingMrWhiteGuess).toBe(mrWhite.id);

      // Mr. White tạm thời chưa chết hẳn, chờ đoán từ
      const mrWhiteInNewState = newState.players.find((p) => p.id === mrWhite.id);
      expect(mrWhiteInNewState?.isAlive).toBe(true);
    });
  });
});
