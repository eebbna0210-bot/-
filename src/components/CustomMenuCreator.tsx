import React, { useState } from 'react';
import { Recipe, IngredientMeta, CustomDishRecipe } from '../types/cooking';
import { INGREDIENTS_DATABASE } from '../data/recipes';
import { sound } from '../utils/soundEngine';
import { PlusCircle, Sparkles, ChefHat, Check, ArrowRight, DollarSign, Flame, Utensils } from 'lucide-react';

interface Props {
  onRegisterCustomRecipe: (newRecipe: Recipe) => void;
  onCookRecipeNow: (recipe: Recipe) => void;
}

export const CustomMenuCreator: React.FC<Props> = ({
  onRegisterCustomRecipe,
  onCookRecipeNow,
}) => {
  const [dishName, setDishName] = useState('특제 트러플 갈릭 스테이크');
  const [baseCategory, setBaseCategory] = useState<'양식' | '한식' | '일식/중식' | '스트리트 푸드'>('양식');
  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>([
    'ribeye_beef',
    'garlic',
    'butter',
    'mushroom',
    'rosemary',
  ]);
  const [cookingMethod, setCookingMethod] = useState<'고온 무쇠팬 시어링' | '직화 웍 덤블링' | '저온 버터 아로제' | '진한 육수 뚝배기 삶기'>('고온 무쇠팬 시어링');
  const [price, setPrice] = useState<number>(38000);
  const [description, setDescription] = useState('신선한 최상급 소고기와 마늘, 버섯을 고온 무쇠팬에서 시어링하여 풍부한 육즙을 가둔 나만의 시그니처 메뉴.');
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRecipe, setCreatedRecipe] = useState<Recipe | null>(null);

  const allIngredients = Object.values(INGREDIENTS_DATABASE);

  const toggleIngredient = (id: string) => {
    if (selectedIngredientIds.includes(id)) {
      if (selectedIngredientIds.length > 2) {
        setSelectedIngredientIds((prev) => prev.filter((i) => i !== id));
      }
    } else {
      if (selectedIngredientIds.length < 6) {
        setSelectedIngredientIds((prev) => [...prev, id]);
        sound.playChop();
      }
    }
  };

  // Calculate dynamic umami & nutrition
  const umamiScore = Math.min(
    100,
    65 + selectedIngredientIds.length * 5 + (selectedIngredientIds.includes('ribeye_beef') ? 10 : 0)
  );

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim()) return;

    sound.playSuccessFanfare();

    const newRecipe: Recipe = {
      id: `custom-${Date.now()}`,
      name: dishName,
      koreanName: dishName,
      difficulty: '마스터',
      prepTimeMinutes: 16,
      category: baseCategory,
      description: description,
      price: price,
      ingredients: selectedIngredientIds.map((metaId, idx) => ({
        metaId,
        amount: idx === 0 ? '200g' : '적당량',
        role: idx === 0 ? 'main' : 'sub',
      })),
      steps: [
        {
          station: 'CHOPPING',
          title: '시그니처 재료 정갈한 손질',
          instruction: '도마 위에서 모든 재료를 균일한 두께로 슬라이스하세요.',
          targetIngredientIds: selectedIngredientIds,
          requiredCount: 10,
          tip: '두께가 일정할수록 씹는 맛과 풍미가 살아납니다.',
        },
        {
          station: 'SEASONING',
          title: '특제 황금비율 시즈닝',
          instruction: '풍미를 극대화할 수 있도록 균일하게 양념을 도포하세요.',
          targetIngredientIds: selectedIngredientIds,
          tip: '재료 본연의 맛을 살릴 수 있도록 간을 조절하세요.',
        },
        {
          station: 'FRYING',
          title: `${cookingMethod} 조리`,
          instruction: '불 조절에 집중하며 완벽한 골든 크러스트를 만드세요.',
          targetIngredientIds: selectedIngredientIds,
          targetDoneness: 85,
          tip: '팬 덤블링으로 뒤집어 고르게 익히세요.',
        },
        {
          station: 'PLATING',
          title: '아티산 시그니처 플레이팅',
          instruction: '개발한 고유 메뉴의 개성이 돋보이도록 접시에 감각적으로 담아내세요.',
          targetIngredientIds: selectedIngredientIds,
          tip: '중앙에 주재료를 높이 세우고 소스로 포인트를 주세요.',
        },
      ],
      flavorProfile: {
        savory: umamiScore,
        saltiness: 70,
        sweetness: 40,
        spiciness: selectedIngredientIds.includes('chili') ? 80 : 25,
        freshness: selectedIngredientIds.includes('rosemary') ? 75 : 50,
      },
    };

    setCreatedRecipe(newRecipe);
    setIsSuccess(true);
    onRegisterCustomRecipe(newRecipe);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>나만의 키친 랩 (Kitchen Lab &amp; Sandbox)</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
          신메뉴 개발 &amp; 커스텀 레시피 생성기
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          원하는 식자재와 조리법, 풍미를 자유롭게 조합하여 나만의 시그니처 요리를 창작하고 레스토랑 정식 메뉴로 등록하세요.
        </p>
      </div>

      {!isSuccess ? (
        <form onSubmit={handleRegister} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl">
            {/* Dish Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                신메뉴 이름 (Signature Dish Name)
              </label>
              <input
                type="text"
                value={dishName}
                onChange={(e) => setDishName(e.target.value)}
                placeholder="예: 갈릭 버터 랍스터 &amp; 감자 퓨레"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                요리 카테고리 (Category)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['양식', '한식', '일식/중식', '스트리트 푸드'] as const).map((cat) => (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setBaseCategory(cat)}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-all ${
                      baseCategory === cat
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredient Selector */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  식자재 선택 ({selectedIngredientIds.length} / 최대 6종)
                </label>
                <span className="text-[10px] text-slate-500">최소 2개 이상 선택</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1">
                {allIngredients.map((ing) => {
                  const isSelected = selectedIngredientIds.includes(ing.id);
                  return (
                    <button
                      type="button"
                      key={ing.id}
                      onClick={() => toggleIngredient(ing.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-500/80 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-lg">{ing.icon}</span>
                      <span className="text-[11px] font-medium truncate">{ing.koreanName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cooking Method */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                핵심 조리 기법 (Cooking Method)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '고온 무쇠팬 시어링',
                  '직화 웍 덤블링',
                  '저온 버터 아로제',
                  '진한 육수 뚝배기 삶기',
                ].map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setCookingMethod(m as typeof cookingMethod)}
                    className={`p-2 text-xs font-semibold rounded-lg border text-left transition-all ${
                      cookingMethod === m
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-bold text-slate-300">메뉴 판매 단가</span>
                <span className="text-amber-400 font-bold tabular-nums">
                  {price.toLocaleString()}원
                </span>
              </div>
              <input
                type="range"
                min={12000}
                max={60000}
                step={1000}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                메뉴 소개 &amp; 셰프 노트
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              식당 정식 시그니처 메뉴로 등록하기
            </button>
          </div>

          {/* Right Live Preview: 5 cols */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-5 shadow-xl">
            <div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                Menu Card Live Preview
              </div>
              <div className="mt-4 p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl">
                    ✨
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-400 font-semibold">{baseCategory} · 시그니처</div>
                    <div className="text-base font-bold text-white mt-0.5">{dishName || '새로운 메뉴'}</div>
                    <div className="text-xs font-bold text-amber-400 tabular-nums mt-0.5">
                      {price.toLocaleString()}원
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed italic">
                  &ldquo;{description}&rdquo;
                </p>

                {/* Selected Ingredients Badges */}
                <div className="border-t border-slate-800 pt-3">
                  <div className="text-[10px] text-slate-400 mb-1.5">포함 식자재:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedIngredientIds.map((id) => {
                      const meta = INGREDIENTS_DATABASE[id];
                      return (
                        <span
                          key={id}
                          className="text-[11px] bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 text-slate-200 flex items-center gap-1"
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.koreanName}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Analysis Score */}
                <div className="border-t border-slate-800 pt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400">감칠맛 지수 (Umami)</div>
                    <div className="text-base font-bold text-amber-400 tabular-nums">{umamiScore}점</div>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg text-center">
                    <div className="text-[10px] text-slate-400">조리 기법</div>
                    <div className="text-[11px] font-bold text-sky-400 truncate">{cookingMethod}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              등록 즉시 레스토랑 모드에서 고객들이 주문하기 시작합니다.
            </div>
          </div>
        </form>
      ) : (
        /* Success registered view */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>

          <div>
            <div className="text-xs font-bold text-emerald-400 tracking-wider">신메뉴 등록 완료!</div>
            <h2 className="text-2xl font-bold text-white mt-1">{dishName}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              레스토랑 공식 메뉴판에 정식으로 등재되었습니다. 지금 바로 주방에서 직접 모든 단계를 조리해보세요!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSuccess(false)}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              또 다른 메뉴 개발하기
            </button>
            {createdRecipe && (
              <button
                onClick={() => onCookRecipeNow(createdRecipe)}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
              >
                <ChefHat className="w-4 h-4" />
                <span>이 메뉴 지금 조리하기</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
