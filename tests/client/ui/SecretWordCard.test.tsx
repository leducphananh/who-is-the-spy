import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SecretWordCard } from '../../../src/client/components/Game/SecretWordCard.js';
import type { SecretWordPayload } from '../../../src/client/network/types.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('SecretWordCard Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const civilianSecret: SecretWordPayload = {
    role: 'CIVILIAN',
    word: 'Cà phê sữa',
  };

  const spySecret: SecretWordPayload = {
    role: 'SPY',
    word: 'Bạc xỉu',
  };

  const mrWhiteSecret: SecretWordPayload = {
    role: 'MR_WHITE',
    word: '',
  };

  it('ở trạng thái mặc định: từ khóa bị che khuất và hiển thị nhãn TUYỆT MẬT', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<SecretWordCard secret={civilianSecret} />);
    });

    expect(container.textContent).toContain('TUYỆT MẬT');
    expect(container.textContent).toContain('Chạm & giữ để xem');
    expect(container.textContent).not.toContain('Cà phê sữa');
  });

  it('khi chạm giữ pointerDown thì từ khóa hiển thị, nhả ra pointerUp thì che lại', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<SecretWordCard secret={civilianSecret} />);
    });

    const cardArea = container.querySelector('[data-testid="secret-card-area"]') as HTMLElement;
    expect(cardArea).not.toBeNull();

    // Trigger pointerdown
    await act(async () => {
      cardArea.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    });
    expect(container.textContent).toContain('Cà phê sữa');
    expect(container.textContent).toContain('DÂN THƯỜNG');

    // Trigger pointerup
    await act(async () => {
      cardArea.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    });
    expect(container.textContent).not.toContain('Cà phê sữa');
    expect(container.textContent).toContain('TUYỆT MẬT');
  });

  it('hiển thị hướng dẫn đặc biệt cho Mr. White khi reveal', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<SecretWordCard secret={mrWhiteSecret} />);
    });

    const cardArea = container.querySelector('[data-testid="secret-card-area"]') as HTMLElement;
    await act(async () => {
      cardArea.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    });

    expect(container.textContent).toContain('MR. WHITE');
    expect(container.textContent).toContain('Bạn không có từ khóa');
  });

  it('cho phép gọi onConfirmReady khi người chơi bấm nút đã sẵn sàng', async () => {
    const onConfirm = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(<SecretWordCard secret={spySecret} onConfirmReady={onConfirm} />);
    });

    const confirmBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Tôi đã ghi nhớ') || b.textContent?.includes('Sẵn sàng')
    );
    expect(confirmBtn).toBeDefined();

    await act(async () => {
      confirmBtn?.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
