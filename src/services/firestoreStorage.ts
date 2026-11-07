
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../firebase';
import { SavedTrip, TripPlanResult } from '../types';

// Each Google account gets its own Firestore trips collection.
const getUserTripsCollection = (userId: string) => {
  if (!userId) {
    throw new Error('A signed-in user is required.');
  }

  return collection(db, 'users', userId, 'trips');
};

// Retrieve only the signed-in user's saved trips.
export async function getUserSavedTrips(
  userId: string
): Promise<SavedTrip[]> {
  const tripsQuery = query(
    getUserTripsCollection(userId),
    orderBy('savedAt', 'desc')
  );

  const snapshot = await getDocs(tripsQuery);

  return snapshot.docs.map((tripDocument) => ({
    ...tripDocument.data(),
    id: tripDocument.id,
  } as SavedTrip));
}

// Save a trip to the signed-in user's Firestore collection.
export async function saveUserTrip(
  userId: string,
  planResult: TripPlanResult,
  customName?: string
): Promise<SavedTrip> {
  const id = planResult.id || `trip_${Date.now()}`;

  const defaultName =
    `${planResult.formData.origin} to ${planResult.formData.destination} ` +
    `(${planResult.formData.durationDays} Days, ₹${planResult.formData.totalBudget.toLocaleString('en-IN')})`;

  const savedTrip: SavedTrip = {
    id,
    savedAt: new Date().toISOString(),
    name: customName || defaultName,
    planResult,
  };

  await setDoc(
    doc(db, 'users', userId, 'trips', id),
    {
      ...savedTrip,
      userId,
    }
  );

  return savedTrip;
}

// Rename a saved trip.
export async function renameUserTrip(
  userId: string,
  tripId: string,
  newName: string
): Promise<void> {
  if (!newName.trim()) {
    throw new Error('Trip name cannot be empty.');
  }

  await updateDoc(
    doc(db, 'users', userId, 'trips', tripId),
    {
      name: newName.trim(),
      savedAt: new Date().toISOString(),
    }
  );
}

// Delete a saved trip.
export async function deleteUserTrip(
  userId: string,
  tripId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', userId, 'trips', tripId)
  );
}

