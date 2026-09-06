export interface DishStat {
  dish: string;
  prepared: number;
  consumed: number;
  surplus: number;
  surplusPct: number;
}

export interface DishItem {
  name: string;
  prepared: number;
  consumed: number;
  surplus: number;
}

export interface MealLog {
  id?: string;
  date: string;
  dayOfWeek?: string;
  mealType?: 'Breakfast' | 'Lunch' | 'Dinner';
  expectedAttendance: number;
  actualAttendance?: number;
  predictedDemand?: number;
  predicted?: number;
  prepared: number;
  consumed: number;
  surplus: number;
  predictionErrorPct: number;
  costPerMeal?: number;
  weather?: string;
  isHoliday?: boolean;
  isCollegeEvent?: boolean;
  dishes: DishItem[];
  actualEntered: boolean;
  notes?: string;
}

export interface RecipientOrg {
  id: string;
  name: string;
  category: string;
  address?: string;
  lat?: number;
  lng?: number;
  lon?: number;
  distanceKm: number;
  foodTypesAccepted: string[];
  typicalCapacityMeals: number;
  contactPerson?: string;
  phone: string;
  activeHours?: string;
}

export interface SurplusEntry {
  id: string;
  foodType: string;
  quantityMeals: number;
  location?: string;
  reportedAt: string; // ISO string
  status: 'available' | 'claimed';
  claimedByOrg?: string;
  claimedAt?: string;
  photoUrl?: string;
  verifiedSafeByStaff?: boolean;
  notes?: string;
}

export interface MatchScoreBreakdown {
  orgId: string;
  orgName: string;
  category: string;
  distanceKm: number;
  distanceScore: number; // 0-40
  capacityFitScore: number; // 0-30
  foodTypeScore: number; // 0-30
  totalScore: number; // 0-100
  typicalCapacityMeals: number;
  phone: string;
  address?: string;
  foodTypesAccepted?: string[];
}

export interface CampusEvent {
  id: string;
  name: string;
  date: string;
  expectedAttendance: number;
  description: string;
}

export type UpcomingEvent = CampusEvent;

export interface EventAdjustmentResponse {
  recommendedAdjustmentMeals: number;
  adjustmentType: 'increase' | 'decrease' | 'neutral';
  rationale: string;
  recommendedDishes: string[];
}

export interface DepartmentStanding {
  id: string;
  name: string;
  baselineWasteMeals: number;
  recentWasteMeals: number;
  predictionAccuracy: number; // e.g. 92.4%
  surplusRescuedMeals: number;
  // Locally calculated transparent sub-scores
  wasteReductionScore: number; // 0-35
  wasteReductionStars: number; // 1-5
  predictionAccuracyScore: number; // 0-35
  predictionAccuracyStars: number; // 1-5
  surplusRescuedScore: number; // 0-30
  surplusRescuedStars: number; // 1-5
  totalScore: number; // 0-100
}

export interface DemandPredictionResult {
  expectedDemand: number;
  recommendedPreparation: number;
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export type DemandPredictionResponse = DemandPredictionResult;

export interface WhatIfResponse {
  newPreparationLow: number;
  newPreparationHigh: number;
  estimatedWasteReduction: number;
  explanation: string;
}

export type WhatIfResult = WhatIfResponse;

export interface WasteScanResponse {
  foodType: string;
  estimatedQuantity: string;
  looksLikeSurplus: boolean;
  needsHumanReview: boolean;
  notes: string;
}

export type WasteScanResult = WasteScanResponse;

export interface DishWasteSummary {
  name: string;
  prepared: number;
  consumed: number;
  surplus: number;
  surplusPct: number;
}

export interface DishAIRecommendationsResult {
  recommendations: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ImpactAssumptions {
  perMealCostRupees: number;
  perMealCo2Kg: number;
  perMealWaterLiters: number;
}

export interface AppStore {
  mealLogs: MealLog[];
  recipientOrgs: RecipientOrg[];
  surplusEntries: SurplusEntry[];
  events: CampusEvent[];
  departments: {
    id: string;
    name: string;
    baselineWasteMeals: number;
    recentWasteMeals: number;
    predictionAccuracy: number;
    surplusRescuedMeals: number;
  }[];
}
