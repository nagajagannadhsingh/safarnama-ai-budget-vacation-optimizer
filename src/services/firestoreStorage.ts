
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

// Get the signed-in user's private trips collection.
const getUserTripsCollection = (userId: string) => {
  if (!userId) {
    throw new Error('A signed-in user is required.');
  }

  return collection(db, 'users', userId, 'trips');
};

// Remove undefined values before sending data to Firestore.
// Firestore does not accept undefined values by default.
const removeUndefinedValues = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((item) =>
      item === undefined ? null : removeUndefinedValues(item)
    );
  }

  if (
    value !== null &&
    typeof value === 'object' &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [
          key,
          removeUndefinedValues(item),
        ])
    );
  }

  return value;
};

// Retrieve saved trips for the signed-in user.
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

// Save a trip to Firestore.
export async function saveUserTrip(
  userId: string,
  planResult: TripPlanResult,
  customName?: string
): Promise<SavedTrip> {
  if (!userId) {
    throw new Error('Please sign in before saving a trip.');
  }

  if (!planResult?.formData) {
    throw new Error('Trip details are missing. Please generate the trip again.');
  }

  const tripsCollection = getUserTripsCollection(userId);

  // Generate a unique Firestore document ID.
  const tripDocument = doc(tripsCollection);
  const id = tripDocument.id;

  const defaultName =
    `${planResult.formData.origin} to ${planResult.formData.destination} ` +
    `(${planResult.formData.durationDays} Days, ₹${planResult.formData.totalBudget.toLocaleString('en-IN')})`;

  const savedTrip: SavedTrip = {
    id,
    savedAt: new Date().toISOString(),
    name: customName?.trim() || defaultName,
    planResult,
  };

  const firestoreData = removeUndefinedValues({
    ...savedTrip,
    userId,
  });

  await setDoc(tripDocument, firestoreData);

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
