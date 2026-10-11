import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCustomWordPair, isGeminiConfigured } from '../../src/client/lib/geminiWords.js';

describe('Client Gemini AI Service (geminiWords.ts)', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('isGeminiConfigured: trả về true vì API key được bảo mật ở Serverless Proxy', () => {
    expect(isGeminiConfigured()).toBe(true);
  });

  it('generateCustomWordPair: gọi /api/generate-words thành công và trả về cặp từ', async () => {
    const mockApiResponse = {
      id: 'ai-test-123',
      civilianWord: 'Trà sữa',
      spyWord: 'Cà phê muối',
      category: 'Đồ uống giới trẻ',
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    globalThis.fetch = mockFetch;

    const result = await generateCustomWordPair('Đồ uống');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe('/api/generate-words');
    expect(calledOptions.method).toBe('POST');
    expect(calledOptions.headers).toEqual({ 'Content-Type': 'application/json' });

    const bodyObj = JSON.parse(calledOptions.body as string);
    expect(bodyObj).toEqual({ topic: 'Đồ uống' });

    expect(result.civilianWord).toBe('Trà sữa');
    expect(result.spyWord).toBe('Cà phê muối');
    expect(result.category).toBe('Đồ uống giới trẻ');
    expect(result.id).toBe('ai-test-123');
  });

  it('generateCustomWordPair: xử lý lỗi khi HTTP status không phải 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Chưa cấu hình GEMINI_API_KEY trên server.',
      }),
    } as Response);

    await expect(generateCustomWordPair()).rejects.toThrowError(
      /Chưa cấu hình GEMINI_API_KEY trên server/i
    );
  });

  it('generateCustomWordPair: xử lý lỗi mạng khi mất kết nối', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

    await expect(generateCustomWordPair()).rejects.toThrowError(
      /không thể kết nối đến máy chủ/i
    );
  });

  it('generateCustomWordPair: xử lý khi máy chủ không trả về đủ từ', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        civilianWord: 'Chỉ có 1 từ',
        spyWord: '',
      }),
    } as Response);

    await expect(generateCustomWordPair()).rejects.toThrowError(
      /máy chủ không trả về đủ từ/i
    );
  });

  it('generateCustomWordPair: hiển thị thông báo lỗi khi máy chủ proxy trả về lỗi model 404/500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'Không thể tạo gợi ý từ khóa: Gemini API model gemini-2.5-flash không khả dụng',
      }),
    } as Response);

    await expect(generateCustomWordPair('Ẩm thực')).rejects.toThrowError(
      /gemini-2.5-flash/i
    );
  });
});
