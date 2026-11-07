
import React, { useEffect, useState } from 'react';
import { SavedTrip, TripPlanResult } from '../types';
import {
  getUserSavedTrips,
  renameUserTrip,
  deleteUserTrip,
} from '../services/firestoreStorage';

import {
  Bookmark,
  Trash2,
  Edit2,
  Check,
  X,
  Calendar,
  MapPin,
  Users,
  ArrowRight,
  AlertCircle,
  Cloud,
  ExternalLink,
} from 'lucide-react';

import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

interface SavedTripsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrip: (planResult: TripPlanResult) => void;
  userId: string;
}

export const SavedTripsModal: React.FC<SavedTripsModalProps> = ({
  isOpen,
  onClose,
  onOpenTrip,
  userId,
}) => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [tripToDelete, setTripToDelete] = useState<SavedTrip | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load saved trips belonging only to the signed-in Google account.
  useEffect(() => {
    if (!isOpen || !userId) return;

    let active = true;

    const loadTrips = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const savedTrips = await getUserSavedTrips(userId);

        if (active) {
          setTrips(savedTrips);
        }
      } catch (error) {
        console.error('Error loading saved trips:', error);

        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Unable to load your saved journeys.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTrips();

    return () => {
      active = false;
    };
  }, [isOpen, userId]);

  // Refresh the Firestore trip list.
  const refreshList = async () => {
    const savedTrips = await getUserSavedTrips(userId);
    setTrips(savedTrips);
  };

  const startEditing = (trip: SavedTrip) => {
    setEditingId(trip.id);
    setEditName(trip.name);
    setErrorMessage(null);
  };

  // Rename a trip in Firestore.
  const handleSaveRename = async (id: string) => {
    if (!editName.trim()) {
      setErrorMessage('Please enter a trip name.');
      return;
    }

    setIsWorking(true);
    setErrorMessage(null);

    try {
      await renameUserTrip(userId, id, editName.trim());
      await refreshList();

      setEditingId(null);
      setEditName('');
    } catch (error) {
      console.error('Error renaming trip:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to rename this trip.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  // Delete a trip from Firestore.
  const confirmDelete = async () => {
    if (!tripToDelete) return;

    setIsWorking(true);
    setErrorMessage(null);

    try {
      await deleteUserTrip(userId, tripToDelete.id);
      await refreshList();

      setTripToDelete(null);
    } catch (error) {
      console.error('Error deleting trip:', error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to delete this trip.'
      );
    } finally {
      setIsWorking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#24212B]/75 backdrop-blur-xs animate-fade-in font-sans">
      <div className="bg-[#FAF7F0] rounded-3xl max-w-2xl w-full border border-[#D8C3A5] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-6 border-b border-[#D8C3A5] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center shadow-xs">
              <Bookmark className="w-5 h-5 text-[#78C9D0]" />
            </div>

            <div>
              <h3 className="font-serif font-black text-xl text-[#4B294F]">
                Saved Journeys
              </h3>

              <p className="text-xs text-[#77717F]">
                {trips.length} saved trip{trips.length === 1 ? '' : 's'} in your Google account
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#77717F] hover:text-[#4B294F] rounded-xl hover:bg-[#EEE8F7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Storage Notice */}
        <div className="bg-[#EEE8F7] border-b border-[#D8C3A5] px-6 py-2.5 text-xs text-[#4B294F] flex items-center gap-2">
          <Cloud className="w-4 h-4 text-[#9B72CF] shrink-0" />

          <span>
            <strong>Firebase Cloud Storage:</strong> Your travel plans are saved securely under your signed-in Google account and can be accessed across your devices.
          </span>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* List of Trips */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">

          {loading ? (
            <div className="text-center py-12 text-[#77717F]">
              <Cloud className="w-10 h-10 mx-auto text-[#9B72CF] mb-3 animate-pulse" />
              <p className="font-semibold text-[#4B294F]">
                Loading your saved journeys...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12 text-[#77717F]">
              <Bookmark className="w-12 h-12 mx-auto text-[#9B72CF]/40 mb-3" />

              <p className="font-serif font-bold text-[#4B294F] text-base">
                No saved journeys yet
              </p>

              <p className="text-xs text-[#77717F] mt-1">
                Plan a trip and click "Save Trip" on the results dashboard to access it here anytime.
              </p>
            </div>
          ) : (
            trips.map((trip) => {
              const res = trip.planResult;
              const isEditing = editingId === trip.id;

              return (
                <div
                  key={trip.id}
                  className="rounded-2xl border border-[#D8C3A5] bg-white p-5 hover:border-[#78C9D0] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">

                    {isEditing ? (
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-3 py-1.5 text-sm border border-[#78C9D0] rounded-xl focus:outline-hidden w-full font-bold bg-[#FAF7F0] text-[#24212B]"
                          autoFocus
                        />

                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => handleSaveRename(trip.id)}
                          className="p-1.5 text-[#C2185B] hover:bg-[#EEE8F7] rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isWorking}
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-stone-400 hover:bg-[#EEE8F7] rounded-lg cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-[#4B294F] text-base">
                          {trip.name}
                        </h4>

                        <button
                          type="button"
                          onClick={() => startEditing(trip)}
                          title="Rename trip"
                          className="text-[#77717F] hover:text-[#4B294F] p-1 rounded cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#24212B]/80 mt-1.5 font-medium">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                        {res.formData.origin} ➔ {res.formData.destination}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#78C9D0]" />
                        {res.formData.durationDays} Days
                      </span>

                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#78C9D0]" />
                        {res.formData.travelers} Traveler{res.formData.travelers > 1 ? 's' : ''}
                      </span>

                      <span className="font-bold text-[#C2185B]">
                        Budget: ₹{res.formData.totalBudget.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="text-[10px] text-[#77717F] mt-1.5">
                      Saved on {new Date(trip.savedAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">

                    <a
                      href={getGoogleMapsSearchUrl({
                        name: res.formData.destination,
                        lat: res.destinationCoords?.lat,
                        lon: res.destinationCoords?.lon,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl border border-[#D8C3A5] hover:border-[#4B294F] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#24212B] hover:text-[#C2185B] text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
                      title={`Open ${res.formData.destination} in Google Maps`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#78C9D0]" />
                      <span className="hidden sm:inline">Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5 text-[#77717F]" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        onOpenTrip(trip.planResult);
                        onClose();
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#C2185B] hover:bg-[#A7134D] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <span>Open Plan</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTripToDelete(trip)}
                      title="Delete trip"
                      className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {tripToDelete && (
          <div className="absolute inset-0 bg-[#24212B]/75 backdrop-blur-xs flex items-center justify-center p-4 z-20">
            <div className="bg-[#FAF7F0] rounded-2xl max-w-sm w-full p-6 border border-[#D8C3A5] shadow-2xl space-y-4">

              <div className="flex items-center gap-3 text-rose-600">
                <AlertCircle className="w-6 h-6" />
                <h4 className="font-serif font-bold text-[#4B294F] text-lg">
                  Delete Saved Trip?
                </h4>
              </div>

              <p className="text-xs text-[#24212B]/80">
                Are you sure you want to delete{' '}
                <strong className="text-[#4B294F]">
                  "{tripToDelete.name}"
                </strong>
                ? This will permanently remove it from your Google account.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isWorking}
                  onClick={() => setTripToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-[#D8C3A5] text-[#4B294F] text-xs font-bold hover:bg-[#EEE8F7] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isWorking}
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isWorking ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-[#D8C3A5] bg-white flex items-center justify-between text-xs text-[#77717F]">
          <span>SAFARNAMA AI – Budget Vacation Optimizer</span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#D8C3A5] text-[#4B294F] font-bold hover:bg-[#EEE8F7] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
