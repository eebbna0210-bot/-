import React, { useState, useEffect } from 'react';
import { Recipe, RestaurantState, CookingDishResult, OrderTicket } from './types/cooking';
import { INITIAL_RECIPES } from './data/recipes';
import { TopNavigation, MainNavTab } from './components/TopNavigation';
import { KitchenSimulator } from './components/KitchenSimulator';
import { RestaurantManager } from './components/RestaurantManager';
import { RecipeBook } from './components/RecipeBook';
import { MultiplayerCoop } from './components/MultiplayerCoop';
import { CulinaryBattle } from './components/CulinaryBattle';
import { CustomMenuCreator } from './components/CustomMenuCreator';
import { sound } from './utils/soundEngine';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainNavTab>('simulator');
  const [activeRecipe, setActiveRecipe] = useState<Recipe>(INITIAL_RECIPES[0]);
  const [allRecipes, setAllRecipes] = useState<Recipe[]>(INITIAL_RECIPES);

  // Restaurant persistent state
  const [restaurant, setRestaurant] = useState<RestaurantState>(() => {
    const saved = localStorage.getItem('master_chef_restaurant');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return {
      name: '르 마스터 비스트로 (Le Master Bistro)',
      money: 150000,
      reputation: 420,
      level: 1,
      day: 3,
      unlockedRecipeIds: INITIAL_RECIPES.map((r) => r.id),
      upgrades: {
        knifeLevel: 1,
        panLevel: 1,
        stoveLevel: 1,
        diningLevel: 1,
      },
      totalDishesServed: 14,
      reviews: [
        {
          id: 'rev-1',
          author: '박준우 미식가',
          avatar: '👨‍💼',
          dishName: '정통 허브 버터 립아이 스테이크',
          stars: 5,
          comment: '고기 표면의 마이야르 크러스트와 버터 아로제가 예술의 경지였습니다.',
          date: '어제',
          tipAmount: 6000,
        },
        {
          id: 'rev-2',
          author: '최서연 인플루언서',
          avatar: '👩‍💼',
          dishName: '이탈리안 정통 까르보나라',
          stars: 5,
          comment: '크림 없이 판체타와 치즈 에멀전만으로 완성한 정통 로마의 깊은 맛!',
          date: '2일 전',
          tipAmount: 4500,
        },
      ],
    };
  });

  // Save restaurant changes
  useEffect(() => {
    localStorage.setItem('master_chef_restaurant', JSON.stringify(restaurant));
  }, [restaurant]);

  // Handle dish completion from simulator
  const handleDishCompleted = (result: CookingDishResult) => {
    setRestaurant((prev) => {
      const newReview = {
        id: `rev-${Date.now()}`,
        author: '방문 미식 손님',
        avatar: '🧑‍🍳',
        dishName: result.recipe.koreanName,
        stars: result.stars,
        comment: result.customerFeedback,
        date: '방금 전',
        tipAmount: Math.round(result.earnings * 0.15),
      };

      return {
        ...prev,
        money: prev.money + result.earnings + newReview.tipAmount,
        reputation: Math.min(1000, prev.reputation + result.stars * 8),
        totalDishesServed: prev.totalDishesServed + 1,
        reviews: [newReview, ...prev.reviews.slice(0, 9)],
      };
    });
  };

  // Upgrade equipment
  const handleUpgradeEquipment = (
    type: 'knifeLevel' | 'panLevel' | 'stoveLevel' | 'diningLevel',
    cost: number
  ) => {
    if (restaurant.money >= cost) {
      sound.playSuccessFanfare();
      setRestaurant((prev) => ({
        ...prev,
        money: prev.money - cost,
        upgrades: {
          ...prev.upgrades,
          [type]: prev.upgrades[type] + 1,
        },
      }));
    }
  };

  // Quick serve order from restaurant manager
  const handleServeQuickOrder = (ticket: OrderTicket) => {
    setRestaurant((prev) => ({
      ...prev,
      money: prev.money + ticket.rewardCoins,
      reputation: Math.min(1000, prev.reputation + ticket.reputationPoints),
      totalDishesServed: prev.totalDishesServed + 1,
    }));
  };

  // Register custom recipe
  const handleRegisterCustomRecipe = (newRecipe: Recipe) => {
    setAllRecipes((prev) => [newRecipe, ...prev]);
    setActiveRecipe(newRecipe);
    setRestaurant((prev) => ({
      ...prev,
      unlockedRecipeIds: [...prev.unlockedRecipeIds, newRecipe.id],
    }));
  };

  // Switch to simulator with chosen recipe
  const handleStartCookingRecipe = (recipe: Recipe) => {
    setActiveRecipe(recipe);
    setActiveTab('simulator');
    sound.playDing();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top 3-Zone Navigation */}
      <TopNavigation
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          sound.playChop();
        }}
        money={restaurant.money}
        reputation={restaurant.reputation}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 px-4 md:px-8 py-6 w-full">
        {activeTab === 'simulator' && (
          <KitchenSimulator
            recipe={activeRecipe}
            restaurant={restaurant}
            onDishCompleted={handleDishCompleted}
            onOpenRecipeBook={() => setActiveTab('recipes')}
          />
        )}

        {activeTab === 'restaurant' && (
          <RestaurantManager
            restaurant={restaurant}
            onCookOrder={handleStartCookingRecipe}
            onUpgradeEquipment={handleUpgradeEquipment}
            onServeQuickOrder={handleServeQuickOrder}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeBook
            onSelectRecipe={handleStartCookingRecipe}
            selectedRecipeId={activeRecipe.id}
          />
        )}

        {activeTab === 'coop' && <MultiplayerCoop />}

        {activeTab === 'battle' && <CulinaryBattle />}

        {activeTab === 'custom' && (
          <CustomMenuCreator
            onRegisterCustomRecipe={handleRegisterCustomRecipe}
            onCookRecipeNow={handleStartCookingRecipe}
          />
        )}
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span>마스터 셰프 시뮬레이터</span>
          <span aria-hidden="true">·</span>
          <span>물리 기반 조리 &amp; 식당 경영</span>
        </div>
        <div className="text-[11px] text-slate-500">
          재료 손질 · 시즈닝 · 팬 덤블링 · 냄비 부력 · 플레이팅 스태킹
        </div>
      </footer>
    </div>
  );
}
