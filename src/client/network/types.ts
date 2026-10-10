import type {
  Role,
  GamePhase,
  GameWinner,
  VoteResult,
  GameConfig,
  GameState,
} from '../../core/types.js';

export interface PlayerPresence {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  joinedAt: number;
  isAlive: boolean;
}

export interface PublicPlayerState {
  id: string;
  name: string;
  avatar: string;
  isAlive: boolean;
  hasVoted: boolean;
  voteTargetId?: string | null;
  // Chỉ tiết lộ khi phase === 'GAME_OVER'
  revealedRole?: Role;
  revealedWord?: string;
}

export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  roundNumber: number;
  currentDescriberIndex: number;
  players: PublicPlayerState[];
  winner: GameWinner;
  lastVoteResult: VoteResult | null;
  isPausedForHostReconnect: boolean;
  hostReconnectSecondsRemaining: number;
}

export interface SecretWordPayload {
  role: Role;
  word: string;
}

export type PlayerAction =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'NEXT_DESCRIBE'; playerId: string }
  | { type: 'SUBMIT_VOTE'; voterId: string; targetId: string }
  | { type: 'MR_WHITE_GUESS'; playerId: string; guess: string }
  | { type: 'PROCEED_ROUND'; playerId: string };

export interface RoomStateSnapshot {
  roomCode: string;
  localPlayerId: string;
  localPlayerName: string;
  isHost: boolean;
  isConnected: boolean;
  presenceList: PlayerPresence[];
  publicGameState: PublicGameState | null;
  mySecret: SecretWordPayload | null;
  error: string | null;
}

/**
 * Chuyển đổi trạng thái Authoritative sang PublicGameState.
 * Đảm bảo nguyên tắc ZERO-KNOWLEDGE:
 * - Khi ván đấu đang diễn ra: hoàn toàn không phát tán role, word, civilianWord, spyWord.
 * - Khi ván đấu kết thúc (GAME_OVER): mới đính kèm revealedRole và revealedWord cho từng người.
 */
export function toPublicGameState(
  state: GameState,
  presences: PlayerPresence[],
  isPausedForHostReconnect: boolean = false,
  hostReconnectSecondsRemaining: number = 0
): PublicGameState {
  const avatarMap = new Map(presences.map((p) => [p.id, p.avatar]));
  const isGameOver = state.phase === 'GAME_OVER';

  const publicPlayers: PublicPlayerState[] = state.players.map((p) => {
    const publicPlayer: PublicPlayerState = {
      id: p.id,
      name: p.name,
      avatar: avatarMap.get(p.id) ?? 'avatar_default',
      isAlive: p.isAlive,
      hasVoted: p.hasVoted,
      voteTargetId: p.voteTargetId,
    };

    if (isGameOver) {
      publicPlayer.revealedRole = p.role;
      publicPlayer.revealedWord = p.word;
    }

    return publicPlayer;
  });

  return {
    roomCode: state.roomCode,
    phase: state.phase,
    roundNumber: state.roundNumber,
    currentDescriberIndex: state.currentDescriberIndex,
    players: publicPlayers,
    winner: state.winner,
    lastVoteResult: state.lastVoteResult,
    isPausedForHostReconnect,
    hostReconnectSecondsRemaining,
  };
}
