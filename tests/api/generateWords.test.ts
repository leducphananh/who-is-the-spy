import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler, { callGeminiForWords } from '../../api/generate-words.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

describe('Vercel Serverless Function: /api/generate-words', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  });

  const createMockRes = () => {
    const res: Partial<VercelResponse> & {
      statusCode?: number;
      jsonData?: unknown;
    } = {};
    res.status = vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    });
    res.json = vi.fn().mockImplementation((data: unknown) => {
      res.jsonData = data;
      return res;
    });
    return res as VercelResponse & { statusCode?: number; jsonData?: any };
  };

  it('từ chối các request không phải POST với HTTP 405', async () => {
    const req = {
      method: 'GET',
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.jsonData?.error).toContain('Method Not Allowed');
  });

  it('trả về HTTP 500 khi chưa cấu hình GEMINI_API_KEY', async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.VITE_GEMINI_API_KEY;

    const req = {
      method: 'POST',
      body: { topic: 'Ẩm thực' },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.jsonData?.error).toContain('Chưa cấu hình GEMINI_API_KEY');
  });

  it('gọi Gemini API và trả về kết quả JSON với HTTP 200', async () => {
    process.env.GEMINI_API_KEY = 'secret-test-key';

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  civilianWord: 'Bún chả',
                  spyWord: 'Bún đậu',
                  category: 'Món ăn Hà Nội',
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
      json: async () => mockGeminiResponse,
    } as Response);
    globalThis.fetch = mockFetch;

    const req = {
      method: 'POST',
      body: { topic: 'Hà Nội' },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.jsonData?.civilianWord).toBe('Bún chả');
    expect(res.jsonData?.spyWord).toBe('Bún đậu');
    expect(res.jsonData?.category).toBe('Món ăn Hà Nội');
    expect(res.jsonData?.id).toMatch(/^ai_/);

    const [calledUrl] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toContain('key=secret-test-key');
  });

  it('callGeminiForWords: xử lý markdown code block ```json ... ``` từ Gemini', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: '```json\n{"civilianWord":"Laptop","spyWord":"Máy tính bảng","category":"Công nghệ"}\n```',
              },
            ],
          },
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGeminiResponse,
    } as Response);

    const result = await callGeminiForWords('key-test', 'Công nghệ');
    expect(result.civilianWord).toBe('Laptop');
    expect(result.spyWord).toBe('Máy tính bảng');
    expect(result.category).toBe('Công nghệ');
  });

  it('callGeminiForWords: tự động fallback sang model tiếp theo khi model đầu tiên gặp HTTP 404', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  civilianWord: 'Trà chanh',
                  spyWord: 'Trà tắc',
                  category: 'Đồ uống vỉa hè',
                }),
              },
            ],
          },
        },
      ],
    };

    const mockFetch = vi
      .fn()
      // Lần gọi thứ 1 (gemini-2.5-flash) gặp lỗi 404
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Model not found',
      } as Response)
      // Lần gọi thứ 2 (gemini-2.0-flash) thành công 200
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockGeminiResponse,
      } as Response);

    globalThis.fetch = mockFetch;

    const result = await callGeminiForWords('key-test', 'Đồ uống');

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0]?.[0]).toContain('gemini-2.5-flash');
    expect(mockFetch.mock.calls[1]?.[0]).toContain('gemini-2.0-flash');

    expect(result.civilianWord).toBe('Trà chanh');
    expect(result.spyWord).toBe('Trà tắc');
    expect(result.category).toBe('Đồ uống vỉa hè');
  });

  it('trả về HTTP 500 khi Gemini API trả về lỗi', async () => {
    process.env.GEMINI_API_KEY = 'invalid-key';

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'API_KEY_INVALID',
    } as Response);

    const req = {
      method: 'POST',
      body: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.jsonData?.error).toContain('Không thể tạo gợi ý từ khóa');
  });
});
