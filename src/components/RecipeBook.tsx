import React, { useState } from 'react';
import { Recipe } from '../types/cooking';
import { INITIAL_RECIPES, INGREDIENTS_DATABASE } from '../data/recipes';
import { BookOpen, ChefHat, Clock, Sparkles, Flame, Check } from 'lucide-react';

interface Props {
  onSelectRecipe: (recipe: Recipe) => void;
  selectedRecipeId?: string;
}

export const RecipeBook: React.FC<Props> = ({ onSelectRecipe, selectedRecipeId }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeRecipe, setActiveRecipe] = useState<Recipe>(
    INITIAL_RECIPES.find((r) => r.id === selectedRecipeId) || INITIAL_RECIPES[0]
  );

  const categories = [
    { id: 'all', label: '전체 메뉴' },
    { id: '양식', label: '양식 (Western)' },
    { id: '한식', label: '한식 (Korean)' },
    { id: '일식/중식', label: '일식/중식 (Asian)' },
    { id: '스트리트 푸드', label: '스트리트 푸드' },
  ];

  const filteredRecipes = INITIAL_RECIPES.filter((r) =>
    selectedCategory === 'all' ? true : r.category === selectedCategory
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <BookOpen className="w-4 h-4" />
            <span>그랜드 마스터 레시피 아카데미</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
            세계 요리 마스터 레시피북
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            재료 손질 기법부터 완벽한 불 조절, 황금 비율 시즈닝, 모던 플레이팅까지 모든 단계를 학습하세요.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Recipe Explorer Grid: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left List: 5 cols */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {filteredRecipes.map((r) => {
            const isSelected = activeRecipe.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setActiveRecipe(r)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-slate-850 border-amber-500/80 shadow-lg ring-1 ring-amber-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {r.image ? (
                    <img
                      src={r.image}
                      alt={r.koreanName}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-700 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                      🍳
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 text-[10px] text-amber-400 font-semibold">
                      <span>{r.category}</span>
                      <span className="text-slate-600">·</span>
                      <span>난이도 {r.difficulty}</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-0.5">{r.koreanName}</div>
                    <div className="text-xs text-slate-400 tabular-nums mt-0.5">
                      {r.price.toLocaleString()}원 · 조리 예상 {r.prepTimeMinutes}분
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] px-2 py-1 rounded-md font-semibold ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {isSelected ? '선택됨' : '보기'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Pane: 7 cols */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          {/* Active Recipe Hero */}
          <div className="flex flex-col md:flex-row gap-5 items-start">
            {activeRecipe.image && (
              <img
                src={activeRecipe.image}
                alt={activeRecipe.koreanName}
                className="w-full md:w-52 h-44 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="flex flex-col justify-between flex-1">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                  <span>{activeRecipe.category}</span>
                  <span className="text-slate-600">·</span>
                  <span>난이도 {activeRecipe.difficulty}</span>
                  <span className="text-slate-600">·</span>
                  <span>예상 시간 {activeRecipe.prepTimeMinutes}분</span>
                </div>
                <h2 className="text-2xl font-bold font-display text-white mt-1">
                  {activeRecipe.koreanName}
                </h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {activeRecipe.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-sm font-bold text-amber-400 tabular-nums">
                  판매 단가: {activeRecipe.price.toLocaleString()}원
                </div>
                <button
                  onClick={() => onSelectRecipe(activeRecipe)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  <ChefHat className="w-4 h-4" />
                  <span>이 레시피로 즉시 조리 시작</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ingredients list */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              필요 필수 식자재 (Ingredients)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeRecipe.ingredients.map((ing) => {
                const meta = INGREDIENTS_DATABASE[ing.metaId];
                if (!meta) return null;
                return (
                  <div
                    key={ing.metaId}
                    className="p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-center gap-2.5"
                  >
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{meta.koreanName}</div>
                      <div className="text-[10px] text-slate-400">{ing.amount}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Flavor Profile Bars */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              미식 풍미 밸런스 지수 (Flavor Balance Profile)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 text-xs">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">감칠맛 (Savory)</span>
                  <span className="text-amber-400 font-semibold">{activeRecipe.flavorProfile.savory}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full"
                    style={{ width: `${activeRecipe.flavorProfile.savory}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">염도 (Saltiness)</span>
                  <span className="text-sky-400 font-semibold">{activeRecipe.flavorProfile.saltiness}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-sky-400 h-full"
                    style={{ width: `${activeRecipe.flavorProfile.saltiness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">매운맛 (Spiciness)</span>
                  <span className="text-rose-400 font-semibold">{activeRecipe.flavorProfile.spiciness}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-rose-500 h-full"
                    style={{ width: `${activeRecipe.flavorProfile.spiciness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">단맛 (Sweetness)</span>
                  <span className="text-yellow-300 font-semibold">{activeRecipe.flavorProfile.sweetness}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full"
                    style={{ width: `${activeRecipe.flavorProfile.sweetness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-slate-400">신선도 &amp; 허브 (Freshness)</span>
                  <span className="text-emerald-400 font-semibold">{activeRecipe.flavorProfile.freshness}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full"
                    style={{ width: `${activeRecipe.flavorProfile.freshness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step by step outline */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              조리 단계 요약 (Cooking Process)
            </h3>
            <div className="flex flex-col gap-2">
              {activeRecipe.steps.map((st, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">{st.title}</div>
                    <div className="text-xs text-slate-300 mt-0.5">{st.instruction}</div>
                    <div className="text-[11px] text-amber-300/80 mt-1">팁: {st.tip}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
