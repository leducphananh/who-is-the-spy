export type Role = 'CIVILIAN' | 'SPY' | 'MR_WHITE';

export type GamePhase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'DESCRIBING'
  | 'VOTING'
  | 'VOTE_RESULT'
  | 'MR_WHITE_GUESS'
  | 'GAME_OVER';

export type GameWinner = 'CIVILIANS' | 'SPIES' | 'MR_WHITE' | null;

export interface WordPair {
  id: string;
  civilianWord: string;
  spyWord: string;
  category: string;
}

export interface PlayerState {
  id: string;
  name: string;
  role: Role;
  word: string;
  isAlive: boolean;
  hasVoted: boolean;
  voteTargetId: string | null;
}

export interface GameConfig {
  spyCount: number;
  hasMrWhite: boolean;
}

export interface VoteResult {
  isTie: boolean;
  eliminatedPlayerId: string | null;
  tiePlayerIds: string[];
  voteCounts: Record<string, number>;
}

export interface GameState {
  roomCode: string;
  players: PlayerState[];
  phase: GamePhase;
  currentDescriberIndex: number;
  roundNumber: number;
  civilianWord: string;
  spyWord: string;
  winner: GameWinner;
  lastVoteResult: VoteResult | null;
  eliminatedPlayerPendingMrWhiteGuess: string | null;
}
