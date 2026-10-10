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
});
