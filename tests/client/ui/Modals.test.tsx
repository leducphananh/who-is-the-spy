import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MrWhiteModal } from '../../../src/client/components/Game/MrWhiteModal.js';
import { GameOverModal } from '../../../src/client/components/Game/GameOverModal.js';
import { HostReconnectOverlay } from '../../../src/client/components/Game/HostReconnectOverlay.js';
import type { PublicPlayerState } from '../../../src/client/network/types.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('Modals: MrWhiteModal, GameOverModal, HostReconnectOverlay', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const mockGameOverPlayers: PublicPlayerState[] = [
    {
      id: 'p1',
      name: 'Sherlock',
      avatar: 'fox',
      isAlive: true,
      hasVoted: true,
      revealedRole: 'CIVILIAN',
      revealedWord: 'Cà phê',
    },
    {
      id: 'p2',
      name: 'Watson',
      avatar: 'owl',
      isAlive: true,
      hasVoted: true,
      revealedRole: 'SPY',
      revealedWord: 'Trà đá',
    },
    {
      id: 'p3',
      name: 'Moriarty',
      avatar: 'wolf',
      isAlive: false,
      hasVoted: true,
      revealedRole: 'MR_WHITE',
      revealedWord: '',
    },
  ];

  describe('MrWhiteModal', () => {
    it('hiển thị ô nhập từ khóa cho chính Mr. White và gọi onSubmitGuess', async () => {
      const onSubmit = vi.fn();
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <MrWhiteModal
            isMrWhite={true}
            mrWhitePlayerName="Moriarty"
            onSubmitGuess={onSubmit}
          />
        );
      });

      expect(container.textContent).toContain('CƠ HỘI ĐOÁN TỪ');
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input).not.toBeNull();

      await act(async () => {
        const nativeSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        nativeSetter?.call(input, 'Cà phê');
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });

      const submitBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('XÁC NHẬN') || b.textContent?.includes('ĐOÁN TỪ')
      );
      expect(submitBtn).toBeDefined();

      await act(async () => {
        submitBtn?.click();
      });
      expect(onSubmit).toHaveBeenCalledWith('Cà phê');
    });

    it('hiển thị màn hình chờ khi người chơi khác nhìn Mr. White đoán từ', async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <MrWhiteModal
            isMrWhite={false}
            mrWhitePlayerName="Moriarty"
            onSubmitGuess={vi.fn()}
          />
        );
      });

      expect(container.textContent).toContain('Moriarty đang đoán từ');
      expect(container.querySelector('input')).toBeNull();
    });
  });

  describe('GameOverModal', () => {
    it('hiển thị danh tính phe chiến thắng và danh sách đầy đủ vai trò', async () => {
      const onPlayAgain = vi.fn();
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <GameOverModal
            winner="CIVILIANS"
            players={mockGameOverPlayers}
            isHost={true}
            onPlayAgain={onPlayAgain}
          />
        );
      });

      expect(container.textContent).toContain('DÂN THƯỜNG CHIẾN THẮNG');
      expect(container.textContent).toContain('Sherlock');
      expect(container.textContent).toContain('Cà phê');
      expect(container.textContent).toContain('Watson');
      expect(container.textContent).toContain('Trà đá');

      const replayBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('CHƠI LẠI') || b.textContent?.includes('VÁN MỚI')
      );
      expect(replayBtn).toBeDefined();

      await act(async () => {
        replayBtn?.click();
      });
      expect(onPlayAgain).toHaveBeenCalledTimes(1);
    });
  });

  describe('HostReconnectOverlay', () => {
    it('hiển thị thông báo mất kết nối và số giây đếm ngược còn lại', async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <HostReconnectOverlay
            secondsRemaining={25}
            isOldHost={false}
          />
        );
      });

      expect(container.textContent).toContain('Chủ phòng tạm thời mất kết nối');
      expect(container.textContent).toContain('25s');
    });
  });
});
