import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  WordPackModal,
  CUSTOM_WORD_PACKS_KEY,
  type CustomWordPack,
} from '../../../src/client/components/Lobby/WordPackModal.js';

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('WordPackModal Component', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  });

  const samplePacks: CustomWordPack[] = [
    {
      id: 'pack-it',
      name: 'Chuyên ngành IT',
      createdAt: 1000,
      pairs: [
        {
          id: 'p-1',
          civilianWord: 'Bug',
          spyWord: 'Feature',
          category: 'IT',
        },
      ],
    },
  ];

  it('không render gì khi isOpen === false', async () => {
    const root = createRoot(container);
    await act(async () => {
      root.render(<WordPackModal isOpen={false} onClose={vi.fn()} />);
    });
    expect(container.innerHTML).toBe('');
  });

  it('hiển thị danh sách pack và cho phép tạo pack mới', async () => {
    localStorage.setItem(CUSTOM_WORD_PACKS_KEY, JSON.stringify(samplePacks));

    const root = createRoot(container);
    await act(async () => {
      root.render(<WordPackModal isOpen={true} onClose={vi.fn()} />);
    });

    expect(container.textContent).toContain('Chuyên ngành IT');
    expect(container.textContent).toContain('Bug');
    expect(container.textContent).toContain('Feature');

    // Mở form tạo pack mới
    const newPackBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Tạo gói mới')
    );
    expect(newPackBtn).toBeDefined();

    await act(async () => {
      newPackBtn?.click();
    });

    const packNameInput = container.querySelector('input[placeholder*="Tên gói"]') as HTMLInputElement;
    expect(packNameInput).not.toBeNull();

    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(packNameInput, 'Gói Bạn Bè');
      packNameInput.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const savePackBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Lưu gói')
    );
    await act(async () => {
      savePackBtn?.click();
    });

    expect(container.textContent).toContain('Gói Bạn Bè');
    const storedPacks = JSON.parse(localStorage.getItem(CUSTOM_WORD_PACKS_KEY) || '[]');
    expect(storedPacks.some((p: CustomWordPack) => p.name === 'Gói Bạn Bè')).toBe(true);
  });

  it('cho phép chọn active pack và gọi onSelectActivePack', async () => {
    localStorage.setItem(CUSTOM_WORD_PACKS_KEY, JSON.stringify(samplePacks));
    const onSelect = vi.fn();

    const root = createRoot(container);
    await act(async () => {
      root.render(
        <WordPackModal
          isOpen={true}
          onClose={vi.fn()}
          onSelectActivePack={onSelect}
          activePackId={null}
        />
      );
    });

    const selectBtn = Array.from(container.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Sử dụng gói này') || b.textContent?.includes('Chọn gói')
    );
    expect(selectBtn).toBeDefined();

    await act(async () => {
      selectBtn?.click();
    });

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]?.name).toBe('Chuyên ngành IT');
  });
});
