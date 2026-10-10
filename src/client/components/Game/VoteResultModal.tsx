import React from 'react';
import { Skull, AlertTriangle, ArrowRight, BarChart3 } from 'lucide-react';
import type { VoteResult } from '../../../core/types.js';
import type { PublicPlayerState } from '../../network/types.js';
import { AVATAR_OPTIONS, type AvatarOption } from '../Lobby/ProfileSetup.js';

export interface VoteResultModalProps {
  result: VoteResult;
  players: PublicPlayerState[];
  isHost: boolean;
  onProceed: () => void;
}

export const VoteResultModal: React.FC<VoteResultModalProps> = ({
  result,
  players,
  isHost,
  onProceed,
}) => {
  const eliminatedPlayer = result.eliminatedPlayerId
    ? players.find((p) => p.id === result.eliminatedPlayerId)
    : null;

  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a: AvatarOption) => a.id === avatarId);
    return found ? found.emoji : '🕵️';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 text-slate-100 animate-fadeIn">
        {/* Result Header */}
        {result.isTie ? (
          <div className="text-center space-y-2 py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-wide text-amber-400">
                HÒA PHIẾU!
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Số phiếu cao nhất bằng nhau. Không ai bị loại trong vòng này!
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-2 py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
              <Skull className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-block px-3 py-0.5 rounded bg-rose-600/20 border border-rose-500/40 text-rose-400 font-mono font-bold text-xs tracking-wider uppercase mb-1">
                BỊ TRỤC XUẤT
              </div>
              <h3 className="text-xl font-black text-slate-100 flex items-center justify-center gap-2">
                <span>{eliminatedPlayer ? getAvatarEmoji(eliminatedPlayer.avatar) : '🕵️'}</span>
                <span>{eliminatedPlayer?.name || 'Mật vụ'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Đã nhận số phiếu bầu cao nhất từ đa số hội đồng thám tử.
              </p>
            </div>
          </div>
        )}

        {/* Vote Counts Summary */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 pb-1 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thống kê số phiếu bầu</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {players
              .filter((p) => p.isAlive || p.id === result.eliminatedPlayerId)
              .map((p) => {
                const count = result.voteCounts[p.id] || 0;
                const isEliminated = p.id === result.eliminatedPlayerId;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-1.5 px-2.5 rounded-lg text-xs ${
                      isEliminated
                        ? 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
                        : 'bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span>{getAvatarEmoji(p.avatar)}</span>
                      <span className="font-medium truncate">{p.name}</span>
                    </div>
                    <span className="font-bold shrink-0">{count} phiếu</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1 space-y-1.5">
          <button
            onClick={onProceed}
            className="w-full py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>TIẾP TỤC</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          {isHost && (
            <p className="text-[10px] text-center text-slate-400">
              Chủ phòng hoặc mật vụ có thể bấm để chuyển tiếp
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
