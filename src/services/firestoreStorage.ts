
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

// Special marker used to preserve nested arrays in Firestore.
const NESTED_ARRAY_KEY = 'safarnamaNestedArrayData';

// Check whether a value is a plain JavaScript object.
const isPlainObject = (
  value: unknown
): value is Record<string, unknown> => {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);

  return (
    prototype === Object.prototype ||
    prototype === null
  );
};

// Prepare data for Firestore.
// Firestore does not support arrays directly inside arrays.
// Wrap nested arrays inside objects to preserve their structure.
const prepareForFirestore = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      // Undefined array elements are stored as null.
      if (item === undefined) {
        return null;
      }

      // Wrap nested arrays inside an object.
      if (Array.isArray(item)) {
        return {
          [NESTED_ARRAY_KEY]: prepareForFirestore(item),
        };
      }

      return prepareForFirestore(item);
    });
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      // Firestore does not accept undefined object fields.
      if (item === undefined) {
        continue;
      }

      result[key] = prepareForFirestore(item);
    }

    return result;
  }

  return value;
};

// Restore nested arrays after retrieving data from Firestore.
const restoreFromFirestore = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(restoreFromFirestore);
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);

    // Detect our nested-array wrapper.
    if (
      keys.length === 1 &&
      Array.isArray(value[NESTED_ARRAY_KEY])
    ) {
      return restoreFromFirestore(
        value[NESTED_ARRAY_KEY]
      );
    }

    const result: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(value)) {
      result[key] = restoreFromFirestore(item);
    }

    return result;
  }

  return value;
};

// Get the signed-in user's private trips collection.
const getUserTripsCollection = (userId: string) => {
  if (!userId) {
    throw new Error('A signed-in user is required.');
  }

  return collection(db, 'users', userId, 'trips');
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

  return snapshot.docs.map((tripDocument) => {
    const tripData = restoreFromFirestore(
      tripDocument.data()
    ) as Record<string, unknown>;

    return {
      ...tripData,
      id: tripDocument.id,
    } as unknown as SavedTrip;
  });
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
    throw new Error(
      'Trip details are missing. Please generate the trip again.'
    );
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

  const firestoreData = prepareForFirestore({
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
