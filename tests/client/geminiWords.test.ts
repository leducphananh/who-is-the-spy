import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCustomWordPair, isGeminiConfigured } from '../../src/client/lib/geminiWords.js';

describe('Gemini AI Word Suggestions (geminiWords.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY;
  });

  it('isGeminiConfigured: trả về false khi thiếu key, true khi có key', () => {
    delete (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY;
    expect(isGeminiConfigured()).toBe(false);

    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'test-key-123';
    expect(isGeminiConfigured()).toBe(true);
  });

  it('generateCustomWordPair: ném lỗi rõ ràng khi chưa cấu hình VITE_GEMINI_API_KEY', async () => {
    delete (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY;

    await expect(generateCustomWordPair()).rejects.toThrowError(
      /chưa cấu hình VITE_GEMINI_API_KEY/i
    );
  });

  it('generateCustomWordPair: gọi Gemini API thành công và trả về cặp từ hợp lệ', async () => {
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'test-gemini-key';

    const mockResponsePayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  civilianWord: 'Trà sữa',
                  spyWord: 'Cà phê muối',
                  category: 'Đồ uống giới trẻ',
                }),
              },
            ],
          },
        },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as Response);

    globalThis.fetch = mockFetch;

    const result = await generateCustomWordPair('Đồ uống');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('gemini-1.5-flash:generateContent');
    expect(calledUrl).toContain('key=test-gemini-key');

    const bodyObj = JSON.parse(calledOptions.body as string);
    expect(bodyObj.contents[0].parts[0].text).toContain('Đồ uống');

    expect(result.civilianWord).toBe('Trà sữa');
    expect(result.spyWord).toBe('Cà phê muối');
    expect(result.category).toBe('Đồ uống giới trẻ');
    expect(result.id).toMatch(/^ai_/);
  });

  it('generateCustomWordPair: xử lý markdown code block ```json ... ``` từ Gemini', async () => {
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'test-gemini-key';

    const mockResponsePayload = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '```json\n{"civilianWord":"Bánh chưng","spyWord":"Bánh tét","category":"Ẩm thực Tết"}\n```',
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponsePayload,
    } as Response);

    const result = await generateCustomWordPair();

    expect(result.civilianWord).toBe('Bánh chưng');
    expect(result.spyWord).toBe('Bánh tét');
    expect(result.category).toBe('Ẩm thực Tết');
  });

  it('generateCustomWordPair: xử lý lỗi khi HTTP status không phải 200', async () => {
    (import.meta.env as Record<string, unknown>).VITE_GEMINI_API_KEY = 'test-gemini-key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      text: async () => 'API key invalid',
    } as Response);

    await expect(generateCustomWordPair()).rejects.toThrowError(
      /không thể kết nối đến ai gemini/i
    );
  });
});
