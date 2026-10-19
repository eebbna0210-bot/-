import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CookingDishResult } from '../types/cooking';
import { Star, Award, DollarSign, Heart, ArrowRight, RotateCcw } from 'lucide-react';

interface Props {
  result: CookingDishResult;
  onClose: () => void;
  onRetry: () => void;
}

export const DishResultModal: React.FC<Props> = ({ result, onClose, onRetry }) => {
  useEffect(() => {
    // Fire celebratory confetti on high stars
    if (result.stars >= 4) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.stars]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden p-6 text-white flex flex-col gap-5">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-amber-400">
            <Award className="w-4 h-4" />
            <span>미슐랭 가이드 미식 평가단 판정</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mt-1">
            {result.recipe.koreanName}
          </h2>
          <p className="text-xs text-slate-400">
            {result.recipe.category} · 조리 시간 {result.timeSpentSeconds}초
          </p>
        </div>

        {/* Stars Display */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-8 h-8 transition-all ${
                s <= result.stars
                  ? 'text-amber-400 fill-amber-400 drop-shadow-md'
                  : 'text-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Total Score Badge */}
        <div className="flex items-center justify-center gap-6 py-2 bg-slate-800/60 rounded-xl border border-slate-700/40">
          <div className="text-center">
            <div className="text-[11px] text-slate-400">종합 완성도</div>
            <div className="text-2xl font-extrabold text-amber-400 tabular-nums">
              {result.totalScore}
              <span className="text-xs text-slate-400 font-normal"> / 100점</span>
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-center">
            <div className="text-[11px] text-slate-400">획득 수익</div>
            <div className="text-2xl font-extrabold text-emerald-400 tabular-nums flex items-center justify-center">
              <span>+{result.earnings.toLocaleString()}원</span>
            </div>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="flex flex-col gap-2.5 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">재료 손질 균일도 (Cutting Precision)</span>
              <span className="text-slate-200 font-semibold tabular-nums">{result.cutAccuracy}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${result.cutAccuracy}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">불 조절 &amp; 익힘 완성도 (Doneness)</span>
              <span className="text-slate-200 font-semibold tabular-nums">{result.donenessScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${result.donenessScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">양념 &amp; 풍미 조화 (Flavor Balance)</span>
              <span className="text-slate-200 font-semibold tabular-nums">{result.seasoningScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-400 h-full transition-all duration-300"
                style={{ width: `${result.seasoningScore}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">플레이팅 미학 (Presentation)</span>
              <span className="text-slate-200 font-semibold tabular-nums">{result.platingScore}%</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-purple-400 h-full transition-all duration-300"
                style={{ width: `${result.platingScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Customer / Critic Comment */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-200 italic">
          &ldquo;{result.customerFeedback}&rdquo;
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-1">
          <button
            onClick={onRetry}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 요리하기</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-colors"
          >
            <span>서빙 완료 &amp; 계속하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
