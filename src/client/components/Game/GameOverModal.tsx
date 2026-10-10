import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Skull, Eye } from 'lucide-react';
import type { GameWinner, Role } from '../../../core/types.js';
import type { PublicPlayerState } from '../../network/types.js';
import { AVATAR_OPTIONS, type AvatarOption } from '../Lobby/ProfileSetup.js';

export interface GameOverModalProps {
  winner: GameWinner;
  players: PublicPlayerState[];
  isHost: boolean;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  players,
  isHost,
  onPlayAgain,
}) => {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch {
      // Ignored in headless/test environments
    }
  }, []);

  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a: AvatarOption) => a.id === avatarId);
    return found ? found.emoji : '🕵️';
  };

  const getWinnerConfig = (w: GameWinner) => {
    switch (w) {
      case 'CIVILIANS':
        return {
          title: 'DÂN THƯỜNG CHIẾN THẮNG! 🛡️',
          subtitle: 'Tất cả Gián Điệp và Mr. White đã bị loại thành công!',
          badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          trophyColor: 'text-cyan-400',
        };
      case 'SPIES':
        return {
          title: 'GIÁN ĐIỆP CHIẾN THẮNG! 🕵️',
          subtitle: 'Gián Điệp đã ẩn nấp hoàn hảo và đánh lừa toàn bộ dân thường!',
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          trophyColor: 'text-rose-400',
        };
      case 'MR_WHITE':
        return {
          title: 'MR. WHITE CHIẾN THẮNG! 🎭',
          subtitle: 'Mr. White đã đoán chính xác từ khóa và lật ngược tình thế ngoạn mục!',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          trophyColor: 'text-purple-400',
        };
      default:
        return {
          title: 'TRÒ CHƠI KẾT THÚC',
          subtitle: 'Ván đấu đã kết thúc',
          badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          trophyColor: 'text-amber-400',
        };
    }
  };

  const winnerConfig = getWinnerConfig(winner);

  const getRoleBadge = (role?: Role) => {
    switch (role) {
      case 'CIVILIAN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">Dân Thường</span>;
      case 'SPY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">Gián Điệp</span>;
      case 'MR_WHITE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">Mr. White</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 text-slate-100 animate-fadeIn my-auto">
        {/* Victory Header */}
        <div className="text-center space-y-2 py-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg">
            <Trophy className={`w-9 h-9 ${winnerConfig.trophyColor}`} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-100 tracking-wide">
              {winnerConfig.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {winnerConfig.subtitle}
            </p>
          </div>
        </div>

        {/* Full Revelation Board */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Lật mở bí mật toàn bộ mật vụ</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-lg shrink-0">
                    {getAvatarEmoji(p.avatar)}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200 truncate">{p.name}</span>
                      {!p.isAlive && (
                        <span className="text-[10px] text-rose-400 flex items-center gap-0.5">
                          <Skull className="w-2.5 h-2.5" />
                          (Loại)
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5">{getRoleBadge(p.revealedRole)}</div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="text-[10px] text-slate-500 block">Từ khóa:</span>
                  <span className="font-bold text-amber-400">
                    {p.revealedRole === 'MR_WHITE' ? 'Không có' : p.revealedWord || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 px-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isHost ? 'BẮT ĐẦU VÁN MỚI' : 'CHƠI LẠI VÁN MỚI'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
