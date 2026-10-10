# Design Document: Phase 4 — Custom Words Pack, Web Audio SFX & Playwright E2E Testing

**Tác giả:** Antigravity Agent  
**Ngày:** 2026-10-10  
**Trạng thái:** Chờ phê duyệt (Pending Review)  
**Tài liệu liên quan:** `docs/superpowers/specs/2026-10-10-mobile-web-ui-design.md`, `src/client/network/SpyRoomController.ts`

---

## 1. Tổng quan & Mục tiêu (Overview & Goals)

Phase 4 nâng cấp trải nghiệm của game "Ai Là Gián Điệp" lên chuẩn hoàn thiện, cá nhân hóa cao và tự động hóa kiểm thử trọn vẹn:
1. **Custom Words Engine & Pack Manager**: Cho phép Host tự do tùy biến kho từ vựng (Nhập nhanh 1 cặp từ ngay tại phòng chờ hoặc tạo các bộ gói từ tùy biến lưu vào `localStorage`).
2. **Web Audio Pure Synthesis SFX**: Hệ thống âm thanh kịch tính được tổng hợp 100% bằng Web Audio API (không tải tài nguyên ngoài, 0kb bundle assets, tương thích mobile không lo lỗi Autoplay policy).
3. **Multi-Tab Playwright E2E Testing**: Bộ kịch bản kiểm thử End-to-End tự động điều khiển đồng thời 4 phiên trình duyệt mô phỏng trọn vẹn 1 ván đấu thực tế qua kênh BroadcastChannel / Local Hub.

---

## 2. Kiến trúc & Thiết kế Chi tiết (Detailed Architecture)

### 2.1. Quản lý Từ khóa Tùy chỉnh (Custom Words & Packs)

#### 2.1.1. Data Model
```typescript
export interface CustomWordPack {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  pairs: WordPair[];
}
```
Lưu trữ trong `localStorage` với key: `CUSTOM_WORD_PACKS_KEY = 'spy_custom_word_packs'`.

#### 2.1.2. WaitingRoom Quick-Input & Modal Manager
- **Ô Nhập Nhanh (Quick Custom Pair)**:
  - Nằm trong `WaitingRoom.tsx` (chỉ hiển thị cho Host).
  - Có toggle: "Tự chỉ định từ khóa cho ván này" (Bật / Tắt).
  - Khi bật: hiển thị 2 ô input: `Từ Dân Thường` & `Từ Gián Điệp`.
  - Validate: Cả 2 từ phải có độ dài từ 2 đến 30 ký tự và không được trùng nhau.
- **WordPackModal (`src/client/components/Lobby/WordPackModal.tsx`)**:
  - Giao diện quản lý danh sách Pack: Tạo pack mới, đổi tên, xóa pack.
  - Quản lý danh sách cặp từ trong pack: Thêm cặp từ (Civilian / Spy / Category), xóa cặp từ.
  - Chọn Pack hoạt động: Host có thể tick chọn 1 Pack làm kho từ mặc định thay cho kho hệ thống.

#### 2.1.3. Tích hợp Core & Controller
- Cập nhật `src/core/wordBank.ts`:
  ```typescript
  export function getRandomWordPair(
    pairs: readonly WordPair[] = WORD_PAIRS,
    rng: () => number = Math.random
  ): WordPair;
  ```
- Cập nhật `SpyRoomController.startGame(config: GameConfig, customPair?: WordPair, customPack?: WordPair[])`:
  - Nếu `customPair` được cung cấp $\to$ dùng trực tiếp.
  - Nếu `customPack` có từ $\to$ gọi `getRandomWordPair(customPack)`.
  - Mặc định $\to$ gọi `getRandomWordPair(WORD_PAIRS)`.

---

### 2.2. Hệ Thống Âm Thanh (Web Audio SFX Engine)

#### 2.2.1. Nguyên lý Thiết kế & Tương thích Di động
- **Pure Web Audio API**: Sử dụng `AudioContext`, `OscillatorNode` (`sine`, `triangle`, `square`, `sawtooth`), `BiquadFilterNode`, và `GainNode` để tổng hợp sóng âm.
- **Autoplay Policy Safe**:
  - `soundEffects.ts` lắng nghe sự kiện `pointerdown` hoặc `click` đầu tiên của người dùng trên `window` để gọi `audioContext.resume()`.
  - Cung cấp hàm `ensureAudioReady()`.
- **Mute / Unmute Toggle**:
  - Lưu trạng thái vào `localStorage` (`SPY_SFX_ENABLED_KEY`).
  - Nút biểu tượng Loa bật/tắt âm thanh trên Brand Header (`App.tsx`).

#### 2.2.2. Danh mục Âm thanh (Sound Palette)
1. `playTick()`: Tần số cao ngắn (880Hz $\to$ 440Hz trong 0.05s) tạo tiếng tích tắc đếm ngược kịch tính.
2. `playRoleReveal()`: Sóng triangle kết hợp low-pass filter tần số quét từ 200Hz lên 800Hz tạo âm sắc mở mật thư huyền bí.
3. `playTurnAlert()`: Hợp âm đôi (523Hz `C5` và 659Hz `E5`) ngân vang êm dịu báo hiệu đến lượt phát biểu.
4. `playGavel()`: Sóng sine trầm (120Hz $\to$ 40Hz) kết hợp xung dội nhanh tạo tiếng búa gõ phán quyết trầm đục.
5. `playTie()`: Hợp âm hòa hoãn thư thái (392Hz $\to$ 330Hz) khi kết quả hòa phiếu.
6. `playVictory()`: Chuỗi hợp âm kèn ăn mừng (Fanfare: `C4` - `E4` - `G4` - `C5`) khi kết thúc ván đấu.

---

### 2.3. Playwright Multi-Context E2E Testing Harness

#### 2.3.1. Cấu hình Playwright
- File `playwright.config.ts`:
  - `webServer`: Tự động khởi chạy `npm run dev -- --port 5173` hoặc `npm run preview`.
  - `projects`: `chromium` headless.
  - `testDir`: `tests/e2e`.

#### 2.3.2. Kịch bản E2E Ván Đấu Hoàn Chỉnh (`tests/e2e/fullMatch.spec.ts`)
- Khởi tạo 4 Browser Contexts độc lập trong 1 test runner:
  - Context 1: **Host Cáo** (`fox`)
  - Context 2: **Watson Cú** (`owl`)
  - Context 3: **Moriarty Sói** (`wolf`)
  - Context 4: **Irene Mèo** (`cat`)
- Luồng kiểm thử chi tiết:
  1. Context 1 thiết lập profile $\to$ Tạo phòng $\to$ Lấy `roomCode`.
  2. Context 2, 3, 4 thiết lập profile $\to$ Vào phòng với `roomCode`.
  3. Context 1 thấy đủ 4 người trong `WaitingRoom` $\to$ Nhập nhanh từ khóa custom ("Cà phê" & "Trà đá") $\to$ Bấm "Bắt đầu trò chơi".
  4. Cả 4 context chuyển sang màn hình chơi $\to$ Thực hiện thao tác giữ phong bì (`pointerdown` / mouse click) để xác nhận xem từ khóa bí mật.
  5. Vòng mô tả: Lần lượt người đang đến lượt bấm "Hoàn thành mô tả & Chuyển lượt" cho đến khi hết vòng.
  6. Vòng bỏ phiếu: Cả 4 người chơi chọn nghi phạm và bấm "Xác nhận bỏ phiếu".
  7. Modal kết quả bỏ phiếu hiển thị trục xuất $\to$ Tiếp tục đến Game Over Modal hiển thị bảng lật mở vai trò.

---

## 3. Kế hoạch Kiểm thử & Tiêu chuẩn Nghiệm thu (Testing & Acceptance Criteria)

1. **Unit & Integration Tests (Vitest)**:
   - `tests/core/wordBank.test.ts`: Kiểm tra `getRandomWordPair` với custom word pairs.
   - `tests/client/soundEffects.test.ts`: Kiểm tra khởi tạo AudioContext, bật/tắt mute, gọi hàm phát không gây throw error.
   - `tests/client/ui/WordPackModal.test.tsx`: Kiểm tra thêm, sửa, xóa pack và lưu `localStorage`.
   - `tests/client/ui/WaitingRoomCustomWords.test.tsx`: Kiểm tra nhập nhanh từ custom và toggle.
2. **E2E Testing (Playwright)**:
   - Chạy lệnh `npx playwright test` $\to$ Toàn bộ kịch bản 4 người chơi PASS 100%.
3. **Build & Typecheck**:
   - `npm run typecheck` $\to$ 0 lỗi.
   - `npm run build` $\to$ bundle thành công.
