import React, { useState } from 'react';
import { HelpCircle, Sparkles, Send, Clock } from 'lucide-react';

export interface MrWhiteModalProps {
  isMrWhite: boolean;
  mrWhitePlayerName: string;
  onSubmitGuess: (guess: string) => void;
}

export const MrWhiteModal: React.FC<MrWhiteModalProps> = ({
  isMrWhite,
  mrWhitePlayerName,
  onSubmitGuess,
}) => {
  const [guess, setGuess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim()) return;
    onSubmitGuess(guess.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="w-full max-w-sm bg-slate-900 border border-purple-500/50 rounded-3xl p-5 shadow-2xl flex flex-col space-y-4 text-slate-100 animate-fadeIn ring-2 ring-purple-500/20">
        {isMrWhite ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[11px] font-bold tracking-wider uppercase mb-1">
                  LẬT KÈO CHIẾN THẮNG
                </span>
                <h3 className="text-lg font-black text-slate-100">
                  CƠ HỘI ĐOÁN TỪ CỦA MR. WHITE!
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Bạn đã bị phát hiện, nhưng nếu bạn đoán chính xác từ khóa của Dân Thường, bạn sẽ lập tức giành chiến thắng!
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Từ khóa bạn đoán là:
              </label>
              <input
                type="text"
                autoFocus
                placeholder="Nhập từ khóa của Dân Thường..."
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-purple-500/40 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 text-sm font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={!guess.trim()}
              className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                guess.trim()
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white active:scale-[0.98] cursor-pointer shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>XÁC NHẬN ĐOÁN TỪ</span>
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 animate-pulse">
              <HelpCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-100">
                {mrWhitePlayerName} đang đoán từ...
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-purple-300">{mrWhitePlayerName}</span> là Mr. White và đang có cơ hội lật kèo. Nếu đoán đúng từ của Dân Thường, Mr. White sẽ thắng!
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-purple-300/80 bg-purple-950/40 border border-purple-900/50 py-2 px-3 rounded-xl">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Đang chờ câu trả lời...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
