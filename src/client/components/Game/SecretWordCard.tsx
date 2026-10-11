import React, { useState, useCallback } from 'react';
import { Lock, Unlock, Eye, CheckCircle2, ShieldCheck, Flame, Fingerprint } from 'lucide-react';
import type { SecretWordPayload } from '../../network/types.js';
import { soundEffects } from '../../lib/soundEffects.js';

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
    soundEffects.playRoleReveal();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
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

  const isMrWhite = secret.role === 'MR_WHITE';

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 space-y-4 text-slate-100 select-none">
      {/* Title */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-amber-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          HỒ SƠ MẬT VỤ
        </h2>
        <p className="text-xs text-slate-400">
          Chống nhìn lén: Nhấn và giữ nút cảm ứng bên dưới để kiểm tra từ khóa
        </p>
      </div>

      {/* Secret Envelope Card Area (Display Zone) */}
      <div
        data-testid="secret-card-area"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchCancel={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative w-full rounded-2xl border-2 transition-all duration-200 cursor-pointer p-6 flex flex-col items-center justify-center min-h-[250px] shadow-2xl backdrop-blur-md ${
          isRevealed
            ? 'bg-slate-900 border-amber-500/60 shadow-amber-500/10 scale-[1.01]'
            : 'bg-slate-950/90 border-dashed border-slate-700/80 hover:border-slate-600 shadow-black'
        }`}
      >
        {isRevealed ? (
          <div className="flex flex-col items-center text-center space-y-3 animate-fadeIn w-full">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider shadow-sm mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full border ${
                  isMrWhite
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                    : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                }`}
              >
                {isMrWhite ? 'MR. WHITE' : 'MẬT THƯ BÍ MẬT'}
              </span>
            </div>

            <div className="py-2">
              <span className="text-xs uppercase text-slate-400 tracking-wider font-semibold block mb-1">
                {isMrWhite ? 'Mật thư của bạn' : 'Từ khóa bí mật của bạn'}
              </span>
              <div
                className={`text-3xl sm:text-4xl font-black tracking-wide ${
                  isMrWhite ? 'text-purple-400' : 'text-amber-400'
                }`}
              >
                {isMrWhite ? 'Bạn không có từ khóa' : secret.word}
              </div>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-slate-300 leading-relaxed text-left w-full">
              <div className="flex items-start gap-2">
                <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  {isMrWhite
                    ? 'Bạn không có từ khóa! Hãy chú ý lắng nghe mọi người mô tả, tung hỏa mù và chuẩn bị đoán từ khóa để giành chiến thắng bất ngờ!'
                    : 'Hãy ghi nhớ từ khóa! Mô tả thật khéo léo để tìm ra đồng đội và phát hiện ai là kẻ có từ khóa khác biệt.'}
                </span>
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

      {/* Separated Mobile Thumb Touch Zone */}
      <div className="pt-1">
        <button
          type="button"
          data-testid="thumb-touch-zone"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchCancel={handlePointerUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full min-h-[64px] rounded-2xl font-bold flex items-center justify-center gap-3 transition-all duration-150 select-none touch-none shadow-xl border-2 cursor-pointer ${
            isRevealed
              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-4 ring-amber-400/30 scale-[0.98]'
              : 'bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 hover:from-slate-800 hover:to-slate-800 text-amber-400 border-amber-500/50 hover:border-amber-400 active:scale-[0.98]'
          }`}
        >
          {isRevealed ? (
            <>
              <Unlock className="w-6 h-6 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-black tracking-wide">ĐANG HIỂN THỊ TỪ KHÓA</span>
                <span className="text-[11px] font-medium text-slate-900/80">Nhả ngón tay ra để che giấu ngay</span>
              </div>
            </>
          ) : (
            <>
              <Fingerprint className="w-6 h-6 text-amber-400 animate-pulse" />
              <div className="flex flex-col text-left">
                <span className="text-sm font-extrabold tracking-wide">👇 Nhấn và giữ tại đây để xem</span>
                <span className="text-[11px] text-slate-400 font-normal">Không bị ngón tay che khuất từ khóa</span>
              </div>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Button */}
      {onConfirmReady && (
        <div className="pt-1">
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

