import React from 'react';
import { WifiOff, Clock, ShieldAlert } from 'lucide-react';

export interface HostReconnectOverlayProps {
  secondsRemaining: number;
  isOldHost: boolean;
}

export const HostReconnectOverlay: React.FC<HostReconnectOverlayProps> = ({
  secondsRemaining,
  isOldHost,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/50 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-4 text-slate-100 animate-fadeIn ring-2 ring-amber-500/20">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold tracking-wider uppercase">
            TẠM DỪNG VÁN ĐẤU
          </div>
          <h3 className="text-lg font-black text-slate-100 pt-1">
            Chủ phòng tạm thời mất kết nối
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {isOldHost
              ? 'Bạn vừa mất kết nối mạng. Đang khôi phục lại quyền chủ phòng...'
              : 'Hệ thống đang chờ chủ phòng kết nối lại mạng trong 30 giây.'}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-2xl w-full flex items-center justify-center gap-3">
          <Clock className="w-6 h-6 text-amber-400 animate-spin" />
          <div className="text-3xl font-black text-amber-400 font-mono tracking-widest">
            {secondsRemaining}s
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Hết thời gian sẽ tự động chuyển quyền Host</span>
        </div>
      </div>
    </div>
  );
};
