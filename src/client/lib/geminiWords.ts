import type { WordPair } from '../../core/types.js';

interface GenerateWordsApiResponse {
  id?: string;
  civilianWord?: string;
  spyWord?: string;
  category?: string;
  error?: string;
}

/**
 * Kiểm tra xem tính năng Gemini API có khả dụng không.
 * Với kiến trúc Serverless Proxy, API Key được lưu trên server nên client mặc định hỗ trợ.
 */
export function isGeminiConfigured(): boolean {
  return true;
}

/**
 * Gọi Vercel Serverless Function Proxy (/api/generate-words) để sinh cặp từ khóa bí mật tiếng Việt
 * dành cho trò chơi "Ai Là Gián Điệp" mà không làm lộ GEMINI_API_KEY ra client bundle.
 *
 * @param topic Chủ đề tùy chọn (ví dụ: "Ẩm thực", "Đồ công nghệ", "Trường học"...)
 * @returns WordPair chứa từ Dân Thường, từ Gián Điệp và danh mục
 */
export async function generateCustomWordPair(topic?: string): Promise<WordPair> {
  let response: Response;
  try {
    response = await fetch('/api/generate-words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: topic?.trim() || undefined,
      }),
    });
  } catch (netErr) {
    throw new Error(
      `Không thể kết nối đến máy chủ (${netErr instanceof Error ? netErr.message : 'Lỗi mạng'}). Vui lòng kiểm tra lại kết nối mạng.`
    );
  }

  let data: GenerateWordsApiResponse;
  try {
    data = (await response.json()) as GenerateWordsApiResponse;
  } catch {
    throw new Error('Định dạng phản hồi từ máy chủ không phải JSON hợp lệ.');
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Lỗi máy chủ (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }

  if (!data.civilianWord || !data.spyWord) {
    throw new Error('Máy chủ không trả về đủ từ cho Dân Thường và Gián Điệp.');
  }

  return {
    id: data.id || `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    civilianWord: data.civilianWord.trim(),
    spyWord: data.spyWord.trim(),
    category: data.category?.trim() || topic?.trim() || 'AI Gợi ý',
  };
}
