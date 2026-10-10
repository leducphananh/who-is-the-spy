# Design Document: Core Game Engine ("Ai Là Gián Điệp" - Phase 1)

- **Date:** 2026-10-10
- **Author:** Senior Fullstack Game Architect
- **Status:** Proposed
- **Target Tech Stack:** TypeScript (strict mode), Vitest

---

## 1. Mục tiêu & Phạm vi (Phase 1)

Phase 1 tập trung xây dựng nền tảng Domain Model và Game Logic cốt lõi (Pure Functional Game Engine), hoàn toàn độc lập với UI framework (React) và mạng (Supabase Realtime).

### Tiêu chí thành công:
1. Hệ thống Type chặt chẽ (`src/core/types.ts`), 0 TypeScript error.
2. Ngân hàng từ khóa tiếng Việt chất lượng cao (`src/core/wordBank.ts`) với tối thiểu 30 cặp từ tinh tế, phân loại rõ ràng.
3. Core game logic (`src/core/game.ts`) thuần túy (pure functions), bất biến (immutable), hỗ trợ RNG Dependency Injection để đảm bảo 100% testable.
4. Bộ Unit Tests (`tests/core/`) bao phủ toàn diện các kịch bản:
   - Gán vai trò & từ khóa (4–8 người chơi, các cấu hình Spies/Mr. White).
   - Điều phối lượt mô tả (bỏ qua người đã bị loại).
   - Kiểm phiếu (thắng đa số, hòa phiếu không loại ai theo quyết định đã duyệt).
   - Cơ chế Mr. White đoán từ lật ngược thế cờ.
   - Các điều kiện thắng thua (Dân thường, Gián điệp, Mr. White).
5. 100% test case pass với `npm test`.

---

## 2. Mô hình Dữ liệu (Data Models - `src/core/types.ts`)

```typescript
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
  word: string; // Chuỗi rỗng đối với MR_WHITE
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
```

---

## 3. Ngân hàng từ khóa tiếng Việt (`src/core/wordBank.ts`)

- Tối thiểu 30 cặp từ tiếng Việt được tuyển chọn kỹ lưỡng, cân bằng độ khó, tránh lộ liễu nhưng đủ khác biệt để tạo tranh luận hấp dẫn.
- Chủ đề đa dạng:
  - **Ẩm thực:** Trà sữa / Cà phê sữa, Trứng gà / Trứng vịt lộn, Phở bò / Bún bò, Nem rán / Chả giò, Bánh mì / Bánh bao, Nước mía / Nước dừa, Lẩu thái / Canh chua,...
  - **Đồ dùng & Thiết bị:** Kính râm / Kính cận, Quạt trần / Quạt cây, Tai nghe có dây / Tai nghe Bluetooth, Bàn phím cơ / Bàn phím cao su, Bật lửa / Bao diêm, Nồi cơm điện / Nồi áp suất,...
  - **Đời sống & Xã hội:** Người yêu cũ / Vợ, Bạn thân / Bạn xã giao, Mẹ chồng / Mẹ đẻ, Đi phượt / Đi tour, Xem phim rạp / Xem Netflix,...
  - **Công nghệ & Mạng xã hội:** TikTok / YouTube Shorts, Facebook / Instagram, Laptop / iPad, Grab / Be,...
  - **Thiên nhiên & Động vật:** Chó Husky / Chó Alaska, Cua biển / Ghẹ biển, Cây đào / Cây mai,...
- API:
  - `WORD_PAIRS: WordPair[]`
  - `getRandomWordPair(rng?: () => number): WordPair`

---

## 4. Kiến trúc Logic ván đấu (`src/core/game.ts`)

Toàn bộ hàm được thiết kế dưới dạng **Pure Functions** nhận vào state hiện tại và trả về bản sao state mới (Immutable State):

### 4.1. Khởi tạo & Gán vai trò
- `createInitialGame(roomCode: string, players: { id: string; name: string }[]): GameState`
  - Khởi tạo phòng ở phase `'LOBBY'`.
- `assignRolesAndWords(state: GameState, config: GameConfig, wordPair: WordPair, rng: () => number = Math.random): GameState`
  - Kiểm tra hợp lệ:
    * Số người chơi từ 3 đến 10.
    * `config.spyCount >= 1`.
    * Tổng số kẻ xấu (`config.spyCount + (config.hasMrWhite ? 1 : 0)`) phải nhỏ hơn số Dân thường.
  - Sử dụng thuật toán Fisher-Yates Shuffle với `rng` để xáo trộn người nhận vai trò.
  - Phân bổ:
    * Dân thường (`CIVILIAN`): nhận `wordPair.civilianWord`.
    * Gián điệp (`SPY`): nhận `wordPair.spyWord`.
    * Kẻ trắng tay (`MR_WHITE` nếu bật): nhận chuỗi rỗng `''`.
  - Cập nhật state sang `phase = 'ROLE_REVEAL'`, `roundNumber = 1`, `currentDescriberIndex = 0`.

### 4.2. Quản lý lượt mô tả (Describing Loop)
- `startDescribing(state: GameState): GameState`
  - Chuyển `phase` sang `'DESCRIBING'`. Tìm người còn sống đầu tiên (`isAlive === true`) bắt đầu từ vị trí 0.
- `nextTurn(state: GameState): { newState: GameState; isRoundComplete: boolean }`
  - Tìm người chơi còn sống kế tiếp sau `currentDescriberIndex`.
  - Nếu đã đi hết một vòng tất cả người còn sống:
    * `isRoundComplete = true`.
    * `phase = 'VOTING'`.
    * Reset trạng thái vote của tất cả người chơi (`hasVoted = false, voteTargetId = null`).
  - Nếu chưa hết vòng:
    * `currentDescriberIndex` trỏ tới người chơi còn sống tiếp theo.

### 4.3. Bỏ phiếu & Kiểm phiếu (Voting & Tallying)
- `castVote(state: GameState, voterId: string, targetId: string): GameState`
  - Xác nhận cả người bỏ phiếu và người bị bỏ phiếu đều còn sống.
  - Ghi nhận `hasVoted = true`, `voteTargetId = targetId`.
- `tallyVotes(state: GameState, explicitVotes?: Record<string, string>): { newState: GameState; voteResult: VoteResult }`
  - Đếm tổng số phiếu cho mỗi người chơi còn sống.
  - Xử lý kết quả:
    * **Hòa phiếu (Tie):** Có từ 2 người trở lên cùng nhận số phiếu cao nhất (hoặc không ai có phiếu).
      - `voteResult.isTie = true`, `eliminatedPlayerId = null`, `tiePlayerIds = [...]`.
      - State mới: `phase = 'VOTE_RESULT'`, không loại ai, lưu `lastVoteResult`.
    * **Đa số (Majority):** Một người duy nhất nhận số phiếu cao nhất.
      - `voteResult.isTie = false`, `eliminatedPlayerId = target.id`.
      - Nếu người bị loại là `MR_WHITE`:
        + `newState.phase = 'MR_WHITE_GUESS'`.
        + `newState.eliminatedPlayerPendingMrWhiteGuess = target.id`.
      - Nếu người bị loại là `CIVILIAN` hoặc `SPY`:
        + Đánh dấu `isAlive = false`.
        + Kiểm tra điều kiện thắng (`checkWinCondition`).
        + Nếu có phe thắng: `phase = 'GAME_OVER'`, gán `winner`.
        + Nếu chưa: `phase = 'VOTE_RESULT'`.

### 4.4. Xử lý Mr. White đoán từ
- `submitMrWhiteGuess(state: GameState, playerId: string, guess: string): GameState`
  - Chuẩn hóa chuỗi đoán (trim, lowercase, chuẩn hóa Unicode tiếng Việt).
  - So sánh với `state.civilianWord`.
  - Nếu **ĐÚNG**:
    * Mr. White thắng ngay lập tức: `winner = 'MR_WHITE'`, `phase = 'GAME_OVER'`.
  - Nếu **SAI**:
    * Mr. White chính thức bị loại: `isAlive = false`.
    * Xóa `eliminatedPlayerPendingMrWhiteGuess = null`.
    * Kiểm tra lại điều kiện thắng:
      - Nếu loại xong Mr. White mà hết phe ác $\to$ `winner = 'CIVILIANS'`, `phase = 'GAME_OVER'`.
      - Nếu phe ác áp đảo $\to$ `winner = 'SPIES'`, `phase = 'GAME_OVER'`.
      - Nếu trận đấu tiếp diễn $\to$ `phase = 'VOTE_RESULT'`.

### 4.5. Phân định thắng thua & Chuyển round
- `checkWinCondition(state: GameState): GameWinner`
  - Đếm số lượng người chơi còn sống (`isAlive === true`):
    * `aliveCivilians`
    * `aliveSpies`
    * `aliveMrWhite`
  - Quy tắc:
    1. Nếu `aliveSpies === 0 && aliveMrWhite === 0`: `'CIVILIANS'` thắng.
    2. Nếu `aliveSpies >= aliveCivilians`: `'SPIES'` thắng.
    3. Ngược lại: trả về `null` (ván chơi tiếp tục).
- `proceedToNextRound(state: GameState): GameState`
  - Gọi sau khi xem xong kết quả ở `VOTE_RESULT`.
  - Tăng `roundNumber += 1`.
  - Reset vote: `hasVoted = false, voteTargetId = null`.
  - Chuyển `phase = 'DESCRIBING'`.
  - Đặt `currentDescriberIndex` về người còn sống đầu tiên.

---

## 5. Kế hoạch Kiểm thử (Unit Tests Suite)

Tất cả test case được viết bằng Vitest trong thư mục `tests/core/`:

1. `tests/core/wordBank.test.ts`:
   - Kiểm tra có tối thiểu 30 cặp từ.
   - Kiểm tra tính hợp lệ của từng cặp từ (id duy nhất, từ không rỗng, civilianWord != spyWord, category có nghĩa).
   - Kiểm tra `getRandomWordPair` hoạt động chuẩn và tôn trọng seed/mock rng.

2. `tests/core/game.test.ts`:
   - **Gán vai trò & Validation:**
     * Ném lỗi nếu số người chơi < 3 hoặc > 10.
     * Ném lỗi nếu số gián điệp + mr white >= số dân thường.
     * Kiểm tra chính xác số lượng từng vai trong phòng 4, 5, 6, 8 người.
     * Kiểm tra đúng từ khóa bí mật tương ứng từng vai.
     * Deterministic shuffle với mock rng.
   - **Vòng mô tả (Turn Order):**
     * Đi tuần tự qua các người chơi còn sống.
     * Tự động bỏ qua người chơi đã chết (`isAlive = false`).
     * Phát hiện kết thúc vòng mô tả và chuyển phase `'VOTING'`.
   - **Bỏ phiếu & Hòa phiếu:**
     * Bỏ phiếu đa số: người bị vote nhiều nhất bị loại chính xác.
     * Hòa phiếu: không ai bị loại, `isTie = true`, chuyển sang `VOTE_RESULT`, chuẩn bị cho round tiếp theo.
     * Người đã chết không được phép vote hoặc nhận vote.
   - **Cơ chế Mr. White:**
     * Mr. White bị loại chuyển sang `MR_WHITE_GUESS`.
     * Đoán đúng từ dân thường $\to$ Mr. White thắng cuộc.
     * Đoán sai $\to$ Mr. White bị loại thực sự, ván đấu kiểm tra lại điều kiện thắng.
   - **Điều kiện thắng thua:**
     * Dân thắng khi loại sạch Spy và Mr. White.
     * Gián điệp thắng khi số Gián điệp >= số Dân thường.
     * Mr. White thắng khi đoán đúng.
     * Các trường hợp edge-case (3 người còn 1 Dân + 1 Spy + 1 Mr. White).

---

## 6. Thiết lập Dự án & Môi trường

Tạo file cấu hình tối thiểu chuẩn TypeScript + Vitest:
- `package.json`: scripts `test`, `typecheck`.
- `tsconfig.json`: target ES2022, module NodeNext, strict: true.
- `vitest.config.ts`: test environment Node.
