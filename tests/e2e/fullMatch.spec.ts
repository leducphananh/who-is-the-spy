import { test, expect } from '@playwright/test';

test.describe('Ai Là Gián Điệp - Full 4-Player Match E2E Flow', () => {
  test('chơi trọn vẹn 1 ván đấu với 4 người chơi trên các context độc lập', async ({ browser }) => {
    // 1. Tạo 4 context độc lập đại diện cho 4 thiết bị người chơi thực tế
    const c1 = await browser.newContext();
    const c2 = await browser.newContext();
    const c3 = await browser.newContext();
    const c4 = await browser.newContext();

    const p1 = await c1.newPage();
    const p2 = await c2.newPage();
    const p3 = await c3.newPage();
    const p4 = await c4.newPage();

    p1.on('console', msg => console.log('[p1 browser]', msg.text()));
    p2.on('console', msg => console.log('[p2 browser]', msg.text()));
    p3.on('console', msg => console.log('[p3 browser]', msg.text()));
    p4.on('console', msg => console.log('[p4 browser]', msg.text()));

    // Context 1: Host Cáo tạo profile và tạo phòng
    await p1.goto('/');
    await p1.fill('#nickname-input', 'Host Cáo');
    await p1.click('button:has-text("Xác Nhận & Tiếp Tục")');

    await expect(p1.locator('text=Host Cáo')).toBeVisible();
    await p1.click('button:has-text("Tạo Phòng Ngay")');

    // Chờ xuất hiện mã phòng 6 ký tự
    await expect(p1.locator('text=Mã phòng mật vụ')).toBeVisible();
    const roomCodeElement = p1.locator('.font-mono.text-amber-400');
    await expect(roomCodeElement).toBeVisible();
    const roomCode = (await roomCodeElement.innerText()).trim();
    expect(roomCode.length).toBe(6);

    // Context 2, 3, 4: Vào phòng với roomCode
    const guests = [
      { page: p2, name: 'Watson Cú', avatarIndex: 2 },
      { page: p3, name: 'Moriarty Sói', avatarIndex: 3 },
      { page: p4, name: 'Irene Mèo', avatarIndex: 1 },
    ];

    for (const g of guests) {
      await g.page.goto('/');
      const avatarButtons = g.page.locator('form button[type="button"]');
      await avatarButtons.nth(g.avatarIndex).click();
      await g.page.fill('#nickname-input', g.name);
      await g.page.click('button:has-text("Xác Nhận & Tiếp Tục")');

      // Chuyển sang tab Vào phòng
      await g.page.click('button:has-text("Vào Phòng")');
      await g.page.fill('input[placeholder*="SPY"]', roomCode);
      await g.page.click('button:has-text("Tham Gia Phòng")');

      // Xác nhận đã vào sảnh chờ
      await expect(g.page.locator(`text=${roomCode}`)).toBeVisible();
    }

    // Host kiểm tra đã thấy đủ 4 người
    await expect(p1.locator('text=Danh sách Mật vụ (4/10)')).toBeVisible({ timeout: 10000 });

    // Host bật tùy chọn tự nhập từ cho ván này
    await p1.click('[data-testid="toggle-quick-word"]');
    await p1.fill('[data-testid="quick-civ-word"]', 'Cà phê');
    await p1.fill('[data-testid="quick-spy-word"]', 'Trà đá');

    // Host bấm Bắt đầu ván đấu
    await p1.click('button:has-text("BẮT ĐẦU TRÒ CHƠI")');

    // Cả 4 trang đều chuyển sang màn hình chơi Vòng 1: Mô Tả
    const allPages = [p1, p2, p3, p4];
    for (const page of allPages) {
      await expect(page.locator('text=Vòng 1: Mô Tả')).toBeVisible({ timeout: 10000 });
    }

    // Vòng Mô Tả: lần lượt người đang đến lượt bấm hoàn thành mô tả
    for (let turn = 0; turn < 4; turn++) {
      let clickedPage: (typeof allPages)[number] | null = null;
      for (let attempt = 0; attempt < 50; attempt++) {
        for (let i = 0; i < allPages.length; i++) {
          const page = allPages[i]!;
          const nextTurnBtn = page.locator('button:has-text("Hoàn thành mô tả & Chuyển lượt")');
          if (await nextTurnBtn.isVisible()) {
            await nextTurnBtn.click();
            clickedPage = page;
            break;
          }
        }
        if (clickedPage) break;
        await p1.waitForTimeout(100);
      }
      expect(clickedPage).not.toBeNull();
      console.log(`[E2E] Turn ${turn} clicked on page p${allPages.indexOf(clickedPage!) + 1}`);
      // Chờ cho nút trên trang vừa click ẩn đi trước khi chuyển lượt kế tiếp
      await expect(
        clickedPage!.locator('button:has-text("Hoàn thành mô tả & Chuyển lượt")')
      ).toBeHidden({ timeout: 10000 });
      await p1.waitForTimeout(300);
    }

    // Sau khi 4 người mô tả xong, hệ thống chuyển sang VÒNG BỎ PHIẾU
    for (const page of allPages) {
      await expect(page.locator('text=Bỏ Phiếu Loại Trừ')).toBeVisible({ timeout: 10000 });
    }

    // Tất cả người chơi bỏ phiếu
    for (let pIdx = 0; pIdx < allPages.length; pIdx++) {
      const page = allPages[pIdx]!;
      const suspects = page.locator('[data-testid^="suspect-"]');
      const count = await suspects.count();
      for (let i = 0; i < count; i++) {
        const item = suspects.nth(i);
        const isMe = await item.locator('text=Bạn').count();
        if (isMe === 0) {
          await item.click();
          break;
        }
      }
      const confirmBtn = page.locator('button:has-text("XÁC NHẬN BỎ PHIẾU")');
      await expect(confirmBtn).toBeEnabled({ timeout: 5000 });
      await confirmBtn.click();
      await expect(confirmBtn).toBeHidden({ timeout: 10000 });
      await p1.waitForTimeout(300);
    }

    // Cả 4 trang hiển thị Modal kết quả bỏ phiếu (VoteResultModal) hoặc Màn hình kết thúc trận đấu (GameOverModal)
    for (const page of allPages) {
      const outcomeLocator = page
        .locator('text=CHIẾN THẮNG')
        .or(page.locator('text=BỊ TRỤC XUẤT'))
        .or(page.locator('text=HÒA PHIẾU'))
        .or(page.locator('button:has-text("TIẾP TỤC")'))
        .or(page.locator('button:has-text("CHƠI LẠI VÁN MỚI")'));
      await expect(outcomeLocator.first()).toBeVisible({ timeout: 10000 });
    }

    // Đóng browser contexts
    await Promise.all([c1.close(), c2.close(), c3.close(), c4.close()]);
  });
});
