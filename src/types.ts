export interface PlaceItem {
  id: string | number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  description?: string;
  address?: string;
  estFee?: number;
  source?: string;
  placeId?: string | number;
  googleMapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  city?: string;
  state?: string;
}

export interface GuestReviewItem {
  author?: string;
  rating?: number;
  ratingScale?: string;
  date?: string;
  text: string;
  source: string;
  verifiedGuest?: boolean;
}

export interface CategoryScores {
  cleanliness?: number;
  comfort?: number;
  location?: number;
  staff?: number;
  valueForMoney?: number;
  scale?: number;
}

export interface AccommodationReviewInsights {
  hotelId: string | number;
  hotelName: string;
  overallSentiment: 'exceptional' | 'very_good' | 'average' | 'mixed';
  recurringPros: string[];
  recurringCons: string[];
  cleanlinessSummary: string;
  locationConvenience: string;
  staffAssessment: string;
  valueForMoneyAssessment: string;
  checkBeforeBooking: string[];
  isAIGenerated?: boolean;
  analyzedAt?: number;
}

export interface AccommodationItem {
  id: string | number;
  name: string;
  category: string;
  rawCategory?: string;
  lat: number;
  lon: number;
  distanceKm?: number;
  address?: string;
  phone?: string | null;
  website?: string | null;
  priceDisclaimer?: string;
  source?: string;
  placeId?: string | number;
  googleMapsUrl?: string;
  rating?: number;
  ratingScale?: string; // e.g. "5.0" or "10.0"
  reviewCount?: number;
  photoUrl?: string;
  city?: string;
  state?: string;
  categoryScores?: CategoryScores;
  guestReviews?: GuestReviewItem[];
  amenities?: string[];
  safetyFeatures?: string[];
  nightlyRate?: number;
  totalStayRate?: number;
  currency?: string;
  nearestHospitalKm?: number;
  neighborhoodSafetyNote?: string;
  aiRecommendationBadge?: 'best_overall' | 'best_budget' | 'best_reviewed';
  aiRecommendationReason?: string;
  reviewInsights?: AccommodationReviewInsights;
}

export interface BudgetBreakdownItem {
  amount: number;
  label: string;
  [key: string]: any;
}

export interface BudgetPlan {
  planTier: 'lowest' | 'balanced' | 'comfort';
  title: string;
  isWithinBudget: boolean;
  totalBudget: number;
  totalEstimatedCost: number;
  remainingBudget: number;
  costPerPerson: number;
  breakdown: {
    intercityTransport: BudgetBreakdownItem;
    localTransport: BudgetBreakdownItem;
    accommodation: BudgetBreakdownItem;
    foodAndBeverages: BudgetBreakdownItem;
    activitiesAndFees: BudgetBreakdownItem;
    miscellaneous: BudgetBreakdownItem;
    emergencyContingency: BudgetBreakdownItem;
  };
  tradeOffSummary: string;
}

export interface ActivityDetail {
  name: string;
  description: string;
  duration: string;
  matchReason: string;
  estFee: number;
  lat?: number;
  lon?: number;
  address?: string;
  googleMapsUrl?: string;
  placeId?: string | number;
}

export interface DayItinerary {
  dayNumber: number;
  title: string;
  dateString?: string;
  morningActivity: ActivityDetail;
  afternoonActivity: ActivityDetail;
  eveningActivity: ActivityDetail;
  suggestedArea: string;
  dailyTips: string;
  estimatedDayCosts?: {
    activitiesEntryFees: number;
    estLocalTransit: number;
    estFood: number;
  };
}

export interface TripItinerary {
  destination: string;
  origin: string;
  totalBudget: number;
  travelers: number;
  durationDays: number;
  departureDate?: string | null;
  returnDate?: string | null;
  days: DayItinerary[];
  aiExplanation: string;
  costSavingTips: string[];
  potentialRisks?: string[];
  usedAIFallback?: boolean;
  aiError?: string;
  country?: string;
  isInternational?: boolean;
  aiAnalysis?: AIAnalysisResult;
}

export interface ExpenseCategoryAnalysis {
  category: string;
  amount: number;
  percentage: number;
  assessment: string;
}

export interface AIAnalysisResult {
  summary: string;
  budget_status: 'within_budget' | 'exceeds_budget' | 'tight_margin';
  feasibility_score: number;
  estimated_total: number;
  estimated_per_person: number;
  expense_analysis: ExpenseCategoryAnalysis[];
  saving_suggestions: string[];
  itinerary_improvements: string[];
  accommodation_transport_notes: string;
  assumptions: string[];
  missing_information: string[];
  isAIAnalysis: boolean;
  modelUsed?: string;
  timestamp?: number;
  notice?: string;
}

export interface FlightSearchOptions {
  originAirportOrCity?: string;
  destinationAirportOrCity?: string;
  departureDate?: string;
  returnDate?: string;
  tripType: 'round_trip' | 'one_way';
  adults: number;
  children: number;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  preferredTime?: 'any' | 'morning' | 'afternoon' | 'evening';
  stops?: 'any' | 'direct' | 'one_stop';
}

export interface TripFormData {
  origin: string;
  destination: string;
  country?: string;
  currency?: string;
  totalBudget: number;
  travelers: number;
  durationDays: number;
  departureDate: string;
  returnDate?: string;
  preferredTransport: 'public' | 'bus' | 'train' | 'car' | 'flight' | 'rental' | 'ferry' | 'metro' | 'flexible';
  accommodationPref: 'budget hotel' | 'hostel' | 'homestay' | 'mid-range hotel' | 'resort' | 'no preference';
  interests: string[];
  travelStyle: 'budget' | 'balanced' | 'comfort';
  specialPreferences?: string;
  isInternational?: boolean;
  destinationCoords?: { lat: number; lon: number };
  originCoords?: { lat: number; lon: number };
  flightOptions?: FlightSearchOptions;
}

export interface TripPlanResult {
  id?: string;
  timestamp?: number;
  formData: TripFormData;
  itinerary: TripItinerary;
  budgetPlans: {
    lowest: BudgetPlan;
    balanced: BudgetPlan;
    comfort: BudgetPlan;
  };
  activeTier: 'lowest' | 'balanced' | 'comfort';
  activePlan: BudgetPlan;
  destinationCoords: { lat: number; lon: number };
  originCoords?: { lat: number; lon: number };
  places: PlaceItem[];
  accommodations: AccommodationItem[];
  aiAnalysis?: AIAnalysisResult;
  routeInfo?: {
    distanceKm: number;
    durationMin: number;
    geometry?: any;
    disclaimer: string;
  };
  flightData?: any;
}

export interface SavedTrip {
  id: string;
  savedAt: string;
  name: string;
  planResult: TripPlanResult;
}

export interface EmergencyServiceDetail {
  number: string;
  verified: boolean;
  notes?: string;
  source: string;
  officialUrl?: string;
  isNationwide?: boolean;
}

export interface EmbassyDetail {
  country: string;
  name: string;
  address?: string;
  phone?: string;
  emergencyPhone?: string;
  email?: string;
  officialUrl?: string;
  source: string;
}

export interface EmergencyContactRecord {
  country: string;
  jurisdiction: string;
  police: EmergencyServiceDetail;
  ambulance: EmergencyServiceDetail;
  fire: EmergencyServiceDetail;
  generalEmergency: EmergencyServiceDetail;
  touristHelpline?: EmergencyServiceDetail;
  womenHelpline?: EmergencyServiceDetail;
  embassies: EmbassyDetail[];
  officialEmergencyUrl: string;
  lastVerified: string;
  disclaimer: string;
}

export interface TravelAdvisory {
  country: string;
  destination?: string;
  advisoryLevel: 'normal' | 'exercise_caution' | 'reconsider_travel' | 'do_not_travel';
  advisoryLevelLabel: string;
  advisorySummary: string;
  regionalWarnings: string[];
  weatherAlerts: string[];
  localLawsAndCulture: string[];
  commonScams: string[];
  healthAndEntry: string[];
  source: string;
  publishedDate?: string;
  lastCheckedDate: string;
  officialSourceUrl: string;
}

export interface SafetyChecklistItem {
  id: string;
  text: string;
  category: 'documents' | 'health_safety' | 'transit' | 'local_prep';
  isEssential: boolean;
  completed: boolean;
  description?: string;
}

export interface ItinerarySafetyConcern {
  id: string;
  dayNumber?: number;
  severity: 'info' | 'warning' | 'caution';
  title: string;
  issue: string;
  suggestedAlternative: string;
}

