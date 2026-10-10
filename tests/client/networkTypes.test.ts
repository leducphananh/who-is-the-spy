import { describe, it, expect } from 'vitest';
import type {
  PlayerPresence,
  PublicPlayerState,
  PublicGameState,
  SecretWordPayload,
  PlayerAction,
  RoomStateSnapshot,
} from '../../src/client/network/types.js';
import { toPublicGameState } from '../../src/client/network/types.js';
import type { GameState } from '../../src/core/types.js';

describe('Network Protocol & Data Types', () => {
  it('định nghĩa đúng các kiểu dữ liệu mạng', () => {
    const presence: PlayerPresence = {
      id: 'p1',
      name: 'Alice',
      avatar: 'avatar_1',
      isHost: true,
      isReady: true,
      joinedAt: 1700000000,
      isAlive: true,
    };
    expect(presence.isHost).toBe(true);

    const publicPlayer: PublicPlayerState = {
      id: 'p1',
      name: 'Alice',
      avatar: 'avatar_1',
      isAlive: true,
      hasVoted: false,
    };
    expect(publicPlayer.revealedRole).toBeUndefined();
    expect(publicPlayer.revealedWord).toBeUndefined();

    const secret: SecretWordPayload = {
      role: 'SPY',
      word: 'Cà phê sữa',
    };
    expect(secret.role).toBe('SPY');

    const action: PlayerAction = {
      type: 'START_GAME',
      config: { spyCount: 1, hasMrWhite: false },
    };
    expect(action.type).toBe('START_GAME');

    const snapshot: RoomStateSnapshot = {
      roomCode: 'ABC',
      localPlayerId: 'p1',
      localPlayerName: 'Alice',
      isHost: true,
      isConnected: true,
      presenceList: [presence],
      publicGameState: null,
      mySecret: secret,
      error: null,
    };
    expect(snapshot.isConnected).toBe(true);
  });

  it('toPublicGameState loại bỏ hoàn toàn role và word của tất cả người chơi khi ván đấu chưa kết thúc (Zero-Knowledge)', () => {
    const rawState: GameState = {
      roomCode: 'XYZ123',
      phase: 'DESCRIBING',
      roundNumber: 1,
      currentDescriberIndex: 0,
      civilianWord: 'Trà sữa',
      spyWord: 'Cà phê sữa',
      winner: null,
      lastVoteResult: null,
      eliminatedPlayerPendingMrWhiteGuess: null,
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          role: 'SPY',
          word: 'Cà phê sữa',
          isAlive: true,
          hasVoted: false,
          voteTargetId: null,
        },
        {
          id: 'p2',
          name: 'Player 2',
          role: 'CIVILIAN',
          word: 'Trà sữa',
          isAlive: true,
          hasVoted: false,
          voteTargetId: null,
        },
      ],
    };

    const presences: PlayerPresence[] = [
      { id: 'p1', name: 'Player 1', avatar: 'av1', isHost: true, isReady: true, joinedAt: 1, isAlive: true },
      { id: 'p2', name: 'Player 2', avatar: 'av2', isHost: false, isReady: true, joinedAt: 2, isAlive: true },
    ];

    const publicState: PublicGameState = toPublicGameState(rawState, presences);

    expect(publicState.roomCode).toBe('XYZ123');
    expect(publicState.phase).toBe('DESCRIBING');
    // KHÔNG tồn tại civilianWord hay spyWord trên PublicGameState
    expect((publicState as unknown as Record<string, unknown>)['civilianWord']).toBeUndefined();
    expect((publicState as unknown as Record<string, unknown>)['spyWord']).toBeUndefined();

    for (const p of publicState.players) {
      expect(p.revealedRole).toBeUndefined();
      expect(p.revealedWord).toBeUndefined();
    }
  });

  it('toPublicGameState chỉ tiết lộ role và word khi phase là GAME_OVER', () => {
    const rawState: GameState = {
      roomCode: 'XYZ123',
      phase: 'GAME_OVER',
      roundNumber: 2,
      currentDescriberIndex: 0,
      civilianWord: 'Trà sữa',
      spyWord: 'Cà phê sữa',
      winner: 'CIVILIANS',
      lastVoteResult: null,
      eliminatedPlayerPendingMrWhiteGuess: null,
      players: [
        {
          id: 'p1',
          name: 'Player 1',
          role: 'SPY',
          word: 'Cà phê sữa',
          isAlive: false,
          hasVoted: false,
          voteTargetId: null,
        },
      ],
    };

    const publicState = toPublicGameState(rawState, []);
    expect(publicState.phase).toBe('GAME_OVER');
    expect(publicState.players[0]?.revealedRole).toBe('SPY');
    expect(publicState.players[0]?.revealedWord).toBe('Cà phê sữa');
  });
});
