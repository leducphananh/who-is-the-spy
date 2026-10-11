import type { VercelRequest, VercelResponse } from '@vercel/node';

export interface GeneratedWordResult {
  id: string;
  civilianWord: string;
  spyWord: string;
  category: string;
}

/**
 * Hàm core gọi Google Gemini API trực tiếp từ server
 */
export async function callGeminiForWords(
  apiKey: string,
  topic?: string
): Promise<GeneratedWordResult> {
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

  const response = await fetch(endpoint, {
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

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (HTTP ${response.status}): ${errorText}`);
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
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  let parsed: { civilianWord?: string; spyWord?: string; category?: string };
  try {
    parsed = JSON.parse(cleaned);
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

/**
 * Vercel Serverless Function: POST /api/generate-words
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Phương thức không được hỗ trợ (Method Not Allowed). Vui lòng dùng POST.',
    });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return res.status(500).json({
      error: 'Chưa cấu hình GEMINI_API_KEY trên server. Vui lòng thêm biến môi trường GEMINI_API_KEY.',
    });
  }

  let topic: string | undefined;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (body && typeof body.topic === 'string') {
      topic = body.topic.trim();
    }
  } catch {
    // Không parse được body
  }

  try {
    const result = await callGeminiForWords(apiKey, topic);
    return res.status(200).json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Lỗi hệ thống khi gọi Gemini AI.';
    console.error('[API /api/generate-words Error]:', message);
    return res.status(500).json({
      error: `Không thể tạo gợi ý từ khóa: ${message}`,
    });
  }
}
