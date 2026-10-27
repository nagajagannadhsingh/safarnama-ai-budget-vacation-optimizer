import React, { useState } from 'react';
import {
  TripPlanResult,
  PlaceItem,
  AccommodationItem,
  DayItinerary,
} from '../types';

import { InteractiveMap } from './InteractiveMap';
import { DailyItineraryView } from './DailyItineraryView';

// FIX: AccommodationFinder uses a default export
import AccommodationFinder from './AccommodationFinder';

import { BudgetDashboard } from './BudgetDashboard';
import { AIExplanationPanel } from './AIExplanationPanel';
import { FlightsSection } from './FlightsSection';
import { DestinationComparisonTool } from './DestinationComparisonTool';
import { TravelSafetyAssistant } from './TravelSafetyAssistant';

import {
  Bookmark,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  IndianRupee,
  MapPin,
  Calendar,
  Users,
  ExternalLink,
  Download,
  Loader2,
  Globe,
  Plane,
  Scale,
  ShieldAlert,
} from 'lucide-react';

import { getGoogleMapsSearchUrl } from '../utils/googleMaps';
import { exportTripPlanToPDF } from '../services/pdfExport';
export default TripResults;
