import type { WordPair } from '../../core/types.js';

/**
 * Kiểm tra xem Gemini API key đã được cấu hình trong môi trường hay chưa.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
  return Boolean(apiKey && apiKey.trim() !== '');
}

interface GeminiWordResponse {
  civilianWord: string;
  spyWord: string;
  category?: string;
}

/**
 * Gọi Gemini API (model gemini-1.5-flash) để sinh cặp từ khóa bí mật tiếng Việt
 * dành cho trò chơi "Ai Là Gián Điệp".
 *
 * @param topic Chủ đề tùy chọn (ví dụ: "Ẩm thực", "Đồ công nghệ", "Trường học"...)
 * @returns WordPair chứa từ Dân Thường, từ Gián Điệp và danh mục
 */
export async function generateCustomWordPair(topic?: string): Promise<WordPair> {
  const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error(
      'Chưa cấu hình VITE_GEMINI_API_KEY trong file .env. Vui lòng thêm API key để sử dụng tính năng AI.'
    );
  }

  const trimmedTopic = topic?.trim();
  const prompt = `Bạn là chuyên gia thiết kế trò chơi "Ai Là Gián Điệp" (Who is the Spy). Nhiệm vụ của bạn là tạo ra 1 cặp từ khóa tiếng Việt hấp dẫn cho ván đấu: 1 từ cho Dân Thường (civilianWord) và 1 từ cho Gián Điệp (spyWord).
${
  trimmedTopic
    ? `Chủ đề ưu tiên được yêu cầu: "${trimmedTopic}".`
    : 'Chủ đề: Đời sống, ẩm thực, văn hóa hoặc công nghệ Việt Nam quen thuộc.'
}

Yêu cầu chất lượng nghiêm ngặt:
1. Hai từ khóa phải cùng trường từ vựng / liên quan chặt chẽ với nhau để Gián Điệp có thể lắng nghe và ngụy trang mô tả mà không bị lộ ngay.
2. Hai từ phải có sự khác biệt tinh tế, thú vị để Dân Thường phát hiện ra sự bất thường khi suy luận.
3. Từ ngữ tự nhiên, phổ biến và phù hợp văn hóa Việt Nam.
4. Tuyệt đối KHÔNG đặt 2 từ trùng nhau hoặc từ quá xa rời nhau (ví dụ: "chó" và "máy bay" là không hợp lệ).
5. Định dạng trả về đúng cấu trúc JSON duy nhất:
{
  "civilianWord": "từ dân thường",
  "spyWord": "từ gián điệp",
  "category": "tên chủ đề ngắn gọn"
}`;

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      }),
    });
  } catch (netErr) {
    throw new Error(
      `Không thể kết nối đến AI Gemini (${netErr instanceof Error ? netErr.message : 'Lỗi mạng'}). Vui lòng kiểm tra lại kết nối mạng.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `Không thể kết nối đến AI Gemini hoặc API key không hợp lệ (HTTP ${response.status}). Vui lòng kiểm tra lại VITE_GEMINI_API_KEY.`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI không trả về nội dung từ khóa hợp lệ.');
  }

  let cleaned = rawText.trim();
  // Xóa markdown code block nếu có
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed: GeminiWordResponse;
  try {
    parsed = JSON.parse(cleaned) as GeminiWordResponse;
  } catch {
    throw new Error('Định dạng phản hồi từ AI không phải JSON hợp lệ.');
  }

  if (!parsed.civilianWord || !parsed.spyWord) {
    throw new Error('AI không tạo đủ từ cho Dân Thường và Gián Điệp.');
  }

  return {
    id: `ai_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    civilianWord: parsed.civilianWord.trim(),
    spyWord: parsed.spyWord.trim(),
    category: parsed.category?.trim() || trimmedTopic || 'AI Gợi ý',
  };
}
