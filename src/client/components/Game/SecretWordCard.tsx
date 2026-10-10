import React, { useState, useCallback } from 'react';
import { Lock, Unlock, Eye, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import type { SecretWordPayload } from '../../network/types.js';

export interface SecretWordCardProps {
  secret: SecretWordPayload | null;
  onConfirmReady?: () => void;
  isReady?: boolean;
}

export const SecretWordCard: React.FC<SecretWordCardProps> = ({
  secret,
  onConfirmReady,
  isReady = false,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const handlePointerDown = useCallback(() => {
    setIsRevealed(true);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        // Ignored
      }
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    setIsRevealed(false);
  }, []);

  if (!secret) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <Lock className="w-10 h-10 mb-3 text-slate-600 animate-pulse" />
        <p className="text-sm">Đang tải thông tin mật từ máy chủ...</p>
      </div>
    );
  }

  const roleMeta = {
    CIVILIAN: {
      name: 'DÂN THƯỜNG',
      color: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
      hint: 'Bạn là Dân Thường trung thành. Hãy mô tả từ khóa thật tự nhiên và tinh tế, tránh quá lộ liễu để Gián Điệp không đoán được!',
    },
    SPY: {
      name: 'GIÁN ĐIỆP',
      color: 'text-rose-400',
      badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
      hint: 'Từ khóa của bạn hơi khác so với Dân Thường! Hãy lắng nghe các câu mô tả khác để ngụy trang và tìm ra từ của Dân Thường!',
    },
    MR_WHITE: {
      name: 'MR. WHITE',
      color: 'text-purple-400',
      badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-300',
      hint: 'Bạn không có từ khóa! Hãy chú ý lắng nghe mọi người mô tả, tung hỏa mù và chuẩn bị đoán từ khóa để giành chiến thắng bất ngờ!',
    },
  }[secret.role];

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 space-y-5 text-slate-100 select-none">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-amber-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          HỒ SƠ MẬT VỤ
        </h2>
        <p className="text-xs text-slate-400">
          Chống nhìn lén: Nhấn và giữ phong bì bên dưới để kiểm tra từ khóa
        </p>
      </div>

      {/* Secret Envelope Card Area */}
      <div
        data-testid="secret-card-area"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-full rounded-2xl border-2 transition-all duration-200 cursor-pointer p-6 flex flex-col items-center justify-center min-h-[260px] shadow-2xl backdrop-blur-md ${
          isRevealed
            ? 'bg-slate-900 border-amber-500/60 shadow-amber-500/10 scale-[1.01]'
            : 'bg-slate-950/90 border-dashed border-slate-700/80 hover:border-slate-600 shadow-black'
        }`}
      >
        {isRevealed ? (
          <div className="flex flex-col items-center text-center space-y-3 animate-fadeIn w-full">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm mb-1">
              <span className={`px-2.5 py-0.5 rounded-full border ${roleMeta.badgeBg}`}>
                {roleMeta.name}
              </span>
            </div>

            <div className="py-2">
              <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold block mb-1">
                Từ khóa bí mật
              </span>
              <div className={`text-3xl font-black tracking-wide ${roleMeta.color}`}>
                {secret.role === 'MR_WHITE' ? '??? (Bí ẩn)' : secret.word}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed text-left w-full">
              <div className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>{roleMeta.hint}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-amber-400/80 pt-1 font-medium">
              <Unlock className="w-3.5 h-3.5" />
              <span>Đang giải mật — Nhả tay ra để che giấu ngay lập tức</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-3 py-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-950/30 border border-rose-600/40 flex items-center justify-center text-rose-500 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <div className="inline-block px-3 py-1 rounded bg-rose-600/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-sm tracking-widest uppercase">
                TUYỆT MẬT / CLASSIFIED
              </div>
              <p className="text-xs text-slate-300 font-medium pt-2 flex items-center justify-center gap-1.5">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>Chạm & giữ để xem</span>
              </p>
            </div>

            <p className="text-[11px] text-slate-500 max-w-[200px]">
              Chỉ mình bạn xem được. Nhả tay khỏi màn hình sẽ lập tức che giấu.
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Button */}
      {onConfirmReady && (
        <div className="pt-2">
          <button
            onClick={onConfirmReady}
            disabled={isReady}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              isReady
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 active:scale-[0.98] cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isReady ? 'Đã sẵn sàng' : 'Tôi đã ghi nhớ từ khóa'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
