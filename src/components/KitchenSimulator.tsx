import React, { useState, useMemo } from 'react';
import { Recipe, CookingStationType, CookingDishResult, RestaurantState } from '../types/cooking';
import { INGREDIENTS_DATABASE } from '../data/recipes';
import { CuttingStationCanvas } from '../physics/CuttingStationCanvas';
import { PanFryingStationCanvas } from '../physics/PanFryingStationCanvas';
import { BoilingStationCanvas } from '../physics/BoilingStationCanvas';
import { SeasoningStationCanvas } from '../physics/SeasoningStationCanvas';
import { PlatingStationCanvas } from '../physics/PlatingStationCanvas';
import { DishResultModal } from './DishResultModal';
import {
  Scissors,
  Flame,
  Waves,
  Sparkles,
  Award,
  BookOpen,
  Info,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';

interface Props {
  recipe: Recipe;
  restaurant: RestaurantState;
  onDishCompleted: (result: CookingDishResult) => void;
  onOpenRecipeBook: () => void;
}

export const KitchenSimulator: React.FC<Props> = ({
  recipe,
  restaurant,
  onDishCompleted,
  onOpenRecipeBook,
}) => {
  const [currentStation, setCurrentStation] = useState<CookingStationType>('CHOPPING');
  const [stepIndex, setStepIndex] = useState(0);

  // Cooking state tracking
  const [totalCuts, setTotalCuts] = useState(0);
  const [cookDoneness, setCookDoneness] = useState(0);
  const [saltLevel, setSaltLevel] = useState(0);
  const [spiceLevel, setSpiceLevel] = useState(0);
  const [herbLevel, setHerbLevel] = useState(0);
  const [platingResult, setPlatingResult] = useState<{
    platingScore: number;
    stackCount: number;
    sauceCoverage: number;
  } | null>(null);

  const [dishResult, setDishResult] = useState<CookingDishResult | null>(null);
  const [startTime] = useState<number>(Date.now());

  // Resolved ingredient metadata objects
  const recipeIngredients = useMemo(() => {
    return recipe.ingredients
      .map((ing) => INGREDIENTS_DATABASE[ing.metaId])
      .filter(Boolean);
  }, [recipe]);

  const currentStep = recipe.steps[stepIndex] || recipe.steps[0];

  // Station navigation buttons
  const stations: { type: CookingStationType; label: string; icon: React.ReactNode }[] = [
    { type: 'CHOPPING', label: '1. 재료 손질 (도마)', icon: <Scissors className="w-4 h-4" /> },
    { type: 'SEASONING', label: '2. 시즈닝 (밑간)', icon: <Sparkles className="w-4 h-4" /> },
    { type: 'FRYING', label: '3. 팬 시어링 (프라이팬)', icon: <Flame className="w-4 h-4" /> },
    { type: 'BOILING', label: '4. 냄비 끓이기 (육수/면)', icon: <Waves className="w-4 h-4" /> },
    { type: 'PLATING', label: '5. 플레이팅 (접시 완성)', icon: <Award className="w-4 h-4" /> },
  ];

  // Advance step
  const handleStepComplete = () => {
    if (stepIndex < recipe.steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      setCurrentStation(recipe.steps[nextIdx].station);
    } else {
      setCurrentStation('PLATING');
    }
  };

  // Submit dish for grading
  const handleFinishPlating = (data: {
    platingScore: number;
    stackCount: number;
    sauceCoverage: number;
  }) => {
    setPlatingResult(data);

    // Calculate overall culinary score
    const targetCuts = 10;
    const cutAccuracy = Math.min(100, Math.round((Math.max(1, totalCuts) / targetCuts) * 85 + 15));

    // Doneness score
    const targetDone = currentStep.targetDoneness || 85;
    const donenessDiff = Math.abs(cookDoneness - targetDone);
    const donenessScore = Math.max(50, Math.min(100, Math.round(100 - donenessDiff * 1.2)));

    // Seasoning score
    const targetSalt = recipe.flavorProfile.saltiness;
    const saltDiff = Math.abs(saltLevel - targetSalt);
    const seasoningScore = Math.max(50, Math.min(100, Math.round(100 - saltDiff * 1.1)));

    // Plating score
    const platingScore = data.platingScore;

    // Weighted Total Score
    const totalScore = Math.round(
      cutAccuracy * 0.25 + donenessScore * 0.3 + seasoningScore * 0.25 + platingScore * 0.2
    );

    // Star conversion
    let stars = 3;
    if (totalScore >= 92) stars = 5;
    else if (totalScore >= 82) stars = 4;
    else if (totalScore >= 68) stars = 3;
    else if (totalScore >= 50) stars = 2;
    else stars = 1;

    // Time spent
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Feedback quote
    const feedbacks = [
      '완벽한 크러스트와 재료의 조화가 감동적입니다! 최고의 요리사네요.',
      '식감이 훌륭하고 풍미가 풍부합니다. 식당 손님들이 극찬할 맛입니다.',
      '정갈한 손질과 조화로운 간맞춤이 인상적인 수작입니다.',
      '정성이 가득 담긴 접시였습니다. 다음 요리도 무척 기대됩니다!',
    ];
    const customerFeedback = feedbacks[Math.floor(Math.random() * feedbacks.length)];

    // Earnings
    const basePrice = recipe.price;
    const earnings = Math.round(basePrice * (stars >= 4 ? 1.25 : stars === 3 ? 1.0 : 0.8));

    const finalResult: CookingDishResult = {
      recipe,
      cutAccuracy,
      donenessScore,
      seasoningScore,
      platingScore,
      totalScore,
      stars,
      timeSpentSeconds: timeSpent,
      customerFeedback,
      earnings,
    };

    setDishResult(finalResult);
    onDishCompleted(finalResult);
  };

  const handleResetCooking = () => {
    setTotalCuts(0);
    setCookDoneness(0);
    setSaltLevel(0);
    setSpiceLevel(0);
    setHerbLevel(0);
    setPlatingResult(null);
    setDishResult(null);
    setStepIndex(0);
    setCurrentStation(recipe.steps[0].station);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-6xl mx-auto pb-12">
      {/* Recipe Header & Step Indicator */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {recipe.image && (
            <img
              src={recipe.image}
              alt={recipe.koreanName}
              className="w-16 h-16 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
          )}
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <span>{recipe.category}</span>
              <span className="text-slate-600">·</span>
              <span>난이도 {recipe.difficulty}</span>
              <span className="text-slate-600">·</span>
              <span>기본 단가 {recipe.price.toLocaleString()}원</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-white mt-0.5">
              {recipe.koreanName}
            </h1>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-xl">
              {recipe.description}
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenRecipeBook}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-xl transition-colors"
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>레시피 가이드</span>
          </button>
          <button
            onClick={handleResetCooking}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors"
            title="처음부터 다시하기"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recipe Step Flow Banner */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
            {stepIndex + 1}
          </div>
          <div>
            <div className="text-xs font-semibold text-amber-300">
              현재 단계: {currentStep.title}
            </div>
            <div className="text-xs text-slate-300 mt-0.5">
              {currentStep.instruction}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
          <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>셰프 팁: {currentStep.tip}</span>
        </div>
      </div>

      {/* Station Navigation Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
        {stations.map((st) => (
          <button
            key={st.type}
            onClick={() => setCurrentStation(st.type)}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
              currentStation === st.type
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {st.icon}
            <span>{st.label}</span>
          </button>
        ))}
      </div>

      {/* Active Physics Station Canvas Container */}
      <div className="w-full">
        {currentStation === 'CHOPPING' && (
          <CuttingStationCanvas
            targetIngredients={recipeIngredients}
            knifeLevel={restaurant.upgrades.knifeLevel}
            onSliceProgress={(pieces, count) => setTotalCuts(count)}
            onStepComplete={handleStepComplete}
          />
        )}

        {currentStation === 'SEASONING' && (
          <SeasoningStationCanvas
            targetIngredients={recipeIngredients}
            targetSalt={recipe.flavorProfile.saltiness}
            targetSpice={recipe.flavorProfile.spiciness}
            targetHerb={recipe.flavorProfile.freshness}
            onSeasoningProgress={(salt, spice, herb) => {
              setSaltLevel(salt);
              setSpiceLevel(spice);
              setHerbLevel(herb);
            }}
            onStepComplete={handleStepComplete}
          />
        )}

        {currentStation === 'FRYING' && (
          <PanFryingStationCanvas
            initialIngredients={recipeIngredients}
            panLevel={restaurant.upgrades.panLevel}
            stoveLevel={restaurant.upgrades.stoveLevel}
            targetDoneness={currentStep.targetDoneness || 85}
            onCookProgress={(avg) => setCookDoneness(avg)}
            onStepComplete={handleStepComplete}
          />
        )}

        {currentStation === 'BOILING' && (
          <BoilingStationCanvas
            initialIngredients={recipeIngredients}
            targetDoneness={currentStep.targetDoneness || 80}
            onCookProgress={(avg) => setCookDoneness(avg)}
            onStepComplete={handleStepComplete}
          />
        )}

        {currentStation === 'PLATING' && (
          <PlatingStationCanvas
            recipe={recipe}
            ingredients={recipeIngredients}
            onFinishDish={handleFinishPlating}
          />
        )}
      </div>

      {/* Dish Result Modal */}
      {dishResult && (
        <DishResultModal
          result={dishResult}
          onClose={() => setDishResult(null)}
          onRetry={handleResetCooking}
        />
      )}
    </div>
  );
};
