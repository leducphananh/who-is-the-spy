# Custom Words Pack, Web Audio SFX & Playwright E2E Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trang bị cho "Ai Là Gián Điệp" khả năng tùy biến từ khóa (nhập nhanh & quản lý pack), hệ thống âm thanh Web Audio SFX thuần, và bộ Playwright E2E test đa ngữ cảnh mô phỏng 4 người chơi cùng lúc.

**Architecture:** Mở rộng Core Engine & SpyRoomController hỗ trợ cặp từ tùy biến; Xây dựng module âm thanh tổng hợp sóng Web Audio API tự động resume an toàn trên mobile; Thiết lập Playwright test suite tạo 4 Browser Contexts độc lập kết nối qua BroadcastChannel.

**Tech Stack:** TypeScript, React 19, TailwindCSS, Web Audio API, Vitest, Playwright (`@playwright/test`).

**Spec:** `docs/superpowers/specs/2026-10-10-custom-words-sfx-e2e-design.md`

## Global Constraints

- Không sử dụng file âm thanh ngoài; 100% âm thanh được tổng hợp bằng Web Audio API native oscillators để đảm bảo offline, 0kb bundle assets.
- Lưu trữ Custom Pack và cấu hình SFX bền vững qua `localStorage` (`CUSTOM_WORD_PACKS_KEY`, `SPY_SFX_ENABLED_KEY`).
- Hỗ trợ mobile-first, autoplay policy an toàn bằng cách lắng nghe tương tác đầu tiên để `resume()` AudioContext.
- Playwright E2E test mô phỏng 4 browser contexts độc lập trên headless Chromium.
- Giữ vững 0 lỗi TypeScript (`tsc --noEmit`), 100% test Vitest & Playwright pass, và `npm run build` thành công.

## Review Focus

- Host nhập 2 từ trùng nhau hoặc chuỗi rỗng: Giao diện phải chặn và báo lỗi rõ ràng.
- Trình duyệt di động chặn Web Audio do chưa có tương tác: Không được ném uncaught exception làm gián đoạn trò chơi.
- Người dùng tắt âm thanh (Mute): Tất cả các hàm `playX()` phải bỏ qua ngay lập tức không tạo AudioContext thừa.
- Xóa pack từ khóa đang được chọn làm active: Hệ thống phải tự động fallback về kho từ mặc định.
- Chạy Playwright E2E 4 tab: Không bị race condition khi đồng bộ presence qua BroadcastChannel.

---

### Task 1: Core Custom Words & Controller Support

**Files:**
- Modify: `src/core/wordBank.ts`
- Modify: `src/client/network/SpyRoomController.ts`
- Test: `tests/core/wordBank.test.ts`
- Test: `tests/client/hostAuthority.test.ts`

**Interfaces:**
- Consumes: `WordPair`, `GameConfig`
- Produces:
  - `getRandomWordPair(pairs?: readonly WordPair[], rng?: () => number): WordPair`
  - `SpyRoomController.startGame(config: GameConfig, customPair?: WordPair, customPack?: WordPair[]): Promise<void>`

- [ ] **Step 1: Viết test mở rộng cho wordBank và hostAuthority**
  - `tests/core/wordBank.test.ts`: test `getRandomWordPair` nhận danh sách custom pairs tùy chọn.
  - `tests/client/hostAuthority.test.ts`: test `startGame` với `customPair` gán đúng từ cho Dân thường và Gián điệp.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  - Run: `npx vitest run tests/core/wordBank.test.ts`
  - Expected: FAIL.

- [ ] **Step 3: Triển khai cập nhật `wordBank.ts` và `SpyRoomController.ts`**
  - Cập nhật tham số `pairs` trong `getRandomWordPair`.
  - Cập nhật `startGame` trong `SpyRoomController` nhận `customPair` hoặc `customPack`.

- [ ] **Step 4: Chạy test & typecheck**
  - Run: `npx vitest run tests/core/wordBank.test.ts tests/client/hostAuthority.test.ts`
  - Run: `npm run typecheck`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/core/wordBank.ts src/client/network/SpyRoomController.ts tests/core/wordBank.test.ts tests/client/hostAuthority.test.ts
  git commit -m "feat(core): support custom word pairs and packs in game start"
  ```

---

### Task 2: Web Audio Pure Synthesis SFX Engine & Header Mute Control

**Files:**
- Create: `src/client/lib/soundEffects.ts`
- Modify: `src/client/App.tsx`
- Modify: `src/client/components/Game/SecretWordCard.tsx`
- Modify: `src/client/components/Game/DescribingView.tsx`
- Modify: `src/client/components/Game/VotingView.tsx`
- Modify: `src/client/components/Game/VoteResultModal.tsx`
- Modify: `src/client/components/Game/GameOverModal.tsx`
- Test: `tests/client/soundEffects.test.ts`

**Interfaces:**
- Produces:
  - `soundEffects`: `{ isSoundEnabled, setSoundEnabled, ensureAudioReady, playTick, playRoleReveal, playTurnAlert, playGavel, playTie, playVictory }`

- [ ] **Step 1: Viết failing test cho `soundEffects.ts`**
  - File `tests/client/soundEffects.test.ts`:
    - Khởi tạo AudioContext an toàn hoặc mock trong môi trường Node.js.
    - Lưu trạng thái bật/tắt vào `localStorage`.
    - Gọi các hàm `playTick`, `playGavel`, `playVictory` không throw lỗi.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  - Run: `npx vitest run tests/client/soundEffects.test.ts`
  - Expected: FAIL.

- [ ] **Step 3: Triển khai `src/client/lib/soundEffects.ts`**
  - Tạo AudioContext lazy initialization.
  - Tổng hợp 6 hiệu ứng âm thanh bằng oscillators (`sine`, `triangle`, `square`) và gain envelope.
  - Tích hợp nút loa Bật/Tắt âm thanh trong Header của `App.tsx`.
  - Tích hợp gọi sound effects tại các điểm mốc: xem từ, chuyển lượt, bỏ phiếu, kết quả vote, và game over.

- [ ] **Step 4: Chạy test & typecheck**
  - Run: `npx vitest run tests/client/soundEffects.test.ts`
  - Run: `npm run typecheck`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/lib/soundEffects.ts src/client/App.tsx src/client/components/Game/ tests/client/soundEffects.test.ts
  git commit -m "feat(sfx): implement pure Web Audio API sound effects and mute control"
  ```

---

### Task 3: WordPackModal & Quick Custom Words in WaitingRoom

**Files:**
- Create: `src/client/components/Lobby/WordPackModal.tsx`
- Modify: `src/client/components/Lobby/WaitingRoom.tsx`
- Modify: `src/client/App.tsx`
- Test: `tests/client/ui/WordPackModal.test.tsx`
- Test: `tests/client/ui/WaitingRoomCustomWords.test.tsx`

**Interfaces:**
- Produces:
  - `WordPackModal`: Quản lý danh sách CustomWordPack trong `localStorage`.
  - `WaitingRoom`: Cho phép Host bật ô Nhập nhanh 1 cặp từ hoặc mở `WordPackModal`.

- [ ] **Step 1: Viết failing test cho `WordPackModal` và `WaitingRoom` custom words**
  - File `tests/client/ui/WordPackModal.test.tsx`: tạo pack mới, thêm cặp từ, xóa pack.
  - File `tests/client/ui/WaitingRoomCustomWords.test.tsx`: toggle nhập từ nhanh, validate 2 từ không được trùng nhau.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  - Run: `npx vitest run tests/client/ui/WordPackModal.test.tsx tests/client/ui/WaitingRoomCustomWords.test.tsx`
  - Expected: FAIL.

- [ ] **Step 3: Triển khai `WordPackModal.tsx` và nâng cấp `WaitingRoom.tsx`**
  - Giao diện modal quản lý pack chuẩn Detective Mystery theme.
  - Accordion nhập nhanh 2 từ tại `WaitingRoom.tsx` kèm validation.
  - Nối `customWordPair` từ `WaitingRoom` sang `App.tsx` truyền vào `controller.startGame()`.

- [ ] **Step 4: Chạy test & typecheck**
  - Run: `npx vitest run tests/client/ui/WordPackModal.test.tsx tests/client/ui/WaitingRoomCustomWords.test.tsx`
  - Run: `npm run typecheck`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Lobby/WordPackModal.tsx src/client/components/Lobby/WaitingRoom.tsx src/client/App.tsx tests/client/ui/WordPackModal.test.tsx tests/client/ui/WaitingRoomCustomWords.test.tsx
  git commit -m "feat(ui): implement WordPackModal and quick custom words in WaitingRoom"
  ```

---

### Task 4: Playwright Setup & Multi-Context E2E Test Suite

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/fullMatch.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Produces:
  - `npm run test:e2e` chạy kịch bản Playwright 4 người chơi hoàn chỉnh.

- [ ] **Step 1: Cài đặt `@playwright/test` và thiết lập cấu hình**
  - Cài đặt `@playwright/test` vào `devDependencies`.
  - Cài đặt browser binary: `npx playwright install chromium`.
  - Tạo file `playwright.config.ts` với `webServer: { command: 'npm run dev', port: 5173 }`.

- [ ] **Step 2: Viết kịch bản E2E `tests/e2e/fullMatch.spec.ts`**
  - Mở 4 Browser Contexts:
    1. Context 1 (Host Cáo): Tạo phòng `CODE`.
    2. Context 2 (Watson Cú), Context 3 (Moriarty Sói), Context 4 (Irene Mèo): Join phòng `CODE`.
    3. Host nhập từ custom: "Trà đào" & "Trà chanh" $\to$ Bắt đầu ván.
    4. Cả 4 context nhấn giữ xem từ bí mật.
    5. Vòng mô tả: Tuần tự người đến lượt bấm Chuyển lượt.
    6. Vòng bỏ phiếu: Cả 4 người bỏ phiếu loại Moriarty $\to$ Xem kết quả trục xuất $\to$ Tiếp tục.
    7. Game Over Modal hiển thị đúng danh sách vai trò và từ khóa.

- [ ] **Step 3: Chạy kịch bản E2E để kiểm tra**
  - Run: `npx playwright test`
  - Expected: PASS (4 contexts tương tác mượt mà).

- [ ] **Step 4: Cập nhật package.json scripts**
  - Thêm `"test:e2e": "playwright test"`.

- [ ] **Step 5: Commit**
  ```bash
  git add playwright.config.ts tests/e2e/fullMatch.spec.ts package.json package-lock.json
  git commit -m "test(e2e): setup Playwright and 4-player full match multi-context test"
  ```

---

### Task 5: Toàn Diện Nghiệm Thu & Build Verification

**Files:**
- Verification only

- [ ] **Step 1: Chạy toàn bộ Vitest test suite**
  - Run: `npx vitest run`
  - Expected: 100% tests PASS

- [ ] **Step 2: Chạy Playwright E2E suite**
  - Run: `npx playwright test`
  - Expected: PASS

- [ ] **Step 3: Chạy TypeScript check**
  - Run: `npm run typecheck`
  - Expected: 0 errors

- [ ] **Step 4: Chạy Production Build**
  - Run: `npm run build`
  - Expected: Code 0, bundle tạo thành công
