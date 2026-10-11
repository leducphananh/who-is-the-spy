import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { callGeminiForWords } from './api/generate-words.js';

function localApiPlugin(): Plugin {
  return {
    name: 'local-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/generate-words') && req.method === 'POST') {
          const env = loadEnv(server.config.mode, process.cwd(), '');
          const apiKey =
            env.GEMINI_API_KEY ||
            env.VITE_GEMINI_API_KEY ||
            process.env.GEMINI_API_KEY ||
            process.env.VITE_GEMINI_API_KEY;

          if (!apiKey || apiKey.trim() === '') {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error:
                  'Chưa cấu hình GEMINI_API_KEY trong file .env local. Vui lòng thêm GEMINI_API_KEY để sử dụng tính năng AI.',
              })
            );
            return;
          }

          let bodyText = '';
          req.on('data', (chunk: Buffer | string) => {
            bodyText += chunk.toString();
          });

          req.on('end', async () => {
            let topic: string | undefined;
            try {
              if (bodyText) {
                const parsed = JSON.parse(bodyText) as { topic?: string };
                if (parsed && typeof parsed.topic === 'string') {
                  topic = parsed.topic.trim();
                }
              }
            } catch {
              // Bỏ qua lỗi parse body
            }

            try {
              const result = await callGeminiForWords(apiKey, topic);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Lỗi hệ thống khi gọi Gemini AI.';
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: `Không thể tạo gợi ý từ khóa: ${msg}` }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    port: 3000,
    open: true,
  },
});
