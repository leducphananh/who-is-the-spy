import React, { useState, useEffect } from 'react';
import { Crown, Copy, Check, Users, Settings, LogOut, Play, ShieldAlert, Sparkles, BookOpen, Edit3, Loader2, AlertCircle, Lock } from 'lucide-react';
import type { PlayerPresence } from '../../network/types.js';
import type { GameConfig, WordPair } from '../../../core/types.js';
import { AVATAR_OPTIONS, type AvatarOption } from './ProfileSetup.js';
import { generateCustomWordPair } from '../../lib/geminiWords.js';

export interface WaitingRoomProps {
  roomCode: string;
  myUserId: string;
  isHost: boolean;
  players: PlayerPresence[];
  config: GameConfig;
  onUpdateConfig?: (config: GameConfig) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  quickWordPair?: WordPair | null | undefined;
  onQuickWordPairChange?: ((pair: WordPair | null) => void) | undefined;
  activePackName?: string | undefined;
  onOpenWordPackModal?: (() => void) | undefined;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomCode,
  myUserId,
  isHost,
  players,
  config,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
  quickWordPair,
  onQuickWordPairChange,
  activePackName,
  onOpenWordPackModal,
}) => {
  const [copied, setCopied] = useState(false);
  const [useQuickWords, setUseQuickWords] = useState(Boolean(quickWordPair));
  const [quickCiv, setQuickCiv] = useState(quickWordPair?.civilianWord || '');
  const [quickSpy, setQuickSpy] = useState(quickWordPair?.spyWord || '');
  const [pendingMysteryPair, setPendingMysteryPair] = useState<WordPair | null>(null);
  const [revealWords, setRevealWords] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleCopyCode = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(roomCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAvatarEmoji = (avatarId: string) => {
    const found = AVATAR_OPTIONS.find((a: AvatarOption) => a.id === avatarId);
    return found ? found.emoji : '🕵️';
  };

  const isDuplicateWord =
    useQuickWords &&
    (!pendingMysteryPair || revealWords) &&
    quickCiv.trim() !== '' &&
    quickSpy.trim() !== '' &&
    quickCiv.trim().toLowerCase() === quickSpy.trim().toLowerCase();

  const isQuickWordIncomplete =
    useQuickWords &&
    (!pendingMysteryPair || revealWords) &&
    (quickCiv.trim() === '' || quickSpy.trim() === '');

  const canStart = players.length >= 3 && !isDuplicateWord && !isQuickWordIncomplete;

  useEffect(() => {
    if (!useQuickWords) {
      onQuickWordPairChange?.(null);
    } else if (pendingMysteryPair && !revealWords) {
      onQuickWordPairChange?.(pendingMysteryPair);
    } else if (quickCiv.trim() && quickSpy.trim() && !isDuplicateWord) {
      onQuickWordPairChange?.({
        id: pendingMysteryPair ? pendingMysteryPair.id : `custom_${Date.now()}`,
        civilianWord: quickCiv.trim(),
        spyWord: quickSpy.trim(),
        category: pendingMysteryPair?.category || 'Tự nhập',
      });
    } else {
      onQuickWordPairChange?.(null);
    }
  }, [useQuickWords, pendingMysteryPair, revealWords, quickCiv, quickSpy, isDuplicateWord]);

  const handleSpyCountChange = (count: number) => {
    if (!isHost || !onUpdateConfig) return;
    onUpdateConfig({
      ...config,
      spyCount: count,
    });
  };

  const handleMrWhiteToggle = () => {
    if (!isHost || !onUpdateConfig) return;
    onUpdateConfig({
      ...config,
      hasMrWhite: !config.hasMrWhite,
    });
  };

  const handleAiSuggest = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const pair = await generateCustomWordPair(aiTopic.trim() || undefined);
      setPendingMysteryPair(pair);
      setRevealWords(false);
      setQuickCiv(pair.civilianWord);
      setQuickSpy(pair.spyWord);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo gợi ý từ AI';
      setAiError(msg);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full w-full max-w-md mx-auto p-4 space-y-5 text-slate-100">
      {/* Header with Room Code */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
              Mã phòng mật vụ
            </span>
            <div className="text-3xl font-black tracking-widest text-amber-400 font-mono mt-0.5">
              {roomCode}
            </div>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 transition-all shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>Sao chép</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Players List Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
              Danh sách Mật vụ ({players.length}/10)
            </h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {players.length < 3 ? 'Cần thêm ' + (3 - players.length) : 'Đủ điều kiện'}
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {players.map((p) => {
            const isMe = p.id === myUserId;
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                  isMe
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-slate-950/50 border-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-xl shadow-inner">
                    {getAvatarEmoji(p.avatar)}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-100">
                        {p.name}
                      </span>
                      {isMe && (
                        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-medium">
                          Bạn
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {p.isHost && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
                    <Crown className="w-3.5 h-3.5" />
                    <span>Chủ phòng</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Game Settings */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
          <Settings className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Cài đặt trò chơi
          </h3>
        </div>

        {/* Spy Count Setting */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-200">Số lượng Gián Điệp</div>
            <div className="text-[11px] text-slate-400">
              {players.length < 6 ? 'Dưới 6 người: tối đa 1 Gián Điệp' : 'Từ 6 người: tối đa 2 Gián Điệp'}
            </div>
          </div>
          {isHost ? (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSpyCountChange(1)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  config.spyCount === 1
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1 Spy
              </button>
              <button
                type="button"
                disabled={players.length < 6}
                onClick={() => handleSpyCountChange(2)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  players.length < 6
                    ? 'opacity-30 cursor-not-allowed text-slate-600'
                    : config.spyCount === 2
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2 Spies
              </button>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-rose-400 text-xs font-semibold border border-slate-700">
              {config.spyCount} Gián Điệp
            </span>
          )}
        </div>

        {/* Mr. White Mode Setting */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-xs font-medium text-slate-200">Chế độ Mr. White</div>
            <div className="text-[11px] text-slate-400">
              Kẻ không biết từ khóa bí mật, có cơ hội đoán từ để lật kèo
            </div>
          </div>
          {isHost ? (
            <button
              type="button"
              onClick={handleMrWhiteToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                config.hasMrWhite ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.hasMrWhite ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          ) : (
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                config.hasMrWhite
                  ? 'bg-cyan-950/60 text-cyan-300 border-cyan-800'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {config.hasMrWhite ? 'Bật' : 'Tắt'}
            </span>
          )}
        </div>

        {/* Word Pack Selection */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <div>
            <div className="text-xs font-medium text-slate-200">Gói từ khóa bí mật</div>
            <div className="text-[11px] text-amber-400 font-semibold truncate max-w-[180px]">
              {activePackName || 'Kho từ mặc định (36 cặp)'}
            </div>
          </div>
          {isHost ? (
            <button
              type="button"
              onClick={onOpenWordPackModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700 transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Gói từ</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400">Tự động</span>
          )}
        </div>

        {/* Quick Custom Words Accordion (Host only) */}
        {isHost && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-200">
                <input
                  type="checkbox"
                  data-testid="toggle-quick-word"
                  checked={useQuickWords}
                  onChange={(e) => {
                    setUseQuickWords(e.target.checked);
                    if (!e.target.checked) {
                      setPendingMysteryPair(null);
                      setRevealWords(false);
                    }
                  }}
                  className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span className="flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tự nhập từ cho ván này</span>
                </span>
              </label>
            </div>

            {useQuickWords && (
              <div className="space-y-2.5 pt-1 animate-fadeIn">
                {pendingMysteryPair && !revealWords ? (
                  <div
                    data-testid="sealed-mystery-card"
                    className="p-3 bg-slate-950/90 border border-amber-500/50 rounded-2xl space-y-3 shadow-xl backdrop-blur-md"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                        <Lock className="w-4 h-4 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-amber-300">
                            Mật thư bí mật đã được niêm phong
                          </span>
                          <span className="text-xs">🔒</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          Từ khóa đã được AI tạo ngầm. Host sẽ không biết trước từ để cùng chơi công bằng!
                        </p>
                      </div>
                    </div>

                    {/* Topic / Category Badge */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] text-slate-400 font-medium">Chủ đề ván:</span>
                      <span
                        data-testid="mystery-category-badge"
                        className="text-xs font-bold text-cyan-300 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-800"
                      >
                        {pendingMysteryPair.category || 'Tự động'}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        data-testid="regenerate-mystery-btn"
                        disabled={isAiLoading}
                        onClick={handleAiSuggest}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-amber-400 font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tạo...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tạo cặp từ khác</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        data-testid="cancel-mystery-btn"
                        onClick={() => {
                          setPendingMysteryPair(null);
                          setQuickCiv('');
                          setQuickSpy('');
                          setRevealWords(false);
                        }}
                        className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                      >
                        Tự nhập tay
                      </button>
                    </div>

                    {/* Host Reveal Toggle */}
                    <div className="pt-0.5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-400 hover:text-slate-300">
                        <input
                          type="checkbox"
                          data-testid="toggle-reveal-words"
                          checked={revealWords}
                          onChange={(e) => setRevealWords(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>Mở xem từ khóa (chỉ bật nếu Host không chơi ván này)</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    {pendingMysteryPair && revealWords && (
                      <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-300 text-[11px]">
                        <span>Đang mở xem từ khóa (Host làm Game Master)</span>
                        <button
                          type="button"
                          data-testid="reseal-mystery-btn"
                          onClick={() => setRevealWords(false)}
                          className="text-xs text-amber-400 underline font-semibold hover:text-amber-300 ml-2"
                        >
                          Niêm phong lại 🔒
                        </button>
                      </div>
                    )}

                    {/* AI Suggestion Bar */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        data-testid="ai-topic-input"
                        placeholder="Chủ đề (vd: Ẩm thực, Công nghệ...)"
                        value={aiTopic}
                        onChange={(e) => {
                          setAiTopic(e.target.value);
                          if (aiError) setAiError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAiSuggest();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        data-testid="ai-suggest-btn"
                        disabled={isAiLoading}
                        onClick={handleAiSuggest}
                        className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Đang tạo...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                            <span>AI gợi ý</span>
                          </>
                        )}
                      </button>
                    </div>

                    {aiError && (
                      <p data-testid="ai-error-msg" className="text-[11px] text-rose-400 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{aiError}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-cyan-400 font-semibold uppercase block mb-0.5">
                          Từ Dân Thường
                        </label>
                        <input
                          type="text"
                          data-testid="quick-civ-word"
                          placeholder="vd: Cà phê"
                          value={quickCiv}
                          onChange={(e) => setQuickCiv(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-rose-400 font-semibold uppercase block mb-0.5">
                          Từ Gián Điệp
                        </label>
                        <input
                          type="text"
                          data-testid="quick-spy-word"
                          placeholder="vd: Trà đá"
                          value={quickSpy}
                          onChange={(e) => setQuickSpy(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-400"
                        />
                      </div>
                    </div>

                    {isDuplicateWord && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                        <span>Từ Dân thường và Gián điệp không được trùng nhau</span>
                      </p>
                    )}

                    {isQuickWordIncomplete && (
                      <p className="text-[11px] text-amber-400/80">
                        Vui lòng nhập đầy đủ cả 2 từ khóa
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Controls */}
      <div className="space-y-3 pt-2">
        {isHost ? (
          <div>
            <button
              disabled={!canStart}
              onClick={onStartGame}
              className={`w-full py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 active:scale-[0.98] cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU TRÒ CHƠI</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-rose-400 mt-2 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {players.length < 3
                    ? 'Cần tối thiểu 3 người chơi để bắt đầu'
                    : isDuplicateWord
                    ? 'Từ Dân thường và Gián điệp không được trùng nhau'
                    : isQuickWordIncomplete
                    ? 'Chưa nhập đủ từ khóa tùy chỉnh'
                    : 'Chưa đủ điều kiện bắt đầu'}
                </span>
              </p>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">
              Đang chờ chủ phòng bắt đầu trò chơi...
            </span>
          </div>
        )}

        <button
          onClick={onLeaveRoom}
          className="w-full py-2.5 px-4 rounded-xl font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 flex items-center justify-center gap-2 text-xs transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Rời phòng</span>
        </button>
      </div>
    </div>
  );
};
