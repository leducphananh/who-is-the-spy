import type { WordPair } from './types.js';

export const WORD_PAIRS: readonly WordPair[] = [
  // 1. Ẩm thực (25 cặp)
  { id: 'food-01', civilianWord: 'Trà sữa', spyWord: 'Cà phê sữa', category: 'Ẩm thực' },
  { id: 'food-02', civilianWord: 'Trứng gà', spyWord: 'Trứng vịt lộn', category: 'Ẩm thực' },
  { id: 'food-03', civilianWord: 'Phở bò', spyWord: 'Bún bò Huế', category: 'Ẩm thực' },
  { id: 'food-04', civilianWord: 'Bánh mì', spyWord: 'Bánh bao', category: 'Ẩm thực' },
  { id: 'food-05', civilianWord: 'Nước mía', spyWord: 'Nước dừa', category: 'Ẩm thực' },
  { id: 'food-06', civilianWord: 'Nem rán', spyWord: 'Chả giò', category: 'Ẩm thực' },
  { id: 'food-07', civilianWord: 'Lẩu thái', spyWord: 'Canh chua', category: 'Ẩm thực' },
  { id: 'food-08', civilianWord: 'Bún chả', spyWord: 'Bún thịt nướng', category: 'Ẩm thực' },
  { id: 'food-09', civilianWord: 'Cơm tấm', spyWord: 'Cơm sườn', category: 'Ẩm thực' },
  { id: 'food-10', civilianWord: 'Bánh chưng', spyWord: 'Bánh tét', category: 'Ẩm thực' },
  { id: 'food-11', civilianWord: 'Xôi xéo', spyWord: 'Xôi gấc', category: 'Ẩm thực' },
  { id: 'food-12', civilianWord: 'Bánh cuốn', spyWord: 'Bánh ướt', category: 'Ẩm thực' },
  { id: 'food-13', civilianWord: 'Hủ tiếu', spyWord: 'Bún riêu', category: 'Ẩm thực' },
  { id: 'food-14', civilianWord: 'Bánh tráng nướng', spyWord: 'Bánh tráng trộn', category: 'Ẩm thực' },
  { id: 'food-15', civilianWord: 'Chè đậu đen', spyWord: 'Chè hạt sen', category: 'Ẩm thực' },
  { id: 'food-16', civilianWord: 'Bò bía', spyWord: 'Gỏi cuốn', category: 'Ẩm thực' },
  { id: 'food-17', civilianWord: 'Trà đá', spyWord: 'Nước khoáng', category: 'Ẩm thực' },
  { id: 'food-18', civilianWord: 'Khoai lang nướng', spyWord: 'Bắp nướng', category: 'Ẩm thực' },
  { id: 'food-19', civilianWord: 'Súp cua', spyWord: 'Cháo gà', category: 'Ẩm thực' },
  { id: 'food-20', civilianWord: 'Bột chiên', spyWord: 'Bánh xèo', category: 'Ẩm thực' },
  { id: 'food-21', civilianWord: 'Kem que', spyWord: 'Kem ốc quế', category: 'Ẩm thực' },
  { id: 'food-22', civilianWord: 'Sữa đậu nành', spyWord: 'Sữa bắp', category: 'Ẩm thực' },
  { id: 'food-23', civilianWord: 'Bún mắm', spyWord: 'Bún đậu mắm tôm', category: 'Ẩm thực' },
  { id: 'food-24', civilianWord: 'Trứng cút lộn', spyWord: 'Trứng vịt lộn', category: 'Ẩm thực' },
  { id: 'food-25', civilianWord: 'Cà phê đen', spyWord: 'Cà phê muối', category: 'Ẩm thực' },

  // 2. Đồ gia dụng & Đồ dùng (20 cặp)
  { id: 'item-01', civilianWord: 'Kính râm', spyWord: 'Kính cận', category: 'Đồ dùng' },
  { id: 'item-02', civilianWord: 'Quạt trần', spyWord: 'Quạt cây', category: 'Đồ dùng' },
  { id: 'item-03', civilianWord: 'Bật lửa', spyWord: 'Bao diêm', category: 'Đồ dùng' },
  { id: 'item-04', civilianWord: 'Nồi cơm điện', spyWord: 'Nồi áp suất', category: 'Đồ dùng' },
  { id: 'item-05', civilianWord: 'Chổi quét nhà', spyWord: 'Máy hút bụi', category: 'Đồ dùng' },
  { id: 'item-06', civilianWord: 'Bàn là', spyWord: 'Máy sấy tóc', category: 'Đồ dùng' },
  { id: 'item-07', civilianWord: 'Đũa ăn cơm', spyWord: 'Thìa súp', category: 'Đồ dùng' },
  { id: 'item-08', civilianWord: 'Bình giữ nhiệt', spyWord: 'Ấm đun nước', category: 'Đồ dùng' },
  { id: 'item-09', civilianWord: 'Dao gọt hoa quả', spyWord: 'Kéo cắt giấy', category: 'Đồ dùng' },
  { id: 'item-10', civilianWord: 'Bàn chải đánh răng', spyWord: 'Chỉ nha khoa', category: 'Đồ dùng' },
  { id: 'item-11', civilianWord: 'Gối ôm', spyWord: 'Gối đầu', category: 'Đồ dùng' },
  { id: 'item-12', civilianWord: 'Chăn bông', spyWord: 'Nệm cao su', category: 'Đồ dùng' },
  { id: 'item-13', civilianWord: 'Tủ lạnh', spyWord: 'Thùng xốp đựng đá', category: 'Đồ dùng' },
  { id: 'item-14', civilianWord: 'Máy giặt', spyWord: 'Máy sấy quần áo', category: 'Đồ dùng' },
  { id: 'item-15', civilianWord: 'Gương soi', spyWord: 'Kính lúp', category: 'Đồ dùng' },
  { id: 'item-16', civilianWord: 'Đồng hồ treo tường', spyWord: 'Đồng hồ báo thức', category: 'Đồ dùng' },
  { id: 'item-17', civilianWord: 'Ô che mưa', spyWord: 'Áo mưa', category: 'Đồ dùng' },
  { id: 'item-18', civilianWord: 'Thớt gỗ', spyWord: 'Thớt nhựa', category: 'Đồ dùng' },
  { id: 'item-19', civilianWord: 'Khăn mặt', spyWord: 'Khăn tắm', category: 'Đồ dùng' },
  { id: 'item-20', civilianWord: 'Cốc thủy tinh', spyWord: 'Ly sứ', category: 'Đồ dùng' },

  // 3. Đồ công nghệ & Thiết bị (15 cặp)
  { id: 'tech-01', civilianWord: 'TikTok', spyWord: 'YouTube Shorts', category: 'Công nghệ' },
  { id: 'tech-02', civilianWord: 'Facebook', spyWord: 'Instagram', category: 'Công nghệ' },
  { id: 'tech-03', civilianWord: 'Laptop', spyWord: 'Máy tính bảng', category: 'Công nghệ' },
  { id: 'tech-04', civilianWord: 'Tai nghe có dây', spyWord: 'Tai nghe Bluetooth', category: 'Công nghệ' },
  { id: 'tech-05', civilianWord: 'Bàn phím cơ', spyWord: 'Bàn phím cao su', category: 'Công nghệ' },
  { id: 'tech-06', civilianWord: 'Grab', spyWord: 'Be', category: 'Công nghệ' },
  { id: 'tech-07', civilianWord: 'Zalo', spyWord: 'Telegram', category: 'Công nghệ' },
  { id: 'tech-08', civilianWord: 'Chuột không dây', spyWord: 'Bàn di chuột', category: 'Công nghệ' },
  { id: 'tech-09', civilianWord: 'Sạc dự phòng', spyWord: 'Củ sạc', category: 'Công nghệ' },
  { id: 'tech-10', civilianWord: 'Tivi thông minh', spyWord: 'Máy chiếu', category: 'Công nghệ' },
  { id: 'tech-11', civilianWord: 'Loa Bluetooth', spyWord: 'Loa kéo', category: 'Công nghệ' },
  { id: 'tech-12', civilianWord: 'USB', spyWord: 'Thẻ nhớ SD', category: 'Công nghệ' },
  { id: 'tech-13', civilianWord: 'Camera giám sát', spyWord: 'Flycam', category: 'Công nghệ' },
  { id: 'tech-14', civilianWord: 'PlayStation', spyWord: 'Nintendo Switch', category: 'Công nghệ' },
  { id: 'tech-15', civilianWord: 'Đồng hồ thông minh', spyWord: 'Vòng tay thông minh', category: 'Công nghệ' },

  // 4. Địa danh du lịch & Điểm đến (12 cặp)
  { id: 'travel-01', civilianWord: 'Đà Lạt', spyWord: 'Sa Pa', category: 'Địa danh du lịch' },
  { id: 'travel-02', civilianWord: 'Nha Trang', spyWord: 'Phú Quốc', category: 'Địa danh du lịch' },
  { id: 'travel-03', civilianWord: 'Hà Nội', spyWord: 'TP. Hồ Chí Minh', category: 'Địa danh du lịch' },
  { id: 'travel-04', civilianWord: 'Hội An', spyWord: 'Cố đô Huế', category: 'Địa danh du lịch' },
  { id: 'travel-05', civilianWord: 'Vịnh Hạ Long', spyWord: 'Đảo Cát Bà', category: 'Địa danh du lịch' },
  { id: 'travel-06', civilianWord: 'Tràng An Ninh Bình', spyWord: 'Phong Nha Kẻ Bàng', category: 'Địa danh du lịch' },
  { id: 'travel-07', civilianWord: 'Mũi Né', spyWord: 'Vũng Tàu', category: 'Địa danh du lịch' },
  { id: 'travel-08', civilianWord: 'Đỉnh Fansipan', spyWord: 'Núi Bà Đen', category: 'Địa danh du lịch' },
  { id: 'travel-09', civilianWord: 'Chợ Bến Thành', spyWord: 'Chợ Đồng Xuân', category: 'Địa danh du lịch' },
  { id: 'travel-10', civilianWord: 'Hồ Hoàn Kiếm', spyWord: 'Hồ Tây', category: 'Địa danh du lịch' },
  { id: 'travel-11', civilianWord: 'Cầu Rồng Đà Nẵng', spyWord: 'Cầu Vàng Bà Nà', category: 'Địa danh du lịch' },
  { id: 'travel-12', civilianWord: 'Côn Đảo', spyWord: 'Lý Sơn', category: 'Địa danh du lịch' },

  // 5. Hoạt động giải trí & Thể thao (12 cặp)
  { id: 'leisure-01', civilianWord: 'Bóng đá', spyWord: 'Futsal', category: 'Hoạt động giải trí' },
  { id: 'leisure-02', civilianWord: 'Cầu lông', spyWord: 'Quần vợt', category: 'Hoạt động giải trí' },
  { id: 'leisure-03', civilianWord: 'Bơi lội', spyWord: 'Lặn biển', category: 'Hoạt động giải trí' },
  { id: 'leisure-04', civilianWord: 'Chạy bộ', spyWord: 'Đi bộ nhanh', category: 'Hoạt động giải trí' },
  { id: 'leisure-05', civilianWord: 'Leo núi', spyWord: 'Cắm trại', category: 'Hoạt động giải trí' },
  { id: 'leisure-06', civilianWord: 'Hát karaoke', spyWord: 'Đi nghe nhạc sống', category: 'Hoạt động giải trí' },
  { id: 'leisure-07', civilianWord: 'Chơi cờ vua', spyWord: 'Chơi cờ tướng', category: 'Hoạt động giải trí' },
  { id: 'leisure-08', civilianWord: 'Trượt ván', spyWord: 'Trượt patin', category: 'Hoạt động giải trí' },
  { id: 'leisure-09', civilianWord: 'Câu cá', spyWord: 'Bắt cua', category: 'Hoạt động giải trí' },
  { id: 'leisure-10', civilianWord: 'Khiêu vũ', spyWord: 'Nhảy hiphop', category: 'Hoạt động giải trí' },
  { id: 'leisure-11', civilianWord: 'Đi bar', spyWord: 'Đi quán pub', category: 'Hoạt động giải trí' },
  { id: 'leisure-12', civilianWord: 'Tập gym', spyWord: 'Tập yoga', category: 'Hoạt động giải trí' },

  // 6. Nghề nghiệp (12 cặp)
  { id: 'job-01', civilianWord: 'Bác sĩ', spyWord: 'Y tá', category: 'Nghề nghiệp' },
  { id: 'job-02', civilianWord: 'Thợ cắt tóc', spyWord: 'Chuyên gia trang điểm', category: 'Nghề nghiệp' },
  { id: 'job-03', civilianWord: 'Lập trình viên', spyWord: 'Thiết kế đồ họa', category: 'Nghề nghiệp' },
  { id: 'job-04', civilianWord: 'Giáo viên', spyWord: 'Gia sư', category: 'Nghề nghiệp' },
  { id: 'job-05', civilianWord: 'Ca sĩ', spyWord: 'Nhạc sĩ', category: 'Nghề nghiệp' },
  { id: 'job-06', civilianWord: 'Đạo diễn', spyWord: 'Diễn viên', category: 'Nghề nghiệp' },
  { id: 'job-07', civilianWord: 'Phi công', spyWord: 'Tiếp viên hàng không', category: 'Nghề nghiệp' },
  { id: 'job-08', civilianWord: 'Shipper', spyWord: 'Tài xế taxi', category: 'Nghề nghiệp' },
  { id: 'job-09', civilianWord: 'Cảnh sát giao thông', spyWord: 'Bảo vệ', category: 'Nghề nghiệp' },
  { id: 'job-10', civilianWord: 'Đầu bếp', spyWord: 'Phụ bếp', category: 'Nghề nghiệp' },
  { id: 'job-11', civilianWord: 'Luật sư', spyWord: 'Thẩm phán', category: 'Nghề nghiệp' },
  { id: 'job-12', civilianWord: 'Kiến trúc sư', spyWord: 'Kỹ sư xây dựng', category: 'Nghề nghiệp' },

  // 7. Đời sống & Mối quan hệ (12 cặp)
  { id: 'life-01', civilianWord: 'Người yêu cũ', spyWord: 'Vợ', category: 'Đời sống' },
  { id: 'life-02', civilianWord: 'Bạn thân', spyWord: 'Bạn xã giao', category: 'Đời sống' },
  { id: 'life-03', civilianWord: 'Mẹ chồng', spyWord: 'Mẹ đẻ', category: 'Đời sống' },
  { id: 'life-04', civilianWord: 'Đi phượt', spyWord: 'Đi tour', category: 'Đời sống' },
  { id: 'life-05', civilianWord: 'Xem phim rạp', spyWord: 'Xem Netflix', category: 'Đời sống' },
  { id: 'life-06', civilianWord: 'Đám cưới', spyWord: 'Đám hỏi', category: 'Đời sống' },
  { id: 'life-07', civilianWord: 'Tiết kiệm tiền', spyWord: 'Đầu tư chứng khoán', category: 'Đời sống' },
  { id: 'life-08', civilianWord: 'Xe buýt', spyWord: 'Tàu điện trên cao', category: 'Đời sống' },
  { id: 'life-09', civilianWord: 'Ví tiền', spyWord: 'Túi xách', category: 'Đời sống' },
  { id: 'life-10', civilianWord: 'Căn cước công dân', spyWord: 'Hộ chiếu', category: 'Đời sống' },
  { id: 'life-11', civilianWord: 'Giày thể thao', spyWord: 'Giày tây', category: 'Đời sống' },
  { id: 'life-12', civilianWord: 'Khẩu trang y tế', spyWord: 'Khẩu trang vải', category: 'Đời sống' },

  // 8. Thiên nhiên & Động vật (12 cặp)
  { id: 'nature-01', civilianWord: 'Chó Husky', spyWord: 'Chó Alaska', category: 'Thiên nhiên' },
  { id: 'nature-02', civilianWord: 'Cua biển', spyWord: 'Ghẹ biển', category: 'Thiên nhiên' },
  { id: 'nature-03', civilianWord: 'Hoa đào', spyWord: 'Hoa mai', category: 'Thiên nhiên' },
  { id: 'nature-04', civilianWord: 'Mèo mướp', spyWord: 'Mèo tam thể', category: 'Thiên nhiên' },
  { id: 'nature-05', civilianWord: 'Con tôm', spyWord: 'Con tép', category: 'Thiên nhiên' },
  { id: 'nature-06', civilianWord: 'Mặt trời', spyWord: 'Mặt trăng', category: 'Thiên nhiên' },
  { id: 'nature-07', civilianWord: 'Cá voi', spyWord: 'Cá heo', category: 'Thiên nhiên' },
  { id: 'nature-08', civilianWord: 'Con trăn', spyWord: 'Con rắn', category: 'Thiên nhiên' },
  { id: 'nature-09', civilianWord: 'Mưa rào', spyWord: 'Mưa phùn', category: 'Thiên nhiên' },
  { id: 'nature-10', civilianWord: 'Cây bàng', spyWord: 'Cây phượng', category: 'Thiên nhiên' },
  { id: 'nature-11', civilianWord: 'Sấm sét', spyWord: 'Cầu vồng', category: 'Thiên nhiên' },
  { id: 'nature-12', civilianWord: 'Ong mật', spyWord: 'Ong vò vẽ', category: 'Thiên nhiên' },
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
