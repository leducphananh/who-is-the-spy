import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, CheckCircle2, Clock, Volume2, ArrowRight, Eye, X, Lock, Unlock, Fingerprint, ShieldCheck } from 'lucide-react';
import type { PublicPlayerState, SecretWordPayload } from '../../network/types.js';
import { AVATAR_OPTIONS, type AvatarOption } from '../Lobby/ProfileSetup.js';
import { soundEffects } from '../../lib/soundEffects.js';

export interface DescribingViewProps {
  roundNumber: number;
  currentDescriberIndex: number;
  players: PublicPlayerState[];
  myUserId: string;
  mySecret: SecretWordPayload | null;
  onNextDescribe: () => void;
}

export const DescribingView: React.FC<DescribingViewProps> = ({
  roundNumber,
  currentDescriberIndex,
  players,
  myUserId,
  mySecret,
  onNextDescribe,
}) => {
  const [isPeekModalOpen, setIsPeekModalOpen] = useState(false);
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

  const isMrWhite = mySecret?.role === 'MR_WHITE';

  const alivePlayers = players.filter((p) => p.isAlive);
  const currentDescriber = alivePlayers[currentDescriberIndex] || alivePlayers[0];
  const isMyTurn = currentDescriber?.id === myUserId;

  const prevIsMyTurn = useRef(false);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurn.current) {
      soundEffects.playTurnAlert();
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn]);

  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a: AvatarOption) => a.id === avatarId);
    return found ? found.emoji : '🕵️';
  };

  const handleNextClick = () => {
    soundEffects.playTick();
    onNextDescribe();
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
            {roundNumber}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Vòng {roundNumber}: Mô Tả</h2>
            <p className="text-[11px] text-slate-400">Lần lượt mỗi mật vụ mô tả 1 câu</p>
          </div>
        </div>

        {/* Peek Secret Word Button */}
        {mySecret && (
          <button
            type="button"
            data-testid="open-peek-modal-btn"
            onClick={() => setIsPeekModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-300 shadow-sm transition-all select-none"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Xem lại từ</span>
          </button>
        )}
      </div>

      {/* Turn Banner */}
      <div
        className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl ${
          isMyTurn
            ? 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-500/60 ring-2 ring-amber-400/20'
            : 'bg-slate-900/70 border-slate-800'
        }`}
      >
        {isMyTurn ? (
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-wider animate-pulse">
              <Mic className="w-4 h-4 text-amber-400" />
              ĐANG ĐẾN LƯỢT BẠN
            </div>
            <p className="text-sm font-semibold text-slate-100">
              Hãy mô tả 1 câu về từ khóa của bạn!
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Mô tả khéo léo để đồng đội nhận ra mà không làm lộ từ khóa cho Gián Điệp hoặc Mr. White.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
              {getAvatarEmoji(currentDescriber?.avatar || 'fox')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-sm font-bold text-slate-100 truncate">
                  {currentDescriber?.name} đang mô tả
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Hãy chú ý lắng nghe để tìm dấu vết sơ hở...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Players Speaking Queue */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Thứ tự phát biểu ({alivePlayers.length} mật vụ)
        </h3>

        <div className="space-y-2">
          {alivePlayers.map((player, idx) => {
            const isSpeaking = idx === currentDescriberIndex;
            const hasSpoken = idx < currentDescriberIndex;
            const isMe = player.id === myUserId;

            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isSpeaking
                    ? 'bg-amber-500/10 border-amber-400/80 shadow-md ring-1 ring-amber-400/40'
                    : hasSpoken
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-950/70 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg">
                    {getAvatarEmoji(player.avatar)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-200">
                      {player.name}
                    </span>
                    {isMe && (
                      <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-medium">
                        Bạn
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  {isSpeaking ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 animate-pulse">
                      <Mic className="w-3.5 h-3.5" />
                      Đang nói
                    </span>
                  ) : hasSpoken ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-400 text-xs font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Đã nói
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-slate-500 text-xs font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Chờ lượt
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button if current turn */}
      {isMyTurn && (
        <div className="pt-2">
          <button
            onClick={handleNextClick}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Hoàn thành mô tả & Chuyển lượt</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Peek Secret Word Modal (Separated Thumb Zone) */}
      {isPeekModalOpen && mySecret && (
        <div
          data-testid="peek-secret-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn"
        >
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 text-slate-100 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">XEM LẠI TỪ KHÓA BÍ MẬT</h3>
                  <p className="text-[10px] text-slate-400">Chống nhìn lén & ngón tay che từ</p>
                </div>
              </div>
              <button
                type="button"
                data-testid="close-peek-modal-btn"
                onClick={() => {
                  setIsPeekModalOpen(false);
                  setIsRevealed(false);
                }}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Display Zone (Top Area) */}
            <div
              data-testid="peek-display-zone"
              className={`w-full rounded-2xl border-2 transition-all duration-200 p-5 flex flex-col items-center justify-center min-h-[160px] shadow-lg ${
                isRevealed
                  ? 'bg-slate-950 border-amber-500/60 shadow-amber-500/10'
                  : 'bg-slate-950/80 border-dashed border-slate-800'
              }`}
            >
              {isRevealed ? (
                <div className="flex flex-col items-center text-center space-y-2 animate-fadeIn w-full">
                  <span
                    className={`px-2.5 py-0.5 rounded-full border text-xs font-bold uppercase tracking-wider ${
                      isMrWhite
                        ? 'border-purple-500/30 bg-purple-500/10 text-purple-300'
                        : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {isMrWhite ? 'MR. WHITE' : 'TỪ KHÓA BÍ MẬT'}
                  </span>

                  <div className="py-2">
                    <span className="text-[10px] uppercase text-slate-400 tracking-wider font-semibold block mb-0.5">
                      {isMrWhite ? 'Mật thư của bạn' : 'Từ khóa của bạn'}
                    </span>
                    <div
                      data-testid="peek-secret-word-text"
                      className={`text-2xl sm:text-3xl font-black tracking-wide ${
                        isMrWhite ? 'text-purple-400' : 'text-amber-400'
                      }`}
                    >
                      {isMrWhite ? 'Bạn không có từ khóa' : mySecret.word}
                    </div>
                  </div>

                  <p className="text-[11px] text-amber-400/80 flex items-center gap-1 font-medium">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Đang hiển thị — Nhả tay để che lại</span>
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center space-y-2 py-3">
                  <div className="w-12 h-12 rounded-xl bg-rose-950/30 border border-rose-600/40 flex items-center justify-center text-rose-500 shadow-inner">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="inline-block px-2.5 py-0.5 rounded bg-rose-600/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-xs uppercase tracking-wider">
                    TUYỆT MẬT / CLASSIFIED
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Nhấn & giữ nút cảm ứng bên dưới để xem lại
                  </p>
                </div>
              )}
            </div>

            {/* Separated Thumb Touch Zone (Bottom Area) */}
            <div>
              <button
                type="button"
                data-testid="peek-thumb-touch-zone"
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
                      <span className="text-sm font-extrabold tracking-wide">👇 Nhấn và giữ tại đây để xem lại</span>
                      <span className="text-[11px] text-slate-400 font-normal">Không bị ngón tay che khuất từ khóa</span>
                    </div>
                  </>
                )}
              </button>
            </div>

            {/* Close Button */}
            <div className="pt-1">
              <button
                type="button"
                data-testid="back-to-game-btn"
                onClick={() => {
                  setIsPeekModalOpen(false);
                  setIsRevealed(false);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
              >
                Đóng & Quay lại ván đấu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
