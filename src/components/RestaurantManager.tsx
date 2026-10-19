import React, { useState, useEffect } from 'react';
import { RestaurantState, OrderTicket, Recipe } from '../types/cooking';
import { INITIAL_RECIPES } from '../data/recipes';
import { sound } from '../utils/soundEngine';
import {
  Store,
  DollarSign,
  TrendingUp,
  Star,
  Clock,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  Flame,
  Scissors
} from 'lucide-react';

interface Props {
  restaurant: RestaurantState;
  onCookOrder: (recipe: Recipe) => void;
  onUpgradeEquipment: (type: 'knifeLevel' | 'panLevel' | 'stoveLevel' | 'diningLevel', cost: number) => void;
  onServeQuickOrder: (ticket: OrderTicket) => void;
}

export const RestaurantManager: React.FC<Props> = ({
  restaurant,
  onCookOrder,
  onUpgradeEquipment,
  onServeQuickOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'upgrades' | 'reviews'>('orders');

  // Simulated live customer orders
  const [orders, setOrders] = useState<OrderTicket[]>([
    {
      id: 'ord-1',
      customerName: '김태호 미식가',
      customerAvatar: '👨‍💼',
      recipeId: 'steak_gourmet',
      specialRequest: '미디엄 레어로 촉촉하게 구워주세요!',
      remainingTime: 75,
      totalTime: 90,
      rewardCoins: 42000,
      reputationPoints: 25,
      status: 'pending',
    },
    {
      id: 'ord-2',
      customerName: '이지은 디자이너',
      customerAvatar: '👩‍🎨',
      recipeId: 'carbonara_artisan',
      specialRequest: '통후추 넉넉히 뿌려주시면 감사하겠습니다.',
      remainingTime: 50,
      totalTime: 80,
      rewardCoins: 28000,
      reputationPoints: 18,
      status: 'pending',
    },
    {
      id: 'ord-3',
      customerName: '마이클 여행자',
      customerAvatar: '👱‍♂️',
      recipeId: 'smash_cheeseburger',
      specialRequest: '치즈 듬뿍 녹여주세요!',
      remainingTime: 35,
      totalTime: 60,
      rewardCoins: 22000,
      reputationPoints: 15,
      status: 'pending',
    },
  ]);

  // Orders timer
  useEffect(() => {
    const timer = setInterval(() => {
      setOrders((prev) =>
        prev
          .map((ord) => {
            if (ord.status === 'pending') {
              const remaining = ord.remainingTime - 1;
              if (remaining <= 0) {
                return { ...ord, remainingTime: 0, status: 'expired' as const };
              }
              return { ...ord, remainingTime: remaining };
            }
            return ord;
          })
          .filter((ord) => ord.status !== 'expired')
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Periodic new customer arrival
  useEffect(() => {
    const arrivalInterval = setInterval(() => {
      setOrders((prev) => {
        if (prev.length >= 5) return prev;
        const randomRecipe = INITIAL_RECIPES[Math.floor(Math.random() * INITIAL_RECIPES.length)];
        const names = ['한수민 푸드 칼럼니스트', '최준석 셰프', '강예린 대학생', '박건우 직장인', '올리비아 관광객'];
        const avatars = ['👩‍🍳', '👨‍💻', '👩‍🦰', '🧑‍🎓', '👩‍💼'];
        const idx = Math.floor(Math.random() * names.length);

        const newOrder: OrderTicket = {
          id: `ord-${Date.now()}`,
          customerName: names[idx],
          customerAvatar: avatars[idx],
          recipeId: randomRecipe.id,
          specialRequest: '최고의 솜씨를 기대합니다!',
          remainingTime: 80 + restaurant.upgrades.diningLevel * 15,
          totalTime: 80 + restaurant.upgrades.diningLevel * 15,
          rewardCoins: Math.round(randomRecipe.price * (1 + restaurant.upgrades.diningLevel * 0.1)),
          reputationPoints: 20,
          status: 'pending',
        };
        sound.playDing();
        return [...prev, newOrder];
      });
    }, 12000);

    return () => clearInterval(arrivalInterval);
  }, [restaurant.upgrades.diningLevel]);

  const handleStartCooking = (ord: OrderTicket) => {
    const rec = INITIAL_RECIPES.find((r) => r.id === ord.recipeId) || INITIAL_RECIPES[0];
    onCookOrder(rec);
  };

  const getRecipeInfo = (id: string) => {
    return INITIAL_RECIPES.find((r) => r.id === id) || INITIAL_RECIPES[0];
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto pb-12">
      {/* Restaurant Overview Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <img
          src="/src/assets/images/restaurant_dining_room_1792372717762.jpg"
          alt="레스토랑 다이닝 룸"
          className="w-full h-48 md:h-60 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent flex flex-col justify-end p-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Store className="w-4 h-4" />
                <span>영업 {restaurant.day}일차 비스트로</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400">정상 영업 중 (Rush Hour)</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold font-display text-white mt-1">
                {restaurant.name}
              </h1>
              <p className="text-xs text-slate-300 mt-1">
                직접 손질하고 불 조절한 요리로 고객 만족도 5스타 미슐랭 레스토랑을 목표로 하세요.
              </p>
            </div>

            {/* Financial & Rep Cards */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 shadow">
                <div className="text-[10px] text-slate-400">보유 자금</div>
                <div className="text-lg font-bold text-amber-400 tabular-nums">
                  {restaurant.money.toLocaleString()}원
                </div>
              </div>

              <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/60 shadow">
                <div className="text-[10px] text-slate-400">명성 평점</div>
                <div className="text-lg font-bold text-emerald-400 tabular-nums flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{Math.min(5.0, restaurant.reputation / 180 + 3.2).toFixed(1)} / 5.0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>실시간 홀 주문 대기열 ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upgrades')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'upgrades'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>주방 설비 &amp; 인테리어 업그레이드</span>
        </button>

        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'reviews'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>방문 고객 리뷰 ({restaurant.reviews.length})</span>
        </button>
      </div>

      {/* Tab 1: Orders Queue */}
      {activeTab === 'orders' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>손님의 인내심 타이머가 끝나기 전에 주방에서 조리하여 서빙하세요!</span>
            <span className="text-slate-400">대기 중인 테이블 {orders.length}팀</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((ord) => {
              const rec = getRecipeInfo(ord.recipeId);
              const progressPct = (ord.remainingTime / ord.totalTime) * 100;
              const isUrgent = ord.remainingTime < 25;

              return (
                <div
                  key={ord.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-lg hover:border-slate-700 transition-all"
                >
                  <div>
                    {/* Customer header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{ord.customerAvatar}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-200">{ord.customerName}</div>
                          <div className="text-[10px] text-slate-400">{rec.category}</div>
                        </div>
                      </div>
                      <div className="text-xs font-bold text-amber-400 tabular-nums">
                        +{ord.rewardCoins.toLocaleString()}원
                      </div>
                    </div>

                    {/* Dish target */}
                    <div className="mt-3 p-2.5 bg-slate-950/70 rounded-lg border border-slate-800/80">
                      <div className="text-xs font-semibold text-white">{rec.koreanName}</div>
                      {ord.specialRequest && (
                        <div className="text-[11px] text-amber-300/80 mt-1 italic">
                          &ldquo;{ord.specialRequest}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Patience timer bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">손님 대기 시간</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            isUrgent ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                          }`}
                        >
                          {ord.remainingTime}초 남음
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isUrgent ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => handleStartCooking(ord)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow transition-colors"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>주방에서 직접 조리하기</span>
                    </button>
                    <button
                      onClick={() => {
                        sound.playDing();
                        onServeQuickOrder(ord);
                        setOrders((prev) => prev.filter((o) => o.id !== ord.id));
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                      title="즉시 서빙"
                    >
                      서빙
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Upgrades */}
      {activeTab === 'upgrades' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Knife */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">명품 일본식 다마스커스 나이프</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    현재 Lv.{restaurant.upgrades.knifeLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  면도날 같은 정밀도로 재료를 스와이프할 때 손질 절삭력이 대폭 향상되고 균일도 보너스를 획득합니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">업그레이드 비용: 45,000원</span>
              <button
                onClick={() => onUpgradeEquipment('knifeLevel', 45000)}
                disabled={restaurant.money < 45000 || restaurant.upgrades.knifeLevel >= 5}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  restaurant.money >= 45000 && restaurant.upgrades.knifeLevel < 5
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {restaurant.upgrades.knifeLevel >= 5 ? '최고 레벨 달성' : '나이프 연마 강화'}
              </button>
            </div>
          </div>

          {/* Pan */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">프리미엄 무쇠 주철 스킬렛</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    현재 Lv.{restaurant.upgrades.panLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  열 보존력과 열전도율이 우수하여 고온 시어링 시 재료가 타지 않고 고르게 골든 크러스트를 만듭니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">업그레이드 비용: 60,000원</span>
              <button
                onClick={() => onUpgradeEquipment('panLevel', 60000)}
                disabled={restaurant.money < 60000 || restaurant.upgrades.panLevel >= 5}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  restaurant.money >= 60000 && restaurant.upgrades.panLevel < 5
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {restaurant.upgrades.panLevel >= 5 ? '최고 레벨 달성' : '주철 팬 업그레이드'}
              </button>
            </div>
          </div>

          {/* Stove */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">고화력 터보 가스 버너</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    현재 Lv.{restaurant.upgrades.stoveLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  불맛을 끌어올리는 강력한 화력과 미세 불 조절 기능으로 조리 시간을 단축시킵니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">업그레이드 비용: 75,000원</span>
              <button
                onClick={() => onUpgradeEquipment('stoveLevel', 75000)}
                disabled={restaurant.money < 75000 || restaurant.upgrades.stoveLevel >= 5}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  restaurant.money >= 75000 && restaurant.upgrades.stoveLevel < 5
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {restaurant.upgrades.stoveLevel >= 5 ? '최고 레벨 달성' : '터보 버너 시공'}
              </button>
            </div>
          </div>

          {/* Dining Room */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white">럭셔리 다이닝 홀 &amp; 조명</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">
                    현재 Lv.{restaurant.upgrades.diningLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  아늑한 분위기로 손님의 대기 인내심이 +15초 증가하고 요리 가격의 10% 추가 팁을 남깁니다.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400">업그레이드 비용: 90,000원</span>
              <button
                onClick={() => onUpgradeEquipment('diningLevel', 90000)}
                disabled={restaurant.money < 90000 || restaurant.upgrades.diningLevel >= 5}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  restaurant.money >= 90000 && restaurant.upgrades.diningLevel < 5
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {restaurant.upgrades.diningLevel >= 5 ? '최고 레벨 달성' : '홀 인테리어 리모델링'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Reviews */}
      {activeTab === 'reviews' && (
        <div className="flex flex-col gap-3">
          {restaurant.reviews.length === 0 ? (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 text-xs">
              아직 고객 리뷰가 없습니다. 요리를 서빙하여 첫 미식 리뷰를 받아보세요!
            </div>
          ) : (
            restaurant.reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rev.avatar}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{rev.author}</span>
                      <span className="text-[10px] text-slate-400">주문: {rev.dishName}</span>
                      <span className="text-[10px] text-slate-500">· {rev.date}</span>
                    </div>
                    <div className="flex items-center gap-1 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            s <= rev.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-300 mt-1">&ldquo;{rev.comment}&rdquo;</p>
                  </div>
                </div>

                {rev.tipAmount > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400">보너스 팁</span>
                    <div className="text-xs font-bold text-emerald-400 tabular-nums">
                      +{rev.tipAmount.toLocaleString()}원
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
