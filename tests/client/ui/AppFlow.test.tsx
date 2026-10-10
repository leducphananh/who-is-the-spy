import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../../../src/client/App.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

describe('App Flow & Orchestration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  it('bắt đầu từ ProfileSetup khi chưa có profile trong localStorage', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('AI LÀ GIÁN ĐIỆP');
    expect(container.textContent).toContain('Hồ Sơ Mật Vụ');
    expect(container.textContent).toContain('Chọn Avatar Điệp Viên');
  });

  it('chuyển sang RoomLobby khi đã lưu profile', async () => {
    localStorage.setItem(
      'spy_user_profile',
      JSON.stringify({ name: 'Thám tử Moriarty', avatar: 'wolf' })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    expect(container.textContent).toContain('Thám tử Moriarty');
    expect(container.textContent).toContain('Tạo Phòng');
    expect(container.textContent).toContain('Vào Phòng');
  });

  it('khi bấm Tạo Phòng Ngay thì khởi tạo phòng và chuyển sang WaitingRoom', async () => {
    localStorage.setItem(
      'spy_user_profile',
      JSON.stringify({ name: 'Sherlock Holmes', avatar: 'fox' })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    const createBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Tạo Phòng Ngay')
    );
    expect(createBtn).toBeDefined();

    await act(async () => {
      createBtn?.click();
    });

    // Sau khi tạo phòng, chuyển sang WaitingRoom
    expect(container.textContent).toContain('Mã phòng mật vụ');
    expect(container.textContent).toContain('Sherlock Holmes');
    expect(container.textContent).toContain('Chủ phòng');
  });

  it('tự động khôi phục ván đấu khi phát hiện SPY_ACTIVE_SESSION trong sessionStorage (F5 persistence)', async () => {
    sessionStorage.setItem(
      'SPY_ACTIVE_SESSION',
      JSON.stringify({
        roomCode: 'F5ROOM',
        userId: 'usr_f5_test',
        name: 'James Bond',
        avatar: 'fox',
      })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    // Tự động vào phòng F5ROOM với tên James Bond mà không hiện ProfileSetup hay RoomLobby
    expect(container.textContent).toContain('Mã phòng mật vụ');
    expect(container.textContent).toContain('F5ROOM');
    expect(container.textContent).toContain('James Bond');
  });

  it('khi bấm Rời phòng thì dọn dẹp SPY_ACTIVE_SESSION trong sessionStorage', async () => {
    sessionStorage.setItem(
      'SPY_ACTIVE_SESSION',
      JSON.stringify({
        roomCode: 'LEAVEROOM',
        userId: 'usr_leave_test',
        name: 'James Bond',
        avatar: 'fox',
      })
    );

    const root = createRoot(container);
    await act(async () => {
      root.render(<App />);
    });

    const leaveBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Rời phòng')
    );
    expect(leaveBtn).toBeDefined();

    await act(async () => {
      leaveBtn?.click();
    });

    expect(sessionStorage.getItem('SPY_ACTIVE_SESSION')).toBeNull();
  });
});
