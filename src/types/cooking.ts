export type CookingStationType = 'CHOPPING' | 'FRYING' | 'BOILING' | 'SEASONING' | 'PLATING';

export type CookingActionType = 'CHOP' | 'FRY' | 'BOIL' | 'SEASON' | 'PLATE';

export interface IngredientMeta {
  id: string;
  name: string;
  koreanName: string;
  category: 'meat' | 'vegetable' | 'seafood' | 'dairy' | 'noodle_grain' | 'seasoning' | 'garnish';
  color: string;
  shape: 'round' | 'oblong' | 'slab' | 'cluster' | 'grain' | 'liquid';
  defaultWidth: number;
  defaultHeight: number;
  idealPieces: number; // For chopping target
  idealFryTime: number; // in seconds
  idealBoilTime: number; // in seconds
  icon: string;
}

export interface CutPiece {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  color: string;
  name: string;
  isCooked: boolean;
  searLevel: number; // 0 (raw) to 1 (perfect) to 2 (burnt)
  boilLevel: number;
  saltiness: number;
  spiciness: number;
  herbLevel: number;
}

export interface RecipeStep {
  station: CookingStationType;
  title: string;
  instruction: string;
  targetIngredientIds: string[];
  requiredCount?: number;
  targetDoneness?: number; // 0 to 100%
  tip: string;
}

export interface Recipe {
  id: string;
  name: string;
  koreanName: string;
  difficulty: '초급' | '중급' | '고급' | '마스터';
  prepTimeMinutes: number;
  category: '양식' | '한식' | '일식/중식' | '스트리트 푸드';
  description: string;
  price: number;
  image?: string;
  ingredients: {
    metaId: string;
    amount: string;
    role: 'main' | 'sub' | 'seasoning' | 'garnish';
  }[];
  steps: RecipeStep[];
  flavorProfile: {
    savory: number; // 감칠맛
    saltiness: number;
    sweetness: number;
    spiciness: number;
    freshness: number;
  };
}

export interface OrderTicket {
  id: string;
  customerName: string;
  customerAvatar: string;
  recipeId: string;
  specialRequest?: string;
  remainingTime: number; // seconds
  totalTime: number;
  rewardCoins: number;
  reputationPoints: number;
  status: 'pending' | 'cooking' | 'served' | 'expired';
}

export interface CookingDishResult {
  recipe: Recipe;
  cutAccuracy: number; // 0 - 100%
  donenessScore: number; // 0 - 100%
  seasoningScore: number; // 0 - 100%
  platingScore: number; // 0 - 100%
  totalScore: number; // 0 - 100%
  stars: number; // 1 to 5
  timeSpentSeconds: number;
  customerFeedback: string;
  earnings: number;
}

export interface CustomerReview {
  id: string;
  author: string;
  avatar: string;
  dishName: string;
  stars: number;
  comment: string;
  date: string;
  tipAmount: number;
}

export interface RestaurantState {
  name: string;
  money: number;
  reputation: number; // 0 - 1000
  level: number;
  day: number;
  unlockedRecipeIds: string[];
  upgrades: {
    knifeLevel: number; // sharp knives = easier clean cuts
    panLevel: number; // non-stick cast iron = better heat distribution
    stoveLevel: number; // burner heat control
    diningLevel: number; // more customer patience & tips
  };
  totalDishesServed: number;
  reviews: CustomerReview[];
}

export interface CustomDishRecipe {
  id: string;
  name: string;
  creatorName: string;
  baseCategory: string;
  ingredients: string[];
  cookingMethod: string;
  price: number;
  calories: number;
  flavorDesc: string;
  umamiRating: number;
  createdDate: string;
}

export interface MultiplayerPlayer {
  id: string;
  name: string;
  role: '재료 손질사 (Prepper)' | '화력 조리사 (Cooker)' | '플레이팅 & 총괄 (Plater)';
  isReady: boolean;
  score: number;
  currentStation: CookingStationType;
  avatar: string;
}
