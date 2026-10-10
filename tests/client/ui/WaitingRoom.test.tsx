import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { WaitingRoom } from '../../../src/client/components/Lobby/WaitingRoom.js';
import type { PlayerPresence } from '../../../src/client/network/types.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('WaitingRoom Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const mockPlayers: PlayerPresence[] = [
    {
      id: 'p1',
      name: 'Sherlock',
      avatar: 'fox',
      isHost: true,
      isReady: true,
      joinedAt: 1000,
      isAlive: true,
    },
    {
      id: 'p2',
      name: 'Watson',
      avatar: 'owl',
      isHost: false,
      isReady: true,
      joinedAt: 1001,
      isAlive: true,
    },
  ];

  it('hiển thị mã phòng và cảnh báo dưới 3 người chơi', async () => {
    const onStart = vi.fn();
    const onLeave = vi.fn();

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={mockPlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={onStart}
          onLeaveRoom={onLeave}
        />
      );
    });

    expect(container.textContent).toContain('SPY123');
    expect(container.textContent).toContain('Sherlock');
    expect(container.textContent).toContain('Watson');
    expect(container.textContent).toContain('Cần tối thiểu 3 người chơi để bắt đầu');

    const startBtn = container.querySelector('button:disabled');
    expect(startBtn).not.toBeNull();
  });

  it('cho phép Host bắt đầu khi có đủ 3 người chơi', async () => {
    const onStart = vi.fn();
    const threePlayers: PlayerPresence[] = [
      ...mockPlayers,
      {
        id: 'p3',
        name: 'Moriarty',
        avatar: 'wolf',
        isHost: false,
        isReady: true,
        joinedAt: 1002,
        isAlive: true,
      },
    ];

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={threePlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={onStart}
          onLeaveRoom={vi.fn()}
        />
      );
    });

    const startBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('BẮT ĐẦU TRÒ CHƠI')
    );
    expect(startBtn).toBeDefined();
    expect(startBtn?.hasAttribute('disabled')).toBe(false);

    await act(async () => {
      startBtn?.click();
    });
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('hiển thị banner chờ đối với người chơi không phải là host', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p2"
          isHost={false}
          players={mockPlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
        />
      );
    });

    expect(container.textContent).toContain('Đang chờ chủ phòng bắt đầu trò chơi...');
    const startBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('BẮT ĐẦU TRÒ CHƠI')
    );
    expect(startBtn).toBeUndefined();
  });

  it('gọi onUpdateConfig khi Host bấm đổi chế độ Mr. White', async () => {
    const onUpdateConfig = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={mockPlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onUpdateConfig={onUpdateConfig}
          onStartGame={vi.fn()}
          onLeaveRoom={vi.fn()}
        />
      );
    });

    const toggleBtn = container.querySelector('button.relative.inline-flex') as HTMLButtonElement;
    expect(toggleBtn).not.toBeNull();

    await act(async () => {
      toggleBtn.click();
    });

    expect(onUpdateConfig).toHaveBeenCalledWith({
      spyCount: 1,
      hasMrWhite: true,
    });
  });

  it('gọi onLeaveRoom khi bấm nút rời phòng', async () => {
    const onLeave = vi.fn();
    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WaitingRoom
          roomCode="SPY123"
          myUserId="p1"
          isHost={true}
          players={mockPlayers}
          config={{ spyCount: 1, hasMrWhite: false }}
          onStartGame={vi.fn()}
          onLeaveRoom={onLeave}
        />
      );
    });

    const leaveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Rời phòng')
    );
    expect(leaveBtn).toBeDefined();

    await act(async () => {
      leaveBtn?.click();
    });
    expect(onLeave).toHaveBeenCalledTimes(1);
  });
});
