import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { WaitingRoom } from '../../../src/client/components/Lobby/WaitingRoom.js';
import type { PlayerPresence } from '../../../src/client/network/types.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('WaitingRoom Custom Words & Word Pack Integration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const threePlayers: PlayerPresence[] = [
    { id: 'p1', name: 'Sherlock', avatar: 'fox', isHost: true, isReady: true, joinedAt: 1000, isAlive: true },
    { id: 'p2', name: 'Watson', avatar: 'owl', isHost: false, isReady: true, joinedAt: 1001, isAlive: true },
    { id: 'p3', name: 'Moriarty', avatar: 'wolf', isHost: false, isReady: true, joinedAt: 1002, isAlive: true },
  ];

  it('hiển thị nút Quản lý gói từ và cho phép mở modal', async () => {
    const onOpenPacks = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={threePlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
          onOpenWordPackModal={onOpenPacks}
        />
      );
    });

    const packBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Gói từ') || b.textContent?.includes('Kho từ')
    );
    expect(packBtn).toBeDefined();

    await act(async () => {
      packBtn?.click();
    });
    expect(onOpenPacks).toHaveBeenCalledTimes(1);
  });

  it('cho phép Host bật nhập từ nhanh và thông báo lỗi nếu 2 từ trùng nhau', async () => {
    const onQuickWordChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={threePlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
          onQuickWordPairChange={onQuickWordChange}
        />
      );
    });

    const toggleQuickWord = container.querySelector('[data-testid="toggle-quick-word"]') as HTMLInputElement;
    expect(toggleQuickWord).not.toBeNull();

    await act(async () => {
      toggleQuickWord.click();
    });

    const civInput = container.querySelector('[data-testid="quick-civ-word"]') as HTMLInputElement;
    const spyInput = container.querySelector('[data-testid="quick-spy-word"]') as HTMLInputElement;
    expect(civInput).not.toBeNull();
    expect(spyInput).not.toBeNull();

    // Nhập 2 từ trùng nhau
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
      setter?.call(civInput, 'Cà phê');
      civInput.dispatchEvent(new Event('input', { bubbles: true }));
      setter?.call(spyInput, 'Cà phê');
      spyInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).toContain('không được trùng nhau');

    // Nút bắt đầu bị disabled khi có lỗi từ khóa
    const startBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('BẮT ĐẦU TRÒ CHƠI')
    );
    expect(startBtn?.hasAttribute('disabled')).toBe(true);

    // Sửa từ gián điệp hợp lệ
    await act(async () => {
      setter?.call(spyInput, 'Trà sữa');
      spyInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(container.textContent).not.toContain('không được trùng nhau');
    expect(onQuickWordChange).toHaveBeenCalled();
  });

  it('cho phép gọi AI gợi ý cặp từ theo chế độ Blind Pick (niêm phong từ khóa không lộ ra màn hình)', async () => {
    const geminiWords = await import('../../../src/client/lib/geminiWords.js');
    const mockGenerate = vi.spyOn(geminiWords, 'generateCustomWordPair').mockResolvedValue({
      id: 'ai-1',
      civilianWord: 'Phở bò',
      spyWord: 'Bún bò Huế',
      category: 'Ẩm thực',
    });

    const onQuickWordChange = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={threePlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
          onQuickWordPairChange={onQuickWordChange}
        />
      );
    });

    const toggleQuickWord = container.querySelector('[data-testid="toggle-quick-word"]') as HTMLInputElement;
    await act(async () => {
      toggleQuickWord.click();
    });

    const aiTopicInput = container.querySelector('[data-testid="ai-topic-input"]') as HTMLInputElement;
    const aiBtn = container.querySelector('[data-testid="ai-suggest-btn"]') as HTMLButtonElement;
    expect(aiTopicInput).not.toBeNull();
    expect(aiBtn).not.toBeNull();

    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    await act(async () => {
      setter?.call(aiTopicInput, 'Ẩm thực');
      aiTopicInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      aiBtn.click();
    });

    expect(mockGenerate).toHaveBeenCalledWith('Ẩm thực');

    // 1. Thẻ niêm phong mật thư hiển thị
    const sealedCard = container.querySelector('[data-testid="sealed-mystery-card"]');
    expect(sealedCard).not.toBeNull();
    expect(container.textContent).toContain('Mật thư bí mật đã được niêm phong');
    expect(container.textContent).toContain('Ẩm thực');

    // 2. Tuyệt đối KHÔNG lộ từ khóa ra màn hình
    expect(container.textContent).not.toContain('Phở bò');
    expect(container.textContent).not.toContain('Bún bò Huế');
    expect(container.querySelector('[data-testid="quick-civ-word"]')).toBeNull();
    expect(container.querySelector('[data-testid="quick-spy-word"]')).toBeNull();

    // 3. Ván đấu đủ điều kiện bắt đầu (canStart = true)
    const startBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('BẮT ĐẦU TRÒ CHƠI')
    );
    expect(startBtn?.hasAttribute('disabled')).toBe(false);

    // 4. Cặp từ bí mật vẫn được chuyển lên onQuickWordChange
    expect(onQuickWordChange).toHaveBeenCalledWith(
      expect.objectContaining({
        civilianWord: 'Phở bò',
        spyWord: 'Bún bò Huế',
        category: 'Ẩm thực',
      })
    );

    // 5. Mở xem từ khóa (Game Master Mode)
    const revealToggle = container.querySelector('[data-testid="toggle-reveal-words"]') as HTMLInputElement;
    expect(revealToggle).not.toBeNull();
    await act(async () => {
      revealToggle.click();
    });

    const civInput = container.querySelector('[data-testid="quick-civ-word"]') as HTMLInputElement;
    const spyInput = container.querySelector('[data-testid="quick-spy-word"]') as HTMLInputElement;
    expect(civInput).not.toBeNull();
    expect(spyInput).not.toBeNull();
    expect(civInput.value).toBe('Phở bò');
    expect(spyInput.value).toBe('Bún bò Huế');

    // 6. Niêm phong lại mật thư
    const resealBtn = container.querySelector('[data-testid="reseal-mystery-btn"]') as HTMLButtonElement;
    expect(resealBtn).not.toBeNull();
    await act(async () => {
      resealBtn.click();
    });

    expect(container.querySelector('[data-testid="sealed-mystery-card"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Phở bò');

    mockGenerate.mockRestore();
  });

  it('xử lý và hiển thị thông báo lỗi khi AI gợi ý thất bại', async () => {
    const geminiWords = await import('../../../src/client/lib/geminiWords.js');
    const mockGenerate = vi.spyOn(geminiWords, 'generateCustomWordPair').mockRejectedValue(
      new Error('Chưa cấu hình API Key')
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={threePlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
        />
      );
    });

    const toggleQuickWord = container.querySelector('[data-testid="toggle-quick-word"]') as HTMLInputElement;
    await act(async () => {
      toggleQuickWord.click();
    });

    const aiBtn = container.querySelector('[data-testid="ai-suggest-btn"]') as HTMLButtonElement;
    await act(async () => {
      aiBtn.click();
    });

    const errorMsg = container.querySelector('[data-testid="ai-error-msg"]');
    expect(errorMsg).not.toBeNull();
    expect(errorMsg?.textContent).toContain('Chưa cấu hình API Key');

    mockGenerate.mockRestore();
  });
});
