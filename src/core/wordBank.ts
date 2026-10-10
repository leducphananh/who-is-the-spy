import type { WordPair } from './types.js';

export const WORD_PAIRS: readonly WordPair[] = [
  // Ẩm thực
  {
    id: 'food-01',
    civilianWord: 'Trà sữa',
    spyWord: 'Cà phê sữa',
    category: 'Ẩm thực',
  },
  {
    id: 'food-02',
    civilianWord: 'Trứng gà',
    spyWord: 'Trứng vịt lộn',
    category: 'Ẩm thực',
  },
  {
    id: 'food-03',
    civilianWord: 'Phở bò',
    spyWord: 'Bún bò Huế',
    category: 'Ẩm thực',
  },
  {
    id: 'food-04',
    civilianWord: 'Bánh mì',
    spyWord: 'Bánh bao',
    category: 'Ẩm thực',
  },
  {
    id: 'food-05',
    civilianWord: 'Nước mía',
    spyWord: 'Nước dừa',
    category: 'Ẩm thực',
  },
  {
    id: 'food-06',
    civilianWord: 'Nem rán',
    spyWord: 'Chả giò',
    category: 'Ẩm thực',
  },
  {
    id: 'food-07',
    civilianWord: 'Lẩu thái',
    spyWord: 'Canh chua',
    category: 'Ẩm thực',
  },
  {
    id: 'food-08',
    civilianWord: 'Bún chả',
    spyWord: 'Bún thịt nướng',
    category: 'Ẩm thực',
  },

  // Đồ dùng & Gia dụng
  {
    id: 'item-01',
    civilianWord: 'Kính râm',
    spyWord: 'Kính cận',
    category: 'Đồ dùng',
  },
  {
    id: 'item-02',
    civilianWord: 'Quạt trần',
    spyWord: 'Quạt cây',
    category: 'Đồ dùng',
  },
  {
    id: 'item-03',
    civilianWord: 'Bật lửa',
    spyWord: 'Bao diêm',
    category: 'Đồ dùng',
  },
  {
    id: 'item-04',
    civilianWord: 'Nồi cơm điện',
    spyWord: 'Nồi áp suất',
    category: 'Đồ dùng',
  },
  {
    id: 'item-05',
    civilianWord: 'Chổi quét nhà',
    spyWord: 'Máy hút bụi',
    category: 'Đồ dùng',
  },
  {
    id: 'item-06',
    civilianWord: 'Bàn là',
    spyWord: 'Máy sấy tóc',
    category: 'Đồ dùng',
  },
  {
    id: 'item-07',
    civilianWord: 'Đũa ăn cơm',
    spyWord: 'Thìa súp',
    category: 'Đồ dùng',
  },
  {
    id: 'item-08',
    civilianWord: 'Bình giữ nhiệt',
    spyWord: 'Ấm đun nước',
    category: 'Đồ dùng',
  },

  // Đời sống & Mối quan hệ
  {
    id: 'life-01',
    civilianWord: 'Người yêu cũ',
    spyWord: 'Vợ',
    category: 'Đời sống',
  },
  {
    id: 'life-02',
    civilianWord: 'Bạn thân',
    spyWord: 'Bạn xã giao',
    category: 'Đời sống',
  },
  {
    id: 'life-03',
    civilianWord: 'Mẹ chồng',
    spyWord: 'Mẹ đẻ',
    category: 'Đời sống',
  },
  {
    id: 'life-04',
    civilianWord: 'Đi phượt',
    spyWord: 'Đi tour',
    category: 'Đời sống',
  },
  {
    id: 'life-05',
    civilianWord: 'Xem phim rạp',
    spyWord: 'Xem Netflix',
    category: 'Đời sống',
  },
  {
    id: 'life-06',
    civilianWord: 'Đám cưới',
    spyWord: 'Đám hỏi',
    category: 'Đời sống',
  },
  {
    id: 'life-07',
    civilianWord: 'Tiết kiệm tiền',
    spyWord: 'Đầu tư chứng khoán',
    category: 'Đời sống',
  },

  // Công nghệ & Mạng xã hội
  {
    id: 'tech-01',
    civilianWord: 'TikTok',
    spyWord: 'YouTube Shorts',
    category: 'Công nghệ',
  },
  {
    id: 'tech-02',
    civilianWord: 'Facebook',
    spyWord: 'Instagram',
    category: 'Công nghệ',
  },
  {
    id: 'tech-03',
    civilianWord: 'Laptop',
    spyWord: 'Máy tính bảng',
    category: 'Công nghệ',
  },
  {
    id: 'tech-04',
    civilianWord: 'Tai nghe có dây',
    spyWord: 'Tai nghe Bluetooth',
    category: 'Công nghệ',
  },
  {
    id: 'tech-05',
    civilianWord: 'Bàn phím cơ',
    spyWord: 'Bàn phím cao su',
    category: 'Công nghệ',
  },
  {
    id: 'tech-06',
    civilianWord: 'Grab',
    spyWord: 'Be',
    category: 'Công nghệ',
  },
  {
    id: 'tech-07',
    civilianWord: 'Zalo',
    spyWord: 'Telegram',
    category: 'Công nghệ',
  },

  // Thiên nhiên & Động vật
  {
    id: 'nature-01',
    civilianWord: 'Chó Husky',
    spyWord: 'Chó Alaska',
    category: 'Thiên nhiên',
  },
  {
    id: 'nature-02',
    civilianWord: 'Cua biển',
    spyWord: 'Ghẹ biển',
    category: 'Thiên nhiên',
  },
  {
    id: 'nature-03',
    civilianWord: 'Hoa đào',
    spyWord: 'Hoa mai',
    category: 'Thiên nhiên',
  },
  {
    id: 'nature-04',
    civilianWord: 'Mèo mướp',
    spyWord: 'Mèo tam thể',
    category: 'Thiên nhiên',
  },
  {
    id: 'nature-05',
    civilianWord: 'Con tôm',
    spyWord: 'Con tép',
    category: 'Thiên nhiên',
  },
  {
    id: 'nature-06',
    civilianWord: 'Mặt trời',
    spyWord: 'Mặt trăng',
    category: 'Thiên nhiên',
  },
];

/**
 * Lấy ngẫu nhiên 1 cặp từ trong kho từ khóa tiếng Việt.
 * Hỗ trợ Dependency Injection cho hàm tạo số ngẫu nhiên (rng).
 *
 * @param rng Hàm trả về số ngẫu nhiên trong khoảng [0, 1), mặc định là Math.random.
 */
export function getRandomWordPair(
  pairsOrRng?: readonly WordPair[] | (() => number),
  maybeRng?: () => number
): WordPair {
  let pairs: readonly WordPair[] = WORD_PAIRS;
  let rng: () => number = Math.random;

  if (typeof pairsOrRng === 'function') {
    rng = pairsOrRng;
  } else if (Array.isArray(pairsOrRng)) {
    pairs = pairsOrRng.length > 0 ? pairsOrRng : WORD_PAIRS;
    if (typeof maybeRng === 'function') {
      rng = maybeRng;
    }
  }

  const randomValue = rng();
  const clampedRandom = Math.max(0, Math.min(0.999999999999, randomValue));
  const index = Math.floor(clampedRandom * pairs.length);
  return pairs[index]!;
}
