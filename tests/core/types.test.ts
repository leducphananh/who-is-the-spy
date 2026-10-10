import { describe, it, expect } from 'vitest';
import type {
  Role,
  GamePhase,
  GameWinner,
  WordPair,
  PlayerState,
  GameConfig,
  VoteResult,
  GameState,
} from '../../src/core/types.js';

describe('Core Types and Data Models', () => {
  it('should accept valid Role literals', () => {
    const roles: Role[] = ['CIVILIAN', 'SPY', 'MR_WHITE'];
    expect(roles).toHaveLength(3);
  });

  it('should accept valid GamePhase literals', () => {
    const phases: GamePhase[] = [
      'LOBBY',
      'ROLE_REVEAL',
      'DESCRIBING',
      'VOTING',
      'VOTE_RESULT',
      'MR_WHITE_GUESS',
      'GAME_OVER',
    ];
    expect(phases).toHaveLength(7);
  });

  it('should accept valid GameWinner literals', () => {
    const winners: GameWinner[] = ['CIVILIANS', 'SPIES', 'MR_WHITE', null];
    expect(winners).toHaveLength(4);
  });

  it('should structure WordPair and GameConfig correctly', () => {
    const wordPair: WordPair = {
      id: 'wp-1',
      civilianWord: 'Trà sữa',
      spyWord: 'Cà phê sữa',
      category: 'Ẩm thực',
    };
    expect(wordPair.id).toBe('wp-1');

    const config: GameConfig = {
      spyCount: 1,
      hasMrWhite: true,
    };
    expect(config.spyCount).toBe(1);
    expect(config.hasMrWhite).toBe(true);
  });

  it('should structure PlayerState correctly', () => {
    const player: PlayerState = {
      id: 'p1',
      name: 'Player 1',
      role: 'CIVILIAN',
      word: 'Trà sữa',
      isAlive: true,
      hasVoted: false,
      voteTargetId: null,
    };
    expect(player.isAlive).toBe(true);
    expect(player.voteTargetId).toBeNull();
  });

  it('should structure VoteResult and GameState correctly', () => {
    const voteResult: VoteResult = {
      isTie: true,
      eliminatedPlayerId: null,
      tiePlayerIds: ['p1', 'p2'],
      voteCounts: { p1: 2, p2: 2 },
    };

    const gameState: GameState = {
      roomCode: 'ABC123',
      players: [],
      phase: 'LOBBY',
      currentDescriberIndex: 0,
      roundNumber: 1,
      civilianWord: 'Trà sữa',
      spyWord: 'Cà phê sữa',
      winner: null,
      lastVoteResult: voteResult,
      eliminatedPlayerPendingMrWhiteGuess: null,
    };

    expect(gameState.roomCode).toBe('ABC123');
    expect(gameState.lastVoteResult?.isTie).toBe(true);
  });
});
