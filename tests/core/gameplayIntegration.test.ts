import { describe, it, expect } from 'vitest';
import {
  createInitialGame,
  assignRolesAndWords,
  startDescribing,
  nextTurn,
  castVote,
  tallyVotes,
  submitMrWhiteGuess,
  proceedToNextRound,
} from '../../src/core/game.js';
import type { WordPair } from '../../src/core/types.js';

describe('Gameplay Integration Suite - E2E Match Simulations', () => {
  const matchWordPair: WordPair = {
    id: 'wp-match-1',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  };

  it('Kịch bản 1: Trọn vẹn trận đấu 6 người (Hòa phiếu R1 -> Mr White chết R2 -> Dân diệt Spy R3 thắng)', () => {
    const players = [
      { id: 'p1', name: 'An (Civilian)' },
      { id: 'p2', name: 'Bình (Civilian)' },
      { id: 'p3', name: 'Cường (Civilian)' },
      { id: 'p4', name: 'Dung (Civilian)' },
      { id: 'p5', name: 'Giang (Spy)' },
      { id: 'p6', name: 'Huy (Mr. White)' },
    ];

    // 1. Tạo phòng LOBBY
    let game = createInitialGame('ROOM66', players);
    expect(game.phase).toBe('LOBBY');

    // 2. Gán vai trò (dùng mock RNG để phân phối thứ tự: p5 là Spy, p6 là Mr White, p1-p4 là Civilian)
    // rolePool: [SPY, MR_WHITE, CIVILIAN, CIVILIAN, CIVILIAN, CIVILIAN]
    // Ta cho RNG đảo ngược để p5=SPY, p6=MR_WHITE
    game = assignRolesAndWords(
      game,
      { spyCount: 1, hasMrWhite: true },
      matchWordPair,
      () => 0
    );

    // Xác định vai trò các người chơi
    const spy = game.players.find((p) => p.role === 'SPY')!;
    const mrWhite = game.players.find((p) => p.role === 'MR_WHITE')!;
    const civilians = game.players.filter((p) => p.role === 'CIVILIAN');

    expect(spy).toBeDefined();
    expect(mrWhite).toBeDefined();
    expect(civilians).toHaveLength(4);
    expect(game.phase).toBe('ROLE_REVEAL');

    // 3. ROUND 1: Bắt đầu mô tả
    game = startDescribing(game);
    expect(game.phase).toBe('DESCRIBING');
    expect(game.roundNumber).toBe(1);

    // Đi qua 6 người mô tả
    for (let i = 0; i < 5; i++) {
      const turn = nextTurn(game);
      expect(turn.isRoundComplete).toBe(false);
      game = turn.newState;
    }
    // Lượt cuối của round 1
    const endTurnR1 = nextTurn(game);
    expect(endTurnR1.isRoundComplete).toBe(true);
    game = endTurnR1.newState;
    expect(game.phase).toBe('VOTING');

    // 4. ROUND 1: Bỏ phiếu hòa (p1 & p2 nhận mỗi người 3 phiếu)
    game = castVote(game, 'p1', 'p2');
    game = castVote(game, 'p3', 'p2');
    game = castVote(game, 'p5', 'p2');

    game = castVote(game, 'p2', 'p1');
    game = castVote(game, 'p4', 'p1');
    game = castVote(game, 'p6', 'p1');

    const tallyR1 = tallyVotes(game);
    expect(tallyR1.voteResult.isTie).toBe(true);
    expect(tallyR1.voteResult.eliminatedPlayerId).toBeNull();
    game = tallyR1.newState;
    expect(game.phase).toBe('VOTE_RESULT');
    expect(game.players.filter((p) => p.isAlive)).toHaveLength(6);

    // 5. BƯỚC SANG ROUND 2:
    game = proceedToNextRound(game);
    expect(game.roundNumber).toBe(2);
    expect(game.phase).toBe('DESCRIBING');

    // Đi qua 6 người mô tả Round 2
    for (let i = 0; i < 5; i++) {
      game = nextTurn(game).newState;
    }
    game = nextTurn(game).newState;
    expect(game.phase).toBe('VOTING');

    // Round 2: Dồn phiếu loại Mr. White (p6)
    for (const p of game.players) {
      game = castVote(game, p.id, mrWhite.id);
    }
    const tallyR2 = tallyVotes(game);
    expect(tallyR2.voteResult.isTie).toBe(false);
    expect(tallyR2.voteResult.eliminatedPlayerId).toBe(mrWhite.id);
    game = tallyR2.newState;
    expect(game.phase).toBe('MR_WHITE_GUESS');

    // Mr. White đoán sai từ khóa ("Cà phê đen" != "Trà sữa")
    game = submitMrWhiteGuess(game, mrWhite.id, 'Cà phê đen');
    expect(game.phase).toBe('VOTE_RESULT');
    expect(game.winner).toBeNull();
    expect(game.players.find((p) => p.id === mrWhite.id)?.isAlive).toBe(false);
    expect(game.players.filter((p) => p.isAlive)).toHaveLength(5);

    // 6. BƯỚC SANG ROUND 3:
    game = proceedToNextRound(game);
    expect(game.roundNumber).toBe(3);
    expect(game.phase).toBe('DESCRIBING');

    // Chỉ còn 5 người sống, duyệt qua 5 người mô tả
    for (let i = 0; i < 4; i++) {
      const turn = nextTurn(game);
      expect(turn.isRoundComplete).toBe(false);
      game = turn.newState;
    }
    const endTurnR3 = nextTurn(game);
    expect(endTurnR3.isRoundComplete).toBe(true);
    game = endTurnR3.newState;
    expect(game.phase).toBe('VOTING');

    // Round 3: Mọi người vote Gián điệp (spy)
    const alivePlayers = game.players.filter((p) => p.isAlive);
    for (const p of alivePlayers) {
      game = castVote(game, p.id, spy.id);
    }

    const tallyR3 = tallyVotes(game);
    expect(tallyR3.voteResult.eliminatedPlayerId).toBe(spy.id);
    game = tallyR3.newState;

    // KẾT THÚC: Toàn bộ phe ác đã bị loại, DÂN THƯỜNG THẮNG CUỘC!
    expect(game.phase).toBe('GAME_OVER');
    expect(game.winner).toBe('CIVILIANS');
  });

  it('Kịch bản 2: Gián điệp áp đảo thắng cuộc (Spy >= Civilian)', () => {
    const players = [
      { id: 'p1', name: 'Dân 1' },
      { id: 'p2', name: 'Dân 2' },
      { id: 'p3', name: 'Dân 3' },
      { id: 'p4', name: 'Gián điệp' },
    ];

    let game = createInitialGame('ROOM44', players);
    game = assignRolesAndWords(
      game,
      { spyCount: 1, hasMrWhite: false },
      matchWordPair,
      () => 0
    );

    const spy = game.players.find((p) => p.role === 'SPY')!;
    const civilians = game.players.filter((p) => p.role === 'CIVILIAN');

    // Round 1: Vote loại nhầm Dân 1
    game = { ...game, phase: 'VOTING' };
    const votesR1: Record<string, string> = {
      [civilians[0]!.id]: civilians[1]!.id,
      [civilians[1]!.id]: civilians[0]!.id,
      [civilians[2]!.id]: civilians[0]!.id,
      [spy.id]: civilians[0]!.id,
    };
    const tally1 = tallyVotes(game, votesR1);
    game = tally1.newState;
    expect(game.phase).toBe('VOTE_RESULT');
    expect(game.winner).toBeNull(); // Còn 2 dân, 1 gián điệp -> tiếp tục

    // Round 2: Vote loại tiếp Dân 2
    game = proceedToNextRound(game);
    game = { ...game, phase: 'VOTING' };
    const votesR2: Record<string, string> = {
      [civilians[1]!.id]: civilians[2]!.id,
      [civilians[2]!.id]: civilians[1]!.id,
      [spy.id]: civilians[1]!.id,
    };
    const tally2 = tallyVotes(game, votesR2);
    game = tally2.newState;

    // Còn lại 1 Dân và 1 Gián điệp -> GIÁN ĐIỆP THẮNG!
    expect(game.phase).toBe('GAME_OVER');
    expect(game.winner).toBe('SPIES');
  });

  it('Kịch bản 3: Mr. White lật kèo ngoạn mục bằng cách đoán đúng từ khóa dân', () => {
    const players = [
      { id: 'p1', name: 'Dân 1' },
      { id: 'p2', name: 'Dân 2' },
      { id: 'p3', name: 'Dân 3' },
      { id: 'p4', name: 'Gián điệp' },
      { id: 'p5', name: 'Mr. White' },
    ];

    let game = createInitialGame('ROOM55', players);
    game = assignRolesAndWords(
      game,
      { spyCount: 1, hasMrWhite: true },
      matchWordPair,
      () => 0
    );

    const mrWhite = game.players.find((p) => p.role === 'MR_WHITE')!;

    // Chuyển sang voting và loại Mr. White
    game = { ...game, phase: 'VOTING' };
    const votes: Record<string, string> = {};
    game.players.forEach((p) => {
      votes[p.id] = mrWhite.id;
    });

    const tally = tallyVotes(game, votes);
    game = tally.newState;
    expect(game.phase).toBe('MR_WHITE_GUESS');

    // Mr. White gõ đúng từ của dân thường: "trà sữa" (bất kể khoảng trắng hay chữ hoa)
    game = submitMrWhiteGuess(game, mrWhite.id, '   tRà SữA  ');

    // KẾT THÚC: Mr. White THẮNG CUỘC!
    expect(game.phase).toBe('GAME_OVER');
    expect(game.winner).toBe('MR_WHITE');
  });

  it('Kịch bản 4: Mr. White gõ Unicode dạng tổ hợp (NFD) vẫn được chuẩn hóa khớp với NFC', () => {
    const players = [
      { id: 'p1', name: 'Dân 1' },
      { id: 'p2', name: 'Dân 2' },
      { id: 'p3', name: 'Dân 3' },
      { id: 'p4', name: 'Gián điệp' },
      { id: 'p5', name: 'Mr. White' },
    ];

    let game = createInitialGame('ROOM77', players);
    game = assignRolesAndWords(
      game,
      { spyCount: 1, hasMrWhite: true },
      matchWordPair,
      () => 0
    );

    const mrWhite = game.players.find((p) => p.role === 'MR_WHITE')!;
    game = { ...game, phase: 'MR_WHITE_GUESS', eliminatedPlayerPendingMrWhiteGuess: mrWhite.id };

    // Chuỗi NFD (ký tự 'a' + dấu huyền riêng biệt)
    const nfdGuess = 'Trà sữa'.normalize('NFD');
    const guessedGame = submitMrWhiteGuess(game, mrWhite.id, nfdGuess);

    expect(guessedGame.phase).toBe('GAME_OVER');
    expect(guessedGame.winner).toBe('MR_WHITE');
  });
});

