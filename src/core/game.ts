import type {
  GameState,
  GameConfig,
  PlayerState,
  WordPair,
  Role,
  VoteResult,
  GameWinner,
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

/**
 * Bắt đầu vòng mô tả: chuyển phase sang 'DESCRIBING' và trỏ vào người chơi còn sống đầu tiên.
 */
export function startDescribing(state: GameState): GameState {
  const firstAliveIndex = state.players.findIndex((p) => p.isAlive);
  const currentDescriberIndex = firstAliveIndex !== -1 ? firstAliveIndex : 0;

  return {
    ...state,
    phase: 'DESCRIBING',
    currentDescriberIndex,
  };
}

/**
 * Chuyển lượt mô tả sang người chơi còn sống tiếp theo.
 * Nếu đã duyệt qua tất cả người chơi còn sống trong vòng:
 * - Trả về `isRoundComplete: true`
 * - Chuyển sang phase 'VOTING'
 * - Reset trạng thái vote của mọi người chơi
 */
export function nextTurn(state: GameState): {
  newState: GameState;
  isRoundComplete: boolean;
} {
  const aliveIndices = state.players
    .map((p, idx) => (p.isAlive ? idx : -1))
    .filter((idx) => idx !== -1);

  if (aliveIndices.length === 0) {
    return {
      newState: state,
      isRoundComplete: true,
    };
  }

  const currentPosInAlive = aliveIndices.indexOf(state.currentDescriberIndex);

  // Nếu người hiện tại không có trong danh sách còn sống hoặc là người còn sống cuối cùng
  if (currentPosInAlive === -1 || currentPosInAlive === aliveIndices.length - 1) {
    // Hoàn tất vòng mô tả, chuyển sang VOTING
    const resetPlayers = state.players.map((p) => ({
      ...p,
      hasVoted: false,
      voteTargetId: null,
    }));

    return {
      newState: {
        ...state,
        phase: 'VOTING',
        players: resetPlayers,
      },
      isRoundComplete: true,
    };
  }

  // Chuyển sang người còn sống tiếp theo
  const nextDescriberIndex = aliveIndices[currentPosInAlive + 1]!;
  return {
    newState: {
      ...state,
      currentDescriberIndex: nextDescriberIndex,
    },
    isRoundComplete: false,
  };
}

/**
 * Bỏ phiếu kín chỉ định người chơi nghi vấn.
 */
export function castVote(
  state: GameState,
  voterId: string,
  targetId: string
): GameState {
  if (state.phase !== 'VOTING') {
    throw new Error('Chỉ có thể bỏ phiếu trong phase VOTING.');
  }

  const voter = state.players.find((p) => p.id === voterId);
  if (!voter || !voter.isAlive) {
    throw new Error('Người bỏ phiếu không tồn tại hoặc đã bị loại.');
  }

  const target = state.players.find((p) => p.id === targetId);
  if (!target || !target.isAlive) {
    throw new Error('Mục tiêu bị bỏ phiếu không tồn tại hoặc đã bị loại.');
  }

  const updatedPlayers = state.players.map((p) =>
    p.id === voterId ? { ...p, hasVoted: true, voteTargetId: targetId } : p
  );

  return {
    ...state,
    players: updatedPlayers,
  };
}

/**
 * Kiểm tra điều kiện thắng thua của ván đấu:
 * - Dân thường thắng ('CIVILIANS'): Toàn bộ Gián điệp và Mr. White đã bị loại.
 * - Gián điệp thắng ('SPIES'): Số lượng Gián điệp còn sống >= số Dân thường còn sống.
 * - Trận đấu tiếp tục: Trả về null.
 */
export function checkWinCondition(state: GameState): GameWinner {
  const aliveCivilians = state.players.filter(
    (p) => p.isAlive && p.role === 'CIVILIAN'
  ).length;
  const aliveSpies = state.players.filter(
    (p) => p.isAlive && p.role === 'SPY'
  ).length;
  const aliveMrWhite = state.players.filter(
    (p) => p.isAlive && p.role === 'MR_WHITE'
  ).length;

  // Dân thường thắng nếu hết Gián điệp và Mr. White
  if (aliveSpies === 0 && aliveMrWhite === 0) {
    return 'CIVILIANS';
  }

  // Gián điệp thắng nếu số Gián điệp >= số Dân thường
  if (aliveSpies >= aliveCivilians) {
    return 'SPIES';
  }

  return null;
}

/**
 * Kiểm phiếu bầu chọn người bị nghi vấn.
 * - Nếu hòa phiếu: không loại ai, isTie = true, phase = 'VOTE_RESULT'.
 * - Nếu đa số phiếu:
 *   + Nếu trúng Mr. White: chuyển phase sang 'MR_WHITE_GUESS' (chưa loại ngay).
 *   + Nếu trúng Civilian hoặc Spy: loại người chơi đó (isAlive = false), kiểm tra win condition.
 */
export function tallyVotes(
  state: GameState,
  explicitVotes?: Record<string, string>
): { newState: GameState; voteResult: VoteResult } {
  if (state.phase !== 'VOTING') {
    throw new Error('Chỉ có thể kiểm phiếu trong phase VOTING.');
  }

  // Khởi tạo bảng đếm phiếu cho tất cả người chơi còn sống
  const alivePlayers = state.players.filter((p) => p.isAlive);
  const voteCounts: Record<string, number> = {};
  for (const p of alivePlayers) {
    voteCounts[p.id] = 0;
  }

  // Thu thập phiếu hợp lệ
  if (explicitVotes) {
    for (const [voterId, targetId] of Object.entries(explicitVotes)) {
      const voter = state.players.find((p) => p.id === voterId);
      const target = state.players.find((p) => p.id === targetId);
      if (voter && voter.isAlive && target && target.isAlive) {
        voteCounts[targetId] = (voteCounts[targetId] ?? 0) + 1;
      }
    }
  } else {
    for (const player of alivePlayers) {
      if (player.hasVoted && player.voteTargetId) {
        const target = state.players.find((p) => p.id === player.voteTargetId);
        if (target && target.isAlive) {
          voteCounts[target.id] = (voteCounts[target.id] ?? 0) + 1;
        }
      }
    }
  }

  // Tìm số phiếu cao nhất
  const counts = Object.values(voteCounts);
  const maxVotes = counts.length > 0 ? Math.max(...counts) : 0;
  const topCandidates = alivePlayers.filter(
    (p) => (voteCounts[p.id] ?? 0) === maxVotes && maxVotes > 0
  );

  // Trường hợp hòa phiếu: maxVotes === 0 hoặc >= 2 người cùng đứng đầu
  if (maxVotes === 0 || topCandidates.length >= 2) {
    const voteResult: VoteResult = {
      isTie: true,
      eliminatedPlayerId: null,
      tiePlayerIds: topCandidates.map((p) => p.id),
      voteCounts,
    };

    return {
      newState: {
        ...state,
        phase: 'VOTE_RESULT',
        lastVoteResult: voteResult,
        eliminatedPlayerPendingMrWhiteGuess: null,
      },
      voteResult,
    };
  }

  // Trường hợp có 1 người duy nhất đạt đa số phiếu
  const eliminatedPlayer = topCandidates[0]!;
  const voteResult: VoteResult = {
    isTie: false,
    eliminatedPlayerId: eliminatedPlayer.id,
    tiePlayerIds: [eliminatedPlayer.id],
    voteCounts,
  };

  // Nếu người bị vote là MR_WHITE -> chuyển sang MR_WHITE_GUESS
  if (eliminatedPlayer.role === 'MR_WHITE') {
    return {
      newState: {
        ...state,
        phase: 'MR_WHITE_GUESS',
        lastVoteResult: voteResult,
        eliminatedPlayerPendingMrWhiteGuess: eliminatedPlayer.id,
      },
      voteResult,
    };
  }

  // Nếu người bị vote là CIVILIAN hoặc SPY -> đánh dấu chết và kiểm tra win condition
  const playersWithDead = state.players.map((p) =>
    p.id === eliminatedPlayer.id ? { ...p, isAlive: false } : p
  );

  const potentialNewState: GameState = {
    ...state,
    players: playersWithDead,
    lastVoteResult: voteResult,
    eliminatedPlayerPendingMrWhiteGuess: null,
  };

  const winner = checkWinCondition(potentialNewState);

  return {
    newState: {
      ...potentialNewState,
      phase: winner ? 'GAME_OVER' : 'VOTE_RESULT',
      winner,
    },
    voteResult,
  };
}


