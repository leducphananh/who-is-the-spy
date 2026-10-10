import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { DescribingView } from '../../../src/client/components/Game/DescribingView.js';
import { VotingView } from '../../../src/client/components/Game/VotingView.js';
import { VoteResultModal } from '../../../src/client/components/Game/VoteResultModal.js';
import type { PublicPlayerState } from '../../../src/client/network/types.js';
import type { VoteResult } from '../../../src/core/types.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('DescribingView, VotingView & VoteResultModal Components', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const mockPlayers: PublicPlayerState[] = [
    {
      id: 'p1',
      name: 'Sherlock',
      avatar: 'fox',
      isAlive: true,
      hasVoted: false,
    },
    {
      id: 'p2',
      name: 'Watson',
      avatar: 'owl',
      isAlive: true,
      hasVoted: false,
    },
    {
      id: 'p3',
      name: 'Moriarty',
      avatar: 'wolf',
      isAlive: true,
      hasVoted: false,
    },
  ];

  describe('DescribingView', () => {
    it('hiển thị nút Hoàn thành mô tả khi đến lượt của mình', async () => {
      const onNext = vi.fn();
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <DescribingView
            roundNumber={1}
            currentDescriberIndex={0}
            players={mockPlayers}
            myUserId="p1"
            mySecret={{ role: 'CIVILIAN', word: 'Trà đá' }}
            onNextDescribe={onNext}
          />
        );
      });

      expect(container.textContent).toContain('Vòng 1');
      expect(container.textContent).toContain('ĐANG ĐẾN LƯỢT BẠN');
      const nextBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Hoàn thành mô tả') || b.textContent?.includes('Chuyển lượt')
      );
      expect(nextBtn).toBeDefined();

      await act(async () => {
        nextBtn?.click();
      });
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('hiển thị trạng thái lắng nghe khi đến lượt người khác', async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <DescribingView
            roundNumber={1}
            currentDescriberIndex={1}
            players={mockPlayers}
            myUserId="p1"
            mySecret={{ role: 'CIVILIAN', word: 'Trà đá' }}
            onNextDescribe={vi.fn()}
          />
        );
      });

      expect(container.textContent).toContain('Watson đang mô tả');
      const nextBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Hoàn thành mô tả')
      );
      expect(nextBtn).toBeUndefined();
    });
  });

  describe('VotingView', () => {
    it('cho phép chọn nghi phạm và xác nhận bỏ phiếu', async () => {
      const onVote = vi.fn();
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <VotingView
            players={mockPlayers}
            myUserId="p1"
            hasVoted={false}
            onCastVote={onVote}
          />
        );
      });

      // Target Moriarty (p3)
      const moriartyCard = container.querySelector('[data-testid="suspect-p3"]') as HTMLElement;
      expect(moriartyCard).not.toBeNull();

      await act(async () => {
        moriartyCard.click();
      });

      const confirmVoteBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('XÁC NHẬN BỎ PHIẾU')
      );
      expect(confirmVoteBtn).toBeDefined();

      await act(async () => {
        confirmVoteBtn?.click();
      });
      expect(onVote).toHaveBeenCalledWith('p3');
    });

    it('hiển thị trạng thái đã bỏ phiếu và khóa chọn lại', async () => {
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <VotingView
            players={mockPlayers}
            myUserId="p1"
            hasVoted={true}
            myVoteTargetId="p3"
            onCastVote={vi.fn()}
          />
        );
      });

      expect(container.textContent).toContain('Đã ghi nhận phiếu bầu của bạn');
    });
  });

  describe('VoteResultModal', () => {
    it('hiển thị banner Hòa phiếu khi isTie = true', async () => {
      const tieResult: VoteResult = {
        isTie: true,
        eliminatedPlayerId: null,
        tiePlayerIds: ['p1', 'p2'],
        voteCounts: { p1: 1, p2: 1, p3: 0 },
      };

      const root = createRoot(container);
      await act(async () => {
        root.render(
          <VoteResultModal
            result={tieResult}
            players={mockPlayers}
            isHost={true}
            onProceed={vi.fn()}
          />
        );
      });

      expect(container.textContent).toContain('HÒA PHIẾU');
      expect(container.textContent).toContain('Không ai bị loại');
    });

    it('hiển thị người bị loại khi eliminatedPlayerId có giá trị', async () => {
      const eliminatedResult: VoteResult = {
        isTie: false,
        eliminatedPlayerId: 'p3',
        tiePlayerIds: [],
        voteCounts: { p1: 0, p2: 1, p3: 2 },
      };

      const onProceed = vi.fn();
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <VoteResultModal
            result={eliminatedResult}
            players={mockPlayers}
            isHost={true}
            onProceed={onProceed}
          />
        );
      });

      expect(container.textContent).toContain('Moriarty');
      expect(container.textContent).toContain('BỊ TRỤC XUẤT');

      const proceedBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Tiếp tục') || b.textContent?.includes('TIẾP TỤC')
      );
      expect(proceedBtn).toBeDefined();

      await act(async () => {
        proceedBtn?.click();
      });
      expect(onProceed).toHaveBeenCalledTimes(1);
    });
  });
});
