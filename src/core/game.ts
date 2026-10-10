import type {
  GameState,
  GameConfig,
  PlayerState,
  WordPair,
  Role,
} from './types.js';

/**
 * Khởi tạo trạng thái phòng chơi ban đầu ở giai đoạn LOBBY.
 */
export function createInitialGame(
  roomCode: string,
  players: { id: string; name: string }[]
): GameState {
  const initialPlayers: PlayerState[] = players.map((p) => ({
    id: p.id,
    name: p.name,
    role: 'CIVILIAN',
    word: '',
    isAlive: true,
    hasVoted: false,
    voteTargetId: null,
  }));

  return {
    roomCode,
    players: initialPlayers,
    phase: 'LOBBY',
    currentDescriberIndex: 0,
    roundNumber: 1,
    civilianWord: '',
    spyWord: '',
    winner: null,
    lastVoteResult: null,
    eliminatedPlayerPendingMrWhiteGuess: null,
  };
}

/**
 * Gán vai trò và từ khóa bí mật cho từng người chơi.
 * Sử dụng Fisher-Yates shuffle với RNG Dependency Injection để đảm bảo tính tất định khi kiểm thử.
 */
export function assignRolesAndWords(
  state: GameState,
  config: GameConfig,
  wordPair: WordPair,
  rng: () => number = Math.random
): GameState {
  const playerCount = state.players.length;

  if (playerCount < 3 || playerCount > 10) {
    throw new Error('Số người chơi phải từ 3 đến 10 người.');
  }

  if (config.spyCount < 1) {
    throw new Error('Số lượng gián điệp tối thiểu là 1.');
  }

  const evilCount = config.spyCount + (config.hasMrWhite ? 1 : 0);
  const civilianCount = playerCount - evilCount;

  if (evilCount >= civilianCount) {
    throw new Error(
      `Tổng số kẻ ác (${evilCount}) phải nhỏ hơn số dân thường (${civilianCount}).`
    );
  }

  // Tạo danh sách vai trò
  const rolePool: Role[] = [];
  for (let i = 0; i < config.spyCount; i++) {
    rolePool.push('SPY');
  }
  if (config.hasMrWhite) {
    rolePool.push('MR_WHITE');
  }
  for (let i = 0; i < civilianCount; i++) {
    rolePool.push('CIVILIAN');
  }

  // Fisher-Yates Shuffle
  const shuffledRoles = [...rolePool];
  for (let i = shuffledRoles.length - 1; i > 0; i--) {
    const rawRng = rng();
    const clampedRng = Math.max(0, Math.min(0.999999999999, rawRng));
    const j = Math.floor(clampedRng * (i + 1));
    const current = shuffledRoles[i]!;
    const target = shuffledRoles[j]!;
    shuffledRoles[i] = target;
    shuffledRoles[j] = current;
  }

  const updatedPlayers: PlayerState[] = state.players.map((player, index) => {
    const role = shuffledRoles[index]!;
    const word =
      role === 'SPY'
        ? wordPair.spyWord
        : role === 'CIVILIAN'
          ? wordPair.civilianWord
          : '';

    return {
      ...player,
      role,
      word,
      isAlive: true,
      hasVoted: false,
      voteTargetId: null,
    };
  });

  return {
    ...state,
    players: updatedPlayers,
    phase: 'ROLE_REVEAL',
    roundNumber: 1,
    currentDescriberIndex: 0,
    civilianWord: wordPair.civilianWord,
    spyWord: wordPair.spyWord,
    winner: null,
    lastVoteResult: null,
    eliminatedPlayerPendingMrWhiteGuess: null,
  };
}
