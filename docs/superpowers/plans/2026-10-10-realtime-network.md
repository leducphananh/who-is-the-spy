# Realtime Network & Dual-Channel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Triển khai Phase 2: Hệ thống mạng Serverless Realtime bằng Supabase Client SDK, kết nối trực tiếp với Pure Core Engine từ Phase 1. Đảm bảo trải nghiệm Multiplayer đa máy qua Room Code 6 ký tự và bảo mật Zero-Knowledge tuyệt đối (không để lộ từ khóa bí mật của người chơi khác qua DevTools).

**Architecture:** Kiến trúc Kênh Kép (Kênh công khai `game_room:<roomCode>` cho Presence và `PublicGameState` + Kênh cá nhân `game_room:<roomCode>:<userId>` cho Secret Word Distribution). Mô hình Serverless Host-Authority Hybrid kết hợp Grace Period Reconnect 30s. Tách tầng Headless `SpyRoomController` thuần TypeScript và bọc qua React Hook `useSpyRoom` sử dụng `useSyncExternalStore`.

**Tech Stack:** TypeScript (strict mode), `@supabase/supabase-js`, React (`useSyncExternalStore`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-10-realtime-network-design.md`

## Global Constraints

- TypeScript version >= 5.x với `strict: true`, không dùng `any`, 0 compile error.
- Vitest là test runner duy nhất, mọi test file mới đặt trong `tests/client/`.
- Không sử dụng `// TODO` hoặc code placeholder.
- Zero-Knowledge tuyệt đối: Không phát tán `role` hoặc `word` của người khác trên kênh chung `game_room:<roomCode>` trước khi `phase === 'GAME_OVER'`.

## Review Focus

1. Kiểm tra nhật ký broadcast kênh công khai `game_room:<roomCode>`: đảm bảo 100% không chứa từ khóa hay vai trò bí mật trong suốt ván đấu.
2. Kiểm tra chỉ người chơi đích (`userId`) mới nhận được `ASSIGN_SECRET_WORD` trên kênh cá nhân của mình.
3. Khi Guest gửi `PLAYER_ACTION` trái phép (ví dụ không phải lượt mô tả của mình, hoặc đã chết mà cố tình vote), Host phải chặn và không làm sai lệch state.
4. Khi Host thoát trong LOBBY: quyền Host tự động chuyển giao tức thì cho người chơi có `joinedAt` sớm nhất còn lại.
5. Khi Host ngắt kết nối trong ACTIVE GAME: kích hoạt trạng thái tạm dừng 30s; nếu Host reconnect thì phục hồi trận đấu; nếu quá 30s thì hủy ván đấu về LOBBY an toàn.

---

### Task 1: Cài đặt Dependencies & Xây dựng Mock Realtime Harness

**Files:**
- Modify: `package.json`
- Create: `tests/client/mockSupabase.ts`
- Test: `tests/client/mockSupabase.test.ts`

**Interfaces:**
- Produces: Mock Supabase Client (`createMockSupabaseClient`) hỗ trợ đa client chia sẻ chung một Event Bus in-memory với các phương thức `.channel()`, `.subscribe()`, `.send()`, `.track()`, `.untrack()`.

- [ ] **Step 1: Cài đặt `@supabase/supabase-js`, `react`, `@types/react`**
  Cập nhật `package.json` và chạy `npm install`.

- [ ] **Step 2: Viết failing test cho `mockSupabase.ts`**
  File `tests/client/mockSupabase.test.ts`:
  - 2 client cùng subscribe vào 1 channel topic: client A send broadcast -> client B nhận được payload.
  - Test presence track / untrack / sync event giữa các client.
  - Test private channel cô lập: client A gửi trên topic A -> client B (subscribe topic B) không nhận được.

- [ ] **Step 3: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/mockSupabase.test.ts`
  Expected: FAIL vì `mockSupabase.ts` chưa tồn tại.

- [ ] **Step 4: Triển khai `tests/client/mockSupabase.ts`**
  Class `MockRealtimeHub` làm in-memory broker, class `MockRealtimeChannel` cung cấp API tương thích với `@supabase/supabase-js`.

- [ ] **Step 5: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/mockSupabase.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json tests/client/mockSupabase.ts tests/client/mockSupabase.test.ts
  git commit -m "test(client): add in-memory supabase realtime mock test harness"
  ```

---

### Task 2: Network Protocol & Data Types (`src/client/network/types.ts`)

**Files:**
- Create: `src/client/network/types.ts`
- Test: `tests/client/networkTypes.test.ts`

**Interfaces:**
- Produces: `PlayerPresence`, `PublicPlayerState`, `PublicGameState`, `SecretWordPayload`, `PlayerAction`, `RoomStateSnapshot`.

- [ ] **Step 1: Viết failing test cho Network Types**
  File `tests/client/networkTypes.test.ts`:
  - Kiểm tra các type shapes và sanitization function (hàm helper chuyển `GameState` sang `PublicGameState` loại bỏ `role` và `word`).

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/networkTypes.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `src/client/network/types.ts`**
  Định nghĩa toàn bộ interfaces theo đúng bản thiết kế spec.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/networkTypes.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/types.ts tests/client/networkTypes.test.ts
  git commit -m "feat(network): define network protocol and payload types"
  ```

---

### Task 3: Dual-Channel Room Controller & Presence Management (`src/client/network/SpyRoomController.ts` - Part 1)

**Files:**
- Create: `src/client/network/SpyRoomController.ts`
- Test: `tests/client/roomLifecycle.test.ts`

**Interfaces:**
- Produces: `SpyRoomController` với các phương thức `joinRoom(roomCode)`, `leaveRoom()`, `subscribe()`, `getSnapshot()`, và xử lý Presence tracking.

- [ ] **Step 1: Viết failing test cho vòng đời phòng và Presence**
  File `tests/client/roomLifecycle.test.ts`:
  - Client tham gia phòng: kết nối thành công vào cả kênh chung và kênh cá nhân.
  - Presence list cập nhật danh sách người chơi, xác định Host ban đầu dựa trên `isHost` hoặc `joinedAt`.
  - Observer subscriber được thông báo mỗi khi snapshot thay đổi.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/roomLifecycle.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai khung điều phối `SpyRoomController`**
  Quản lý channels, presence subscription, listener notification, và snapshot generation.

- [ ] **Step 4: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/roomLifecycle.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/SpyRoomController.ts tests/client/roomLifecycle.test.ts
  git commit -m "feat(network): implement room lifecycle and presence in SpyRoomController"
  ```

---

### Task 4: Zero-Knowledge Secret Distribution (`src/client/network/SpyRoomController.ts` - Part 2)

**Files:**
- Modify: `src/client/network/SpyRoomController.ts`
- Create: `tests/client/dualChannelSecurity.test.ts`

**Interfaces:**
- Produces: `controller.startGame(config)` với logic phân phát từ khóa Zero-Knowledge trên kênh cá nhân.

- [ ] **Step 1: Viết failing test cho Zero-Knowledge Secret Distribution**
  File `tests/client/dualChannelSecurity.test.ts`:
  - 4 người chơi tham gia phòng (1 Host, 3 Guest).
  - Host bắt đầu ván đấu (`startGame`).
  - Mỗi người chơi nhận được đúng từ khóa của mình qua kênh riêng (`mySecret`).
  - Ghi lại toàn bộ gói tin broadcast trên kênh chung `game_room:CODE`: khẳng định **KHÔNG** chứa bất kỳ trường `word` hay `role` bí mật nào.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/dualChannelSecurity.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai hàm `startGame` và phát tán từ khóa bí mật**
  Trong `SpyRoomController`:
  - Host khởi tạo `GameState` từ `src/core/game.ts` và gán vai với `WORD_PAIRS`.
  - Gửi `ASSIGN_SECRET_WORD` tới từng kênh cá nhân `game_room:<roomCode>:<userId>`.
  - Broadcast `SYNC_STATE` với `PublicGameState` đã lọc sạch thông tin mật lên kênh chung.

- [ ] **Step 4: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/dualChannelSecurity.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/SpyRoomController.ts tests/client/dualChannelSecurity.test.ts
  git commit -m "feat(network): implement zero-knowledge dual-channel secret distribution"
  ```

---

### Task 5: Host Authority Peer Action Processing (`src/client/network/SpyRoomController.ts` - Part 3)

**Files:**
- Modify: `src/client/network/SpyRoomController.ts`
- Create: `tests/client/hostAuthority.test.ts`

**Interfaces:**
- Produces: `nextTurn()`, `castVote(targetId)`, `submitMrWhiteGuess(guess)`, `proceedToNextRound()` gửi action tới Host và Host xử lý đồng bộ.

- [ ] **Step 1: Viết failing test cho Host Authority Action Processing**
  File `tests/client/hostAuthority.test.ts`:
  - Guest gọi `nextTurn()` khi đến lượt mô tả $\to$ Host nhận `PLAYER_ACTION`, gọi `nextTurn(rawGameState)` và phát `SYNC_STATE` mới.
  - Guest không trong lượt gọi `nextTurn()` $\to$ Host từ chối.
  - Bỏ phiếu: Guest gọi `castVote()` $\to$ Host tích lũy phiếu, khi đủ phiếu tự động `tallyVotes` và đồng bộ kết quả.
  - Mr. White submit từ đoán $\to$ Host thẩm định với từ khóa bí mật và kết thúc ván nếu đúng.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/hostAuthority.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai xử lý action và Host Authority**
  Trong `SpyRoomController`:
  - Guest broadcast `PLAYER_ACTION` lên kênh chung.
  - Host lắng nghe, xác thực hợp lệ, gọi hàm pure engine từ `src/core/game.ts`, cập nhật `rawGameState` và broadcast `SYNC_STATE`.

- [ ] **Step 4: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/hostAuthority.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/SpyRoomController.ts tests/client/hostAuthority.test.ts
  git commit -m "feat(network): implement host authority peer action processing"
  ```

---

### Task 6: Grace Period Reconnect (30s) & Host Migration (`src/client/network/SpyRoomController.ts` - Part 4)

**Files:**
- Modify: `src/client/network/SpyRoomController.ts`
- Create: `tests/client/hostMigration.test.ts`

**Interfaces:**
- Produces: Tự động bầu Host mới trong Lobby và cơ chế đếm ngược 30s tạm dừng trận đấu khi Host mất kết nối giữa chừng.

- [ ] **Step 1: Viết failing test cho Host Migration & Grace Period**
  File `tests/client/hostMigration.test.ts`:
  - **Lobby migration:** Host rời phòng $\to$ Người chơi kế tiếp có `joinedAt` sớm nhất tự động thành Host mới (`isHost = true`).
  - **Active game disconnect & Reconnect:** Host rời ván đấu $\to$ Phòng kích hoạt `isPausedForHostReconnect = true`. Host kết nối lại trong vòng 30s $\to$ Ván đấu tiếp tục bình thường.
  - **Active game timeout:** Host không vào lại sau 30s $\to$ Ván đấu bị hủy (`ABORTED`), chuyển quyền Host cho người kế tiếp và đưa tất cả về LOBBY.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/hostMigration.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai Grace Period timer và Host Migration logic**
  Trong `SpyRoomController`:
  - Lắng nghe sự kiện presence leave của Host.
  - Xử lý phân nhánh LOBBY vs ACTIVE GAME với timer 30s.

- [ ] **Step 4: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/hostMigration.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/SpyRoomController.ts tests/client/hostMigration.test.ts
  git commit -m "feat(network): implement grace period reconnect and host migration"
  ```

---

### Task 7: React Hook Wrapper `useSpyRoom` (`src/client/hooks/useSpyRoom.ts`)

**Files:**
- Create: `src/client/hooks/useSpyRoom.ts`
- Create: `tests/client/useSpyRoom.test.ts`

**Interfaces:**
- Produces: React hook `useSpyRoom(controller)` đồng bộ snapshot qua `useSyncExternalStore`.

- [ ] **Step 1: Viết failing test cho `useSpyRoom`**
  File `tests/client/useSpyRoom.test.ts`:
  - Kiểm tra `useSpyRoom` trả về đầy đủ snapshot state và các action methods.
  - Kiểm tra cập nhật state thông qua subscriber của `useSyncExternalStore`.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/useSpyRoom.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `useSpyRoom.ts`**
  Bọc `SpyRoomController` bằng `useSyncExternalStore`.

- [ ] **Step 4: Chạy test để xác nhận pass**
  Run: `npx vitest run tests/client/useSpyRoom.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/hooks/useSpyRoom.ts tests/client/useSpyRoom.test.ts
  git commit -m "feat(client): implement useSpyRoom react hook wrapper"
  ```

---

### Task 8: Integration Test Toàn diện & Xác thực 100%

**Files:**
- Create: `tests/client/networkIntegration.test.ts`

- [ ] **Step 1: Viết kịch bản Integration Test 4 máy chơi qua mạng từ A-Z**
  - Host tạo phòng, 3 Guest nhập Room Code vào phòng.
  - Host khởi động game, cấu hình 1 Gián điệp.
  - Kiểm tra Zero-Knowledge: Không client nào biết vai trò/từ khóa của người khác.
  - Lượt mô tả tuần tự qua mạng.
  - Bỏ phiếu qua mạng, Host kiểm phiếu.
  - Kết thúc trận đấu, Host lật mở toàn bộ vai trò trên `PublicGameState`.

- [ ] **Step 2: Chạy toàn bộ test suite dự án**
  Run: `npm test`
  Expected: 100% test cases pass (cả `tests/core/` và `tests/client/`).

- [ ] **Step 3: Kiểm tra TypeScript strict mode**
  Run: `npm run typecheck`
  Expected: 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add tests/client/networkIntegration.test.ts
  git commit -m "test(client): add complete multi-client network integration suite"
  ```
