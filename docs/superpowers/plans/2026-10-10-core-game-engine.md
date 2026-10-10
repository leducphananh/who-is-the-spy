# Core Game Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng Phase 1 Core Game Engine cho web game "Ai Là Gián Điệp" gồm Data Models, Ngân hàng từ khóa tiếng Việt (30+ cặp), Pure functional game transitions (RNG DI), và bộ Unit Test Suite 100% pass với Vitest.

**Architecture:** Pure Functional Core với Immutable State Transitions. Toàn bộ logic không tạo side-effects, trạng thái ván đấu là plain serializable object dễ đồng bộ mạng (Supabase Realtime), hỗ trợ Dependency Injection cho Random Number Generator để đảm bảo khả năng kiểm thử tất định (deterministic).

**Tech Stack:** TypeScript (strict mode), Vitest, Node.js.

**Spec:** `docs/superpowers/specs/2026-10-10-core-game-engine-design.md`

## Global Constraints

- TypeScript version >= 5.x với `strict: true`, không dùng `any`, 0 compile error.
- Vitest là test runner duy nhất, mọi test file đặt trong `tests/core/`.
- Không sử dụng `// TODO` hoặc code placeholder.
- Zero-side-effects: các hàm game state trả về new state object, không mutate in-place.
- Mọi hàm ngẫu nhiên hóa (`getRandomWordPair`, `assignRolesAndWords`) nhận `rng?: () => number` với default `Math.random`.

## Review Focus

1. Người chơi đã chết (`isAlive: false`) vote hoặc nhận vote: hệ thống phải từ chối hoặc bỏ qua phiếu đó.
2. Hòa phiếu ở phase VOTING: không loại bất kỳ ai (`eliminatedPlayerId = null`), trả về `isTie = true`, giữ nguyên số người sống.
3. Mr. White đoán từ dân thường: chuẩn hóa chuỗi không phân biệt hoa thường và khoảng trắng dư thừa (`"  trà sữa  "` khớp `"Trà sữa"`).
4. Điều kiện Gián điệp thắng: số Gián điệp còn sống >= số Dân thường còn sống (ngay cả khi Mr. White vẫn còn hoặc đã chết).
5. Điều kiện Dân thường thắng: loại sạch toàn bộ Gián điệp và Mr. White (nếu có Mr. White trong ván).

---

### Task 1: Project Scaffolding & Tooling Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: `npm test` và `npm run typecheck` thực thi được trong dự án.

- [ ] **Step 1: Tạo file cấu hình `.gitignore`**
  Bỏ qua `node_modules`, `dist`, `.vitest`.

- [ ] **Step 2: Tạo `package.json` với script test và typecheck**
  Khai báo dependencies: `typescript`, `vitest`.
  Scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.

- [ ] **Step 3: Tạo `tsconfig.json`**
  Cấu hình `target: "ES2022"`, `module: "NodeNext"`, `moduleResolution: "NodeNext"`, `strict: true`.

- [ ] **Step 4: Tạo `vitest.config.ts`**
  Cấu hình test environment Node và alias đường dẫn nếu cần.

- [ ] **Step 5: Chạy cài đặt dependencies & xác thực môi trường**
  Run: `npm install`
  Run: `npm test` (xác nhận vitest chạy thành công)

- [ ] **Step 6: Commit**
  ```bash
  git add package.json tsconfig.json vitest.config.ts .gitignore
  git commit -m "chore: scaffold project with typescript and vitest"
  ```

---

### Task 2: Data Models & Types (`src/core/types.ts`)

**Files:**
- Create: `src/core/types.ts`
- Test: `tests/core/types.test.ts`

**Interfaces:**
- Produces: `Role`, `GamePhase`, `GameWinner`, `WordPair`, `PlayerState`, `GameConfig`, `VoteResult`, `GameState`.

- [ ] **Step 1: Viết failing test kiểm tra Type & Enum definitions**
  File `tests/core/types.test.ts` kiểm tra các type guards hoặc object sample tuân thủ cấu trúc của `GameState`.

- [ ] **Step 2: Chạy test để xác thực thất bại**
  Run: `npx vitest run tests/core/types.test.ts`
  Expected: FAIL vì `src/core/types.ts` chưa tồn tại.

- [ ] **Step 3: Định nghĩa toàn bộ interfaces trong `src/core/types.ts`**
  Triển khai đầy đủ theo spec:
  - `Role = 'CIVILIAN' | 'SPY' | 'MR_WHITE'`
  - `GamePhase = 'LOBBY' | 'ROLE_REVEAL' | 'DESCRIBING' | 'VOTING' | 'VOTE_RESULT' | 'MR_WHITE_GUESS' | 'GAME_OVER'`
  - `GameWinner = 'CIVILIANS' | 'SPIES' | 'MR_WHITE' | null`
  - `WordPair`, `PlayerState`, `GameConfig`, `VoteResult`, `GameState`.

- [ ] **Step 4: Chạy test & typecheck để xác thực pass**
  Run: `npx vitest run tests/core/types.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/types.ts tests/core/types.test.ts
  git commit -m "feat(core): define data models and types"
  ```

---

### Task 3: Vietnamese Word Bank (`src/core/wordBank.ts`)

**Files:**
- Create: `src/core/wordBank.ts`
- Test: `tests/core/wordBank.test.ts`

**Interfaces:**
- Consumes: `WordPair` từ `src/core/types.ts`.
- Produces: `WORD_PAIRS: WordPair[]`, `getRandomWordPair(rng?: () => number): WordPair`.

- [ ] **Step 1: Viết failing test cho Word Bank**
  File `tests/core/wordBank.test.ts`:
  - `test('chứa ít nhất 30 cặp từ tiếng Việt độc bản và hợp lệ')`: length >= 30, mỗi cặp có id, category, civilianWord != spyWord.
  - `test('getRandomWordPair lấy từ ngẫu nhiên và tôn trọng custom rng')`: mock rng trả về chỉ số cố định.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/core/wordBank.test.ts`
  Expected: FAIL vì module chưa tồn tại.

- [ ] **Step 3: Triển khai danh sách 30+ cặp từ & hàm `getRandomWordPair`**
  Trong `src/core/wordBank.ts`, viết danh mục đa dạng (Ẩm thực, Đồ dùng, Đời sống, Công nghệ, Thiên nhiên).
  Hàm `getRandomWordPair(rng: () => number = Math.random): WordPair`.

- [ ] **Step 4: Chạy test để xác thực pass**
  Run: `npx vitest run tests/core/wordBank.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/wordBank.ts tests/core/wordBank.test.ts
  git commit -m "feat(core): add vietnamese word bank and random selector"
  ```

---

### Task 4: Khởi tạo phòng & Gán vai trò (`src/core/game.ts` - Khởi tạo)

**Files:**
- Create: `src/core/game.ts`
- Test: `tests/core/assignRoles.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameConfig`, `PlayerState`, `WordPair` từ `src/core/types.ts`.
- Produces:
  - `createInitialGame(roomCode: string, players: { id: string; name: string }[]): GameState`
  - `assignRolesAndWords(state: GameState, config: GameConfig, wordPair: WordPair, rng?: () => number): GameState`

- [ ] **Step 1: Viết failing test cho createInitialGame & assignRolesAndWords**
  File `tests/core/assignRoles.test.ts`:
  - Test khởi tạo game mặc định ở phase `'LOBBY'`.
  - Test ném lỗi nếu người chơi < 3 hoặc > 10.
  - Test ném lỗi nếu số kẻ xấu (spies + mr white) >= số dân thường.
  - Test gán chính xác số lượng vai trò cho bàn 4 người (1 spy, 0 mr white), 6 người (1 spy, 1 mr white), 8 người (2 spies, 1 mr white).
  - Test gán đúng từ khóa cho từng vai: Spy nhận `spyWord`, Civilian nhận `civilianWord`, Mr. White nhận `""`.
  - Test xáo trộn ngẫu nhiên tất định bằng mock RNG.

- [ ] **Step 2: Chạy test để xác thực thất bại**
  Run: `npx vitest run tests/core/assignRoles.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `createInitialGame` và `assignRolesAndWords`**
  Trong `src/core/game.ts`:
  - `createInitialGame` trả về initial state.
  - `assignRolesAndWords` validate input, clone state, Fisher-Yates shuffle phân vai ngẫu nhiên, gán từ khóa, chuyển sang phase `'ROLE_REVEAL'`.

- [ ] **Step 4: Chạy test để xác thực pass**
  Run: `npx vitest run tests/core/assignRoles.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/game.ts tests/core/assignRoles.test.ts
  git commit -m "feat(core): implement game initialization and role assignment"
  ```

---

### Task 5: Vòng mô tả & Chuyển lượt (`src/core/game.ts` - Lượt mô tả)

**Files:**
- Modify: `src/core/game.ts`
- Test: `tests/core/turns.test.ts`

**Interfaces:**
- Consumes: `GameState` từ `src/core/types.ts`.
- Produces:
  - `startDescribing(state: GameState): GameState`
  - `nextTurn(state: GameState): { newState: GameState; isRoundComplete: boolean }`

- [ ] **Step 1: Viết failing test cho startDescribing và nextTurn**
  File `tests/core/turns.test.ts`:
  - `startDescribing` chuyển phase sang `'DESCRIBING'` và trỏ vào người chơi còn sống đầu tiên.
  - `nextTurn` chuyển tuần tự sang người chơi tiếp theo.
  - `nextTurn` tự động bỏ qua người chơi đã bị loại (`isAlive === false`).
  - `nextTurn` khi đi hết người còn sống: trả về `isRoundComplete = true`, chuyển phase sang `'VOTING'`, reset trạng thái vote.

- [ ] **Step 2: Chạy test để xác thực thất bại**
  Run: `npx vitest run tests/core/turns.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `startDescribing` và `nextTurn` trong `src/core/game.ts`**
  Logic duyệt vòng tròn tìm `isAlive: true`, tính toán `isRoundComplete`.

- [ ] **Step 4: Chạy test để xác thực pass**
  Run: `npx vitest run tests/core/turns.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/game.ts tests/core/turns.test.ts
  git commit -m "feat(core): implement describing turn management"
  ```

---

### Task 6: Bỏ phiếu & Kiểm phiếu hòa/thắng (`src/core/game.ts` - Bỏ phiếu)

**Files:**
- Modify: `src/core/game.ts`
- Test: `tests/core/voting.test.ts`

**Interfaces:**
- Consumes: `GameState`, `VoteResult` từ `src/core/types.ts`.
- Produces:
  - `castVote(state: GameState, voterId: string, targetId: string): GameState`
  - `tallyVotes(state: GameState, explicitVotes?: Record<string, string>): { newState: GameState; voteResult: VoteResult }`

- [ ] **Step 1: Viết failing test cho castVote và tallyVotes**
  File `tests/core/voting.test.ts`:
  - `castVote` ghi nhận phiếu từ người sống đến người sống hợp lệ; từ chối nếu người chết vote hoặc bị vote.
  - Bỏ phiếu đa số: người có số phiếu cao nhất bị loại, trả về `isTie = false`, `eliminatedPlayerId`.
  - Hòa phiếu: 2 hoặc nhiều người có số phiếu bằng nhau $\to$ trả về `isTie = true`, `eliminatedPlayerId = null`, không loại ai, phase là `'VOTE_RESULT'`.
  - Không ai vote: xử lý như hòa phiếu.
  - Nếu người bị vote nhiều nhất là `MR_WHITE`: không đặt `isAlive = false` ngay mà chuyển phase `'MR_WHITE_GUESS'`, đặt `eliminatedPlayerPendingMrWhiteGuess`.

- [ ] **Step 2: Chạy test để xác thực thất bại**
  Run: `npx vitest run tests/core/voting.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `castVote` và `tallyVotes` trong `src/core/game.ts`**
  Tính toán phiếu vote, nhận diện đa số vs hòa phiếu, xử lý branch chuyển sang `'MR_WHITE_GUESS'` nếu trúng Mr. White.

- [ ] **Step 4: Chạy test để xác thực pass**
  Run: `npx vitest run tests/core/voting.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/game.ts tests/core/voting.test.ts
  git commit -m "feat(core): implement voting and tie-break tallying"
  ```

---

### Task 7: Mr. White đoán từ & Phân định thắng thua (`src/core/game.ts` - Win Logic)

**Files:**
- Modify: `src/core/game.ts`
- Test: `tests/core/winConditions.test.ts`

**Interfaces:**
- Consumes: `GameState`, `GameWinner` từ `src/core/types.ts`.
- Produces:
  - `submitMrWhiteGuess(state: GameState, playerId: string, guess: string): GameState`
  - `checkWinCondition(state: GameState): GameWinner`
  - `proceedToNextRound(state: GameState): GameState`

- [ ] **Step 1: Viết failing test cho Mr. White guess & Win Conditions**
  File `tests/core/winConditions.test.ts`:
  - `checkWinCondition`:
    * Hết Spy và Mr. White $\to$ `'CIVILIANS'` thắng.
    * Spies >= Civilians $\to$ `'SPIES'` thắng.
    * Còn lại $\to$ `null`.
  - `submitMrWhiteGuess`:
    * Đoán đúng từ dân thường (chuẩn hóa không hoa thường, khoảng trắng) $\to$ `winner = 'MR_WHITE'`, `phase = 'GAME_OVER'`.
    * Đoán sai $\to$ Mr. White bị loại (`isAlive = false`), kiểm tra lại win condition.
  - `proceedToNextRound`:
    * Reset vote, tăng `roundNumber + 1`, chuyển sang `'DESCRIBING'`.

- [ ] **Step 2: Chạy test để xác thực thất bại**
  Run: `npx vitest run tests/core/winConditions.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai các hàm trong `src/core/game.ts`**
  Chuẩn hóa chuỗi so sánh từ khóa tiếng Việt, logic đếm phe thắng, hàm chuyển round.

- [ ] **Step 4: Chạy test để xác thực pass**
  Run: `npx vitest run tests/core/winConditions.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/game.ts tests/core/winConditions.test.ts
  git commit -m "feat(core): implement mr white guess and win conditions"
  ```

---

### Task 8: Integration Test Toàn diện & Xác thực 100%

**Files:**
- Create: `tests/core/gameplayIntegration.test.ts`

- [ ] **Step 1: Viết Integration Test mô phỏng trọn vẹn 1 ván đấu thực tế**
  - Ván đấu 6 người (4 Dân, 1 Gián điệp, 1 Mr. White):
    * Round 1: Mô tả đầy đủ $\to$ Vote hòa $\to$ Không ai bị loại $\to$ Chuyển Round 2.
    * Round 2: Mô tả $\to$ Vote trúng Mr. White $\to$ Đoán sai từ $\to$ Mr. White bị loại.
    * Round 3: Mô tả $\to$ Dân vote trúng Gián điệp $\to$ Gián điệp bị loại $\to$ Dân thường thắng (`'CIVILIANS'`).
  - Kịch bản Gián điệp thắng áp đảo (Dân bị vote loại dẫn đến Gián điệp >= Dân).
  - Kịch bản Mr. White lật kèo ngoạn mục (đoán đúng từ dân).

- [ ] **Step 2: Chạy toàn bộ test suite**
  Run: `npm test`
  Expected: 100% test cases pass.

- [ ] **Step 3: Kiểm tra TypeScript Types**
  Run: `npm run typecheck`
  Expected: 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add tests/core/gameplayIntegration.test.ts
  git commit -m "test(core): add complete end-to-end gameplay integration suite"
  ```
