import { SavedTrip, TripPlanResult } from '../types';

const STORAGE_KEY = 'ai_budget_vacation_optimizer_saved_trips_v1';

export function getSavedTrips(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read saved trips from localStorage:', err);
    return [];
  }
}

export function getTripById(id: string): SavedTrip | null {
  const trips = getSavedTrips();
  return trips.find(t => t.id === id) || null;
}

export function saveTrip(planResult: TripPlanResult, customName?: string): SavedTrip {
  const existing = getSavedTrips();
  const id = planResult.id || 'trip_' + Date.now();
  const defaultName = `${planResult.formData.origin} to ${planResult.formData.destination} (${planResult.formData.durationDays} Days, ₹${planResult.formData.totalBudget.toLocaleString('en-IN')})`;

  const newSavedTrip: SavedTrip = {
    id,
    savedAt: new Date().toISOString(),
    name: customName || defaultName,
    planResult
  };

  const filtered = existing.filter(t => t.id !== id);
  const updated = [newSavedTrip, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to write trip to localStorage:', err);
  }

  return newSavedTrip;
}

export function updateTrip(id: string, updatedPlanResult: TripPlanResult, customName?: string): boolean {
  const existing = getSavedTrips();
  const index = existing.findIndex(t => t.id === id);
  if (index === -1) return false;

  existing[index] = {
    ...existing[index],
    name: customName || existing[index].name,
    savedAt: new Date().toISOString(),
    planResult: updatedPlanResult
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (err) {
    console.error('Failed to update trip in localStorage:', err);
    return false;
  }
}

export function duplicateTrip(id: string): SavedTrip | null {
  const existing = getSavedTrips();
  const source = existing.find(t => t.id === id);
  if (!source) return null;

  const newId = 'trip_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  const duplicated: SavedTrip = {
    id: newId,
    savedAt: new Date().toISOString(),
    name: `Copy of ${source.name}`,
    planResult: {
      ...source.planResult,
      id: newId,
      timestamp: Date.now()
    }
  };

  const updated = [duplicated, ...existing];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return duplicated;
  } catch (err) {
    console.error('Failed to duplicate trip in localStorage:', err);
    return null;
  }
}

export function renameTrip(id: string, newName: string): boolean {
  const existing = getSavedTrips();
  const index = existing.findIndex(t => t.id === id);
  if (index === -1) return false;

  existing[index].name = newName.trim();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return true;
  } catch (err) {
    console.error('Failed to update trip name in localStorage:', err);
    return false;
  }
}

export function deleteTrip(id: string): boolean {
  const existing = getSavedTrips();
  const updated = existing.filter(t => t.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Failed to delete trip from localStorage:', err);
    return false;
  }
}

export function exportTripsAsJSON(): string {
  const trips = getSavedTrips();
  return JSON.stringify(trips, null, 2);
}
