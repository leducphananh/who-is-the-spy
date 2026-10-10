import { describe, it, expect } from 'vitest';
import { WORD_PAIRS, getRandomWordPair } from '../../src/core/wordBank.js';

describe('Vietnamese Word Bank', () => {
  it('chứa ít nhất 30 cặp từ tiếng Việt', () => {
    expect(WORD_PAIRS.length).toBeGreaterThanOrEqual(30);
  });

  it('mọi cặp từ đều có id duy nhất, category hợp lệ và hai từ khác nhau', () => {
    const ids = new Set<string>();

    for (const pair of WORD_PAIRS) {
      expect(pair.id.trim()).not.toBe('');
      expect(ids.has(pair.id)).toBe(false);
      ids.add(pair.id);

      expect(pair.category.trim()).not.toBe('');
      expect(pair.civilianWord.trim()).not.toBe('');
      expect(pair.spyWord.trim()).not.toBe('');

      // Từ dân thường và gián điệp không được trùng nhau
      expect(pair.civilianWord.toLowerCase().trim()).not.toBe(
        pair.spyWord.toLowerCase().trim()
      );
    }
  });

  it('chứa các chủ đề phong phú: Ẩm thực, Đồ dùng, Đời sống, Công nghệ, Thiên nhiên', () => {
    const categories = new Set(WORD_PAIRS.map((p) => p.category));
    expect(categories.has('Ẩm thực')).toBe(true);
    expect(categories.has('Đồ dùng')).toBe(true);
    expect(categories.has('Đời sống')).toBe(true);
    expect(categories.has('Công nghệ')).toBe(true);
  });

  it('getRandomWordPair lấy từ ngẫu nhiên và tôn trọng custom RNG', () => {
    // Với mock RNG trả về 0 -> lấy phần tử đầu tiên
    const first = getRandomWordPair(() => 0);
    expect(first).toEqual(WORD_PAIRS[0]);

    // Với mock RNG trả về 0.9999 -> lấy phần tử cuối cùng
    const last = getRandomWordPair(() => 0.9999);
    expect(last).toEqual(WORD_PAIRS[WORD_PAIRS.length - 1]);

    // Với mock RNG giữa mảng
    const midIndex = Math.floor(WORD_PAIRS.length / 2);
    const mid = getRandomWordPair(() => midIndex / WORD_PAIRS.length);
    expect(mid).toEqual(WORD_PAIRS[midIndex]);
  });

  it('getRandomWordPair hoạt động bình thường khi không truyền RNG', () => {
    const pair = getRandomWordPair();
    expect(pair).toBeDefined();
    expect(WORD_PAIRS).toContain(pair);
  });
});
