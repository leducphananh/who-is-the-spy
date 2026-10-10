import React, { useState } from 'react';
import { Vote, CheckCircle2, Users, Target } from 'lucide-react';
import type { PublicPlayerState } from '../../network/types.js';
import { AVATAR_OPTIONS, type AvatarOption } from '../Lobby/ProfileSetup.js';

export interface VotingViewProps {
  players: PublicPlayerState[];
  myUserId: string;
  hasVoted: boolean;
  myVoteTargetId?: string | null;
  onCastVote: (targetId: string) => void;
}

export const VotingView: React.FC<VotingViewProps> = ({
  players,
  myUserId,
  hasVoted,
  myVoteTargetId,
  onCastVote,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(myVoteTargetId || null);

  const alivePlayers = players.filter((p) => p.isAlive);
  const totalAlive = alivePlayers.length;
  const votedCount = alivePlayers.filter((p) => p.hasVoted).length;

  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a: AvatarOption) => a.id === avatarId);
    return found ? found.emoji : '🕵️';
  };

  const handleSelect = (playerId: string) => {
    if (hasVoted || playerId === myUserId) return;
    setSelectedTargetId(playerId);
  };

  const handleConfirmVote = () => {
    if (!selectedTargetId || hasVoted) return;
    onCastVote(selectedTargetId);
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto p-4 space-y-4 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Bỏ Phiếu Loại Trừ</h2>
            <p className="text-[11px] text-slate-400">Chọn người bạn nghi ngờ là Gián Điệp</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {votedCount}/{totalAlive} đã vote
          </span>
        </div>
      </div>

      {/* Status banner */}
      {hasVoted ? (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="font-semibold">Đã ghi nhận phiếu bầu của bạn</div>
            <div className="text-[11px] text-emerald-400/80">
              Đang chờ các mật vụ còn lại hoàn tất bỏ phiếu...
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Chạm vào mật vụ bạn nghi ngờ để nhắm mục tiêu, sau đó ấn Xác nhận.</span>
        </div>
      )}

      {/* Suspect list */}
      <div className="space-y-2.5">
        {alivePlayers.map((player) => {
          const isMe = player.id === myUserId;
          const isSelected = selectedTargetId === player.id;

          return (
            <div
              key={player.id}
              data-testid={`suspect-${player.id}`}
              onClick={() => handleSelect(player.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                isMe
                  ? 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                  : isSelected
                  ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/30 shadow-lg cursor-pointer scale-[1.01]'
                  : hasVoted
                  ? 'bg-slate-950/60 border-slate-800 cursor-default'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${
                    isSelected
                      ? 'bg-rose-900/50 border-rose-500/60'
                      : 'bg-slate-800 border-slate-700'
                  }`}
                >
                  {getAvatarEmoji(player.avatar)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-100">{player.name}</span>
                    {isMe && (
                      <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.2 rounded font-medium">
                        Bạn
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {isMe
                      ? 'Không thể tự bỏ phiếu'
                      : isSelected
                      ? 'Đang chọn làm nghi phạm'
                      : 'Nhấn để chọn'}
                  </div>
                </div>
              </div>

              <div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Button */}
      {!hasVoted && (
        <div className="pt-2">
          <button
            disabled={!selectedTargetId}
            onClick={handleConfirmVote}
            className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              selectedTargetId
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white active:scale-[0.98] cursor-pointer shadow-rose-600/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Vote className="w-5 h-5" />
            <span>XÁC NHẬN BỎ PHIẾU</span>
          </button>
        </div>
      )}
    </div>
  );
};
