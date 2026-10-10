# Mobile-First Web UI & Game Flow Interactions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng trọn vẹn tầng giao diện người dùng Mobile-First cho web game "Ai Là Gián Điệp" (React 19, TailwindCSS, Lucide-react, Canvas-confetti) kết nối trực tiếp với hook `useSpyRoom` từ Phase 2. Giao diện tối ưu cho smartphone, trải nghiệm mượt mà, phong cách Detective Mystery và cơ chế chống nhìn lén từ khóa bí mật.

**Architecture:** State-Driven Single Page Flow điều phối qua `src/client/App.tsx`. Giao diện chuyển cảnh mượt mà theo từng `publicGameState.phase`. Thiết lập Hybrid Supabase Client tự động dùng real Supabase nếu có `.env` hoặc fallback sang `BroadcastChannel` đa tab khi chạy demo/test trên máy.

**Tech Stack:** React 19, TypeScript (strict mode), TailwindCSS, Lucide-react, Canvas-confetti, Vite, Happy-DOM, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-10-mobile-web-ui-design.md`

## Global Constraints

- TypeScript version >= 5.x với `strict: true`, không dùng `any`, 0 compile error.
- Vitest chạy được toàn bộ test suite (Core, Network, UI components).
- Không sử dụng `// TODO` hoặc code placeholder.
- Phong cách giao diện: Detective Mystery với bảng màu `slate-950`, `amber-400`, `cyan-400`, `rose-500`, `emerald-400`.
- Chống nhìn lén: Từ khóa chỉ được hiển thị khi người dùng chủ động chạm và giữ màn hình (`onPointerDown` $\to$ hiển thị, `onPointerUp`/`leave` $\to$ ẩn ngay lập tức).
- `npm run build` phải biên dịch thành công production bundle với Vite.

## Review Focus

1. Thao tác chạm và giữ (Press & Hold): thả tay ra từ khóa phải biến mất ngay lập tức, không để lộ cho người ngồi cạnh.
2. Nút "Bắt đầu ván đấu" trong WaitingRoom: chỉ được kích hoạt (sáng) khi phòng có từ 3 đến 10 người chơi.
3. Khi đến lượt nói của mình: DescribingView phải hiển thị nổi bật nút "Đã nói xong / Chuyển lượt" và người đang nói có hiệu ứng phát sáng Pulse Glow.
4. Khi Mr. White bị loại: chỉ Mr. White mới thấy ô nhập từ khóa đoán; các người chơi khác thấy trạng thái chờ.
5. Khi ván kết thúc (Game Over): nổ pháo hoa Confetti và hiển thị đầy đủ bảng lật mở vai trò và từ khóa thật của toàn bộ người chơi.

---

### Task 1: Thiết lập Frontend Tooling (Vite, TailwindCSS, Lucide, Confetti, Happy-DOM)

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `index.html`
- Create: `src/index.css`

**Interfaces:**
- Produces: `npm run build` biên dịch được Vite bundle, TailwindCSS compile được CSS utilities, `happy-dom` sẵn sàng cho component testing.

- [ ] **Step 1: Cài đặt dependencies**
  Cài đặt `react-dom`, `@types/react-dom`, `lucide-react`, `canvas-confetti`, `@types/canvas-confetti`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `postcss`, `autoprefixer`, `happy-dom`.

- [ ] **Step 2: Tạo cấu hình `vite.config.ts`, `tailwind.config.js`, `postcss.config.js`**
  Cấu hình TailwindCSS với theme Detective Mystery (`slate-950`, `amber-400`, `cyan-400`, `rose-500`).

- [ ] **Step 3: Tạo `index.html` và `src/index.css`**
  Cấu hình viewport di động chống zoom `maximum-scale=1.0, user-scalable=no, viewport-fit=cover`, nạp Tailwind directives.

- [ ] **Step 4: Cập nhật scripts trong `package.json`**
  Thêm script `"dev": "vite"`, `"build": "tsc && vite build"`.

- [ ] **Step 5: Kiểm tra typecheck & test**
  Run: `npm run typecheck`
  Run: `npm test`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add package.json package-lock.json vite.config.ts tailwind.config.js postcss.config.js index.html src/index.css
  git commit -m "chore: setup vite, tailwindcss, and frontend tooling"
  ```

---

### Task 2: Hybrid Supabase Client Provider (`src/client/network/supabaseClient.ts`)

**Files:**
- Create: `src/client/network/supabaseClient.ts`
- Test: `tests/client/supabaseClient.test.ts`

**Interfaces:**
- Produces: `getSupabaseClient(clientId: string): SupabaseClient` tự động chuyển đổi giữa Real Supabase và BroadcastChannel/In-memory Hub.

- [ ] **Step 1: Viết failing test cho `supabaseClient.ts`**
  File `tests/client/supabaseClient.test.ts`:
  - Khi không có VITE_SUPABASE_URL: trả về fallback client hoạt động được qua Hub in-memory.
  - Khi có env vars: gọi createClient.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/supabaseClient.test.ts`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `src/client/network/supabaseClient.ts`**
  Tạo adapter Hybrid Supabase Client.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/supabaseClient.test.ts`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/network/supabaseClient.ts tests/client/supabaseClient.test.ts
  git commit -m "feat(network): implement hybrid supabase client provider"
  ```

---

### Task 3: Profile Setup & Room Lobby Components (`src/client/components/Lobby/`)

**Files:**
- Create: `src/client/components/Lobby/ProfileSetup.tsx`
- Create: `src/client/components/Lobby/RoomLobby.tsx`
- Test: `tests/client/ui/Lobby.test.tsx`

**Interfaces:**
- Produces:
  - `ProfileSetup`: Chọn avatar từ bộ 8 icon động vật mật vụ, nhập nickname, lưu `localStorage`.
  - `RoomLobby`: Tạo phòng (sinh mã 6 ký tự) hoặc Nhập mã phòng để tham gia.

- [ ] **Step 1: Viết failing test cho `ProfileSetup` và `RoomLobby`**
  File `tests/client/ui/Lobby.test.tsx`:
  - Kiểm tra chọn avatar và nhập nickname gọi `onSaveProfile`.
  - Kiểm tra nút Tạo phòng sinh mã 6 ký tự.
  - Kiểm tra nhập mã phòng gọi `onJoinRoom`.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/Lobby.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `ProfileSetup.tsx` và `RoomLobby.tsx`**
  Giao diện tối ưu Mobile-First, màu sắc trinh thám sang trọng.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/ui/Lobby.test.tsx`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Lobby/ProfileSetup.tsx src/client/components/Lobby/RoomLobby.tsx tests/client/ui/Lobby.test.tsx
  git commit -m "feat(ui): implement ProfileSetup and RoomLobby components"
  ```

---

### Task 4: Sảnh Chờ & Cài Đặt Phòng (`src/client/components/Lobby/WaitingRoom.tsx`)

**Files:**
- Create: `src/client/components/Lobby/WaitingRoom.tsx`
- Test: `tests/client/ui/WaitingRoom.test.tsx`

**Interfaces:**
- Produces: `WaitingRoom` hiển thị danh sách người chơi, cài đặt luật chơi cho Host, và nút bắt đầu ván.

- [ ] **Step 1: Viết failing test cho `WaitingRoom`**
  File `tests/client/ui/WaitingRoom.test.tsx`:
  - Hiển thị danh sách presence (avatar, tên, nhãn Host).
  - Nút Start Game bị disabled khi số người chơi < 3.
  - Nút Start Game active khi có từ 3 đến 10 người và chỉ Host mới bấm được.
  - Host có thể chỉnh số lượng Gián điệp và bật/tắt Mr. White.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/WaitingRoom.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `WaitingRoom.tsx`**
  Layout thẻ danh sách, sao chép Room Code 1-click, bảng cài đặt toggle.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/ui/WaitingRoom.test.tsx`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Lobby/WaitingRoom.tsx tests/client/ui/WaitingRoom.test.tsx
  git commit -m "feat(ui): implement WaitingRoom component with host controls"
  ```

---

### Task 5: Chạm & Giữ Xem Từ Khóa Bí Mật (`src/client/components/Game/SecretWordCard.tsx`)

**Files:**
- Create: `src/client/components/Game/SecretWordCard.tsx`
- Test: `tests/client/ui/SecretWordCard.test.tsx`

**Interfaces:**
- Produces: `SecretWordCard` với tương tác Press & Hold to Reveal chống nhìn lén.

- [ ] **Step 1: Viết failing test cho `SecretWordCard`**
  File `tests/client/ui/SecretWordCard.test.tsx`:
  - Ở trạng thái bình thường: từ khóa và vai trò bị che khuất (`TOP SECRET`).
  - Khi kích hoạt pointerDown: từ khóa và vai trò hiện ra.
  - Khi kích hoạt pointerUp hoặc pointerLeave: từ khóa ngay lập tức bị ẩn đi.
  - Hiển thị hướng dẫn đặc biệt cho Mr. White.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/SecretWordCard.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `SecretWordCard.tsx`**
  Hiệu ứng phong bì mật vụ đóng dấu đỏ, hỗ trợ rung haptic feedback.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/ui/SecretWordCard.test.tsx`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Game/SecretWordCard.tsx tests/client/ui/SecretWordCard.test.tsx
  git commit -m "feat(ui): implement anti-peeking SecretWordCard component"
  ```

---

### Task 6: Vòng Mô Tả & Bỏ Phiếu Kín (`DescribingView.tsx`, `VotingView.tsx`, `VoteResultModal.tsx`)

**Files:**
- Create: `src/client/components/Game/DescribingView.tsx`
- Create: `src/client/components/Game/VotingView.tsx`
- Create: `src/client/components/Game/VoteResultModal.tsx`
- Test: `tests/client/ui/DescribingAndVoting.test.tsx`

**Interfaces:**
- Produces:
  - `DescribingView`: Vòng tròn lượt nói, hiệu ứng phát sáng Pulse Glow, đếm ngược, nút nextTurn.
  - `VotingView`: Chọn nghi phạm, bỏ phiếu kín, chỉ báo tiến độ vote.
  - `VoteResultModal`: Bảng số phiếu, banner hòa phiếu hoặc đóng dấu trục xuất.

- [ ] **Step 1: Viết failing test cho Describing & Voting**
  File `tests/client/ui/DescribingAndVoting.test.tsx`:
  - DescribingView làm nổi bật người đang tới lượt nói; chỉ người đó mới thấy nút Next Turn.
  - VotingView cho phép click chọn người chơi và gọi `onVote`.
  - VoteResultModal hiển thị đúng banner hòa phiếu hoặc người bị loại.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/DescribingAndVoting.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `DescribingView.tsx`, `VotingView.tsx`, `VoteResultModal.tsx`**
  Giao diện tối ưu Mobile-First, thẻ nghi phạm trinh thám.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/ui/DescribingAndVoting.test.tsx`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Game/DescribingView.tsx src/client/components/Game/VotingView.tsx src/client/components/Game/VoteResultModal.tsx tests/client/ui/DescribingAndVoting.test.tsx
  git commit -m "feat(ui): implement DescribingView, VotingView, and VoteResultModal"
  ```

---

### Task 7: Modals: Mr. White Guess, Game Over (Confetti), Host Reconnect Overlay

**Files:**
- Create: `src/client/components/Game/MrWhiteModal.tsx`
- Create: `src/client/components/Game/GameOverModal.tsx`
- Create: `src/client/components/Game/HostReconnectOverlay.tsx`
- Test: `tests/client/ui/Modals.test.tsx`

**Interfaces:**
- Produces:
  - `MrWhiteModal`: Ô nhập từ khóa đoán cho Mr. White; spinner chờ cho người khác.
  - `GameOverModal`: Banner phe chiến thắng, bắn confetti, bảng lật mở 100% vai trò và từ khóa, nút chơi lại.
  - `HostReconnectOverlay`: Lớp phủ đếm ngược 30s khi Host mất mạng.

- [ ] **Step 1: Viết failing test cho các Modals**
  File `tests/client/ui/Modals.test.tsx`:
  - MrWhiteModal phân biệt màn hình của Mr. White và màn hình người chơi khác.
  - GameOverModal hiển thị đúng bảng danh sách vai trò và kích hoạt confetti.
  - HostReconnectOverlay hiển thị đồng hồ đếm ngược.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/Modals.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `MrWhiteModal.tsx`, `GameOverModal.tsx`, `HostReconnectOverlay.tsx`**
  Tích hợp `canvas-confetti`.

- [ ] **Step 4: Chạy test & typecheck để xác nhận pass**
  Run: `npx vitest run tests/client/ui/Modals.test.tsx`
  Run: `npm run typecheck`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/components/Game/MrWhiteModal.tsx src/client/components/Game/GameOverModal.tsx src/client/components/Game/HostReconnectOverlay.tsx tests/client/ui/Modals.test.tsx
  git commit -m "feat(ui): implement MrWhiteModal, GameOverModal, and HostReconnectOverlay"
  ```

---

### Task 8: App Orchestration, End-to-End UI Flow Integration & Build Verification

**Files:**
- Create: `src/client/App.tsx`
- Create: `src/main.tsx`
- Create: `tests/client/ui/AppFlow.test.tsx`

**Interfaces:**
- Produces: Ứng dụng web hoàn chỉnh chạy được trên trình duyệt (`npm run dev`) và build production bundle sạch sẽ (`npm run build`).

- [ ] **Step 1: Viết failing test cho AppFlow**
  File `tests/client/ui/AppFlow.test.tsx`:
  - Kiểm tra flow chuyển đổi từ ProfileSetup $\to$ Lobby $\to$ WaitingRoom $\to$ Game Views theo trạng thái của `useSpyRoom`.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Run: `npx vitest run tests/client/ui/AppFlow.test.tsx`
  Expected: FAIL.

- [ ] **Step 3: Triển khai `src/client/App.tsx` và `src/main.tsx`**
  Kết nối toàn bộ các component với `useSpyRoom` và `getSupabaseClient`.

- [ ] **Step 4: Chạy test & build verification**
  Run: `npm test` (toàn bộ test suite pass 100%)
  Run: `npm run typecheck` (0 errors)
  Run: `npm run build` (build bundle thành công)

- [ ] **Step 5: Commit**
  ```bash
  git add src/client/App.tsx src/main.tsx tests/client/ui/AppFlow.test.tsx
  git commit -m "feat(app): orchestrate full mobile web game flow in App.tsx"
  ```
