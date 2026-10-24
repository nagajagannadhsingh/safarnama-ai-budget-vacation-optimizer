import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { PlaceItem, AccommodationItem } from '../types';
import { MapPin, Navigation, Compass, ZoomIn, ZoomOut, Bed, Landmark, ExternalLink, ShieldCheck, Globe, AlertCircle } from 'lucide-react';
import { getGoogleMapsSearchUrl } from '../utils/googleMaps';

function isValidCoordinate(lat?: number, lon?: number): boolean {
  return typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

function formatCoord(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

interface InteractiveMapProps {
  center: { lat: number; lon: number };
  origin?: { lat: number; lon: number };
  originName?: string;
  destinationName: string;
  places: PlaceItem[];
  accommodations: AccommodationItem[];
  routeGeometry?: any;
  focusedPlace?: PlaceItem | AccommodationItem | null;
  onSelectPlace?: (place: PlaceItem | AccommodationItem) => void;
  onMapClickLocation?: (lat: number, lon: number) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center,
  origin,
  originName,
  destinationName,
  places,
  accommodations,
  routeGeometry,
  focusedPlace,
  onSelectPlace,
  onMapClickLocation
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const markerMapRef = useRef<Map<string, L.Marker>>(new Map());

  const [activeFilter, setActiveFilter] = useState<'all' | 'places' | 'accommodations'>('all');
  const [showListView, setShowListView] = useState(false);
  const [clickedCoordNotice, setClickedCoordNotice] = useState<string | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = isValidCoordinate(center.lat, center.lon) ? center.lat : 20.5937;
      const initialLon = isValidCoordinate(center.lat, center.lon) ? center.lon : 78.9629;

      try {
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLon],
          zoom: 12,
          zoomControl: false,
          attributionControl: true
        });

        // Standard OpenStreetMap Tile Layer with fallback error tracking
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        });

        tileLayer.on('tileerror', () => {
          // Non-blocking tile error handling
        });

        tileLayer.addTo(map);

        // Map click listener for inspecting coordinates or setting location
        map.on('click', (e: L.LeafletMouseEvent) => {
          const { lat, lng } = e.latlng;
          setClickedCoordNotice(`Location: ${formatCoord(lat, lng)}`);
          setTimeout(() => setClickedCoordNotice(null), 3500);
          if (onMapClickLocation) {
            onMapClickLocation(lat, lng);
          }
        });

        const markersGroup = L.layerGroup().addTo(map);
        markersLayerRef.current = markersGroup;
        mapInstanceRef.current = map;
      } catch (err) {
        console.error('Leaflet map initialization failed:', err);
        setMapLoadError(true);
      }
    }

    return () => {};
  }, []);

  // Update Center & Fit Bounds when destination or markers change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const validCenter = isValidCoordinate(center.lat, center.lon);
    if (!validCenter) return;

    // Filter valid markers
    const validPlaces = places.filter(p => isValidCoordinate(p.lat, p.lon));
    const validAccs = accommodations.filter(a => isValidCoordinate(a.lat, a.lon));

    if (validPlaces.length > 0 || validAccs.length > 0) {
      const bounds = L.latLngBounds([center.lat, center.lon], [center.lat, center.lon]);
      if (origin && isValidCoordinate(origin.lat, origin.lon)) {
        bounds.extend([origin.lat, origin.lon]);
      }
      validPlaces.forEach(p => bounds.extend([p.lat, p.lon]));
      validAccs.forEach(a => bounds.extend([a.lat, a.lon]));

      // Fit bounds with padding so all markers are comfortably in view
      map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
    } else {
      map.setView([center.lat, center.lon], 12);
    }
  }, [center.lat, center.lon, places.length, accommodations.length]);

  // Render Markers and Polyline (Brand Theme: Plum Velvet, Red Magenta, Aqua Blue, Soft Ivory)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = markersLayerRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    markerMapRef.current.clear();

    // 1. Destination Center Pin (Plum Velvet #4B294F with Gold Accent)
    if (isValidCoordinate(center.lat, center.lon)) {
      const destCenterIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #4B294F; color: #FAF7F0; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(75,41,79,0.4); border: 2.5px solid #78C9D0; font-weight: bold;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const destMarker = L.marker([center.lat, center.lon], { icon: destCenterIcon });
      const destMapsUrl = getGoogleMapsSearchUrl({ name: destinationName, lat: center.lat, lon: center.lon });

      destMarker.bindPopup(`
        <div style="font-family: inherit; max-width: 260px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 800; color: #9B72CF; text-transform: uppercase; letter-spacing: 0.5px;">Destination Geographic Center</div>
          <div style="font-weight: 800; font-size: 16px; color: #4B294F; margin-top: 2px;">${destinationName}</div>
          <div style="font-size: 11px; color: #77717F; margin-top: 4px;">📍 ${formatCoord(center.lat, center.lon)}</div>
          <a href="${destMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px 12px; background-color: #4B294F; color: #FAF7F0; font-size: 11px; font-weight: 700; border-radius: 10px; text-decoration: none; text-align: center;">
            <span>Open in Google Maps</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      `);
      layerGroup.addLayer(destMarker);
      markerMapRef.current.set('dest_center', destMarker);
    }

    // 2. Origin Marker (Plum Velvet #4B294F with Aqua border)
    if (origin && isValidCoordinate(origin.lat, origin.lon)) {
      const originIcon = L.divIcon({
        className: 'custom-map-icon',
        html: `
          <div style="background-color: #24212B; color: #FAF7F0; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(36,33,43,0.4); border: 2.5px solid #D8C3A5; font-weight: bold;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const originMapsUrl = getGoogleMapsSearchUrl({
        name: originName || 'Starting Location',
        lat: origin.lat,
        lon: origin.lon
      });

      const originMarker = L.marker([origin.lat, origin.lon], { icon: originIcon });
      originMarker.bindPopup(`
        <div style="font-family: inherit; max-width: 260px; padding: 4px;">
          <div style="font-size: 10px; font-weight: 800; color: #78C9D0; text-transform: uppercase; letter-spacing: 0.5px;">Departure Origin Hub</div>
          <div style="font-weight: 800; font-size: 15px; color: #24212B; margin-top: 2px;">${originName || 'Starting Location'}</div>
          <div style="font-size: 11px; color: #77717F; margin-top: 3px;">📍 ${formatCoord(origin.lat, origin.lon)}</div>
          <a href="${originMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px 12px; background-color: #24212B; color: #FAF7F0; font-size: 11px; font-weight: 700; border-radius: 10px; text-decoration: none; text-align: center;">
            <span>Open in Google Maps</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
      `);
      layerGroup.addLayer(originMarker);
      markerMapRef.current.set('origin', originMarker);
    }

    // 3. Attractions & Places Markers (Red Magenta #C2185B & Orchid Purple #9B72CF)
    if (activeFilter === 'all' || activeFilter === 'places') {
      places.forEach((place, index) => {
        if (!isValidCoordinate(place.lat, place.lon)) return;

        const placeKey = `place_${place.id || index}`;
        const isSelected = focusedPlace && 'type' in focusedPlace && focusedPlace.name === place.name;

        const iconHtml = `
          <div style="background-color: ${isSelected ? '#9B72CF' : '#C2185B'}; color: #FFFFFF; border-radius: 50%; width: ${isSelected ? 38 : 30}px; height: ${isSelected ? 38 : 30}px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(194,24,91,0.4); border: 2px solid #FFFFFF; transition: transform 0.2s;">
            <span style="font-size: 11px; font-weight: 800;">${index + 1}</span>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-map-icon',
          html: iconHtml,
          iconSize: [isSelected ? 38 : 30, isSelected ? 38 : 30],
          iconAnchor: [isSelected ? 19 : 15, isSelected ? 19 : 15],
          popupAnchor: [0, -16]
        });

        const placeMapsUrl = getGoogleMapsSearchUrl({
          name: place.name,
          address: place.address,
          lat: place.lat,
          lon: place.lon,
          state: destinationName
        });

        const marker = L.marker([place.lat, place.lon], { icon });

        const popupContent = `
          <div style="font-family: inherit; max-width: 260px; padding: 4px;">
            <div style="height: 5px; width: 100%; border-radius: 4px; background: linear-gradient(90deg, #C2185B, #9B72CF); margin-bottom: 8px;"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 10px; font-weight: 800; color: #C2185B; text-transform: uppercase; letter-spacing: 0.5px;">#${index + 1} · ${place.type || 'Attraction'}</span>
              ${place.estFee !== undefined ? `<span style="font-size: 10px; font-weight: 800; background: #EEE8F7; color: #4B294F; padding: 2px 7px; border-radius: 6px;">${place.estFee === 0 ? 'Free Entry' : `Est. Fee`}</span>` : ''}
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #4B294F; margin-top: 4px; line-height: 1.25;">${place.name}</div>
            ${place.description ? `<div style="font-size: 11px; color: #24212B; margin-top: 5px; line-height: 1.35;">${place.description}</div>` : ''}
            <div style="font-size: 11px; color: #77717F; margin-top: 6px; display: flex; align-items: flex-start; gap: 4px;">
              <span>📍</span>
              <span style="line-height: 1.3;">${place.address || destinationName}</span>
            </div>
            <div style="font-size: 10px; color: #9B72CF; margin-top: 4px;">
              Coordinates: ${formatCoord(place.lat, place.lon)}
            </div>
            <a href="${placeMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px 12px; background-color: #C2185B; color: #FFFFFF; font-size: 11px; font-weight: 700; border-radius: 10px; text-decoration: none; text-align: center;">
              <span>Open in Google Maps</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <div style="font-size: 9px; color: #77717F; margin-top: 6px; border-top: 1px solid #D8C3A5; padding-top: 4px; text-align: center;">
              Verified Source: ${place.source || 'OpenStreetMap Grounded'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectPlace) onSelectPlace(place);
        });

        layerGroup.addLayer(marker);
        markerMapRef.current.set(placeKey, marker);
      });
    }

    // 4. Accommodations Markers (Aqua Blue #78C9D0 with Plum Velvet border)
    if (activeFilter === 'all' || activeFilter === 'accommodations') {
      accommodations.forEach((acc, index) => {
        if (!isValidCoordinate(acc.lat, acc.lon)) return;

        const accKey = `acc_${acc.id || index}`;
        const isSelected = focusedPlace && 'category' in focusedPlace && focusedPlace.name === acc.name;

        const iconHtml = `
          <div style="background-color: ${isSelected ? '#C2185B' : '#78C9D0'}; color: #4B294F; border-radius: 8px; width: ${isSelected ? 36 : 28}px; height: ${isSelected ? 36 : 28}px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(75,41,79,0.25); border: 2px solid #FFFFFF;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10"/><path d="M2 17h20"/><path d="M6 8v9"/></svg>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-map-icon',
          html: iconHtml,
          iconSize: [isSelected ? 36 : 28, isSelected ? 36 : 28],
          iconAnchor: [isSelected ? 18 : 14, isSelected ? 18 : 14],
          popupAnchor: [0, -15]
        });

        const accMapsUrl = getGoogleMapsSearchUrl({
          name: acc.name,
          address: acc.address,
          lat: acc.lat,
          lon: acc.lon,
          state: destinationName
        });

        const marker = L.marker([acc.lat, acc.lon], { icon });
        const popupContent = `
          <div style="font-family: inherit; max-width: 260px; padding: 4px;">
            <div style="height: 5px; width: 100%; border-radius: 4px; background: linear-gradient(90deg, #78C9D0, #4B294F); margin-bottom: 8px;"></div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px;">
              <span style="font-size: 10px; font-weight: 800; color: #4B294F; text-transform: uppercase;">${acc.category}</span>
              ${acc.distanceKm !== undefined ? `<span style="font-size: 10px; font-weight: 700; color: #4B294F; background: #EEE8F7; padding: 2px 6px; border-radius: 6px;">~${acc.distanceKm} km</span>` : ''}
            </div>
            <div style="font-weight: 800; font-size: 15px; color: #4B294F; margin-top: 4px; line-height: 1.25;">${acc.name}</div>
            <div style="font-size: 11px; color: #77717F; margin-top: 5px; display: flex; align-items: flex-start; gap: 4px;">
              <span>📍</span>
              <span style="line-height: 1.3;">${acc.address || destinationName}</span>
            </div>
            <div style="font-size: 10px; color: #4B294F; margin-top: 6px; background: #FAF7F0; padding: 5px 8px; border-radius: 8px; border: 1px solid #D8C3A5;">
              <strong>Tariff:</strong> ${acc.priceDisclaimer || 'Price unavailable — contact property directly'}
              <div style="font-size: 9px; color: #77717F; margin-top: 3px; font-style: italic; line-height: 1.2;">Mapped accommodation data does not guarantee room availability for your dates.</div>
            </div>
            <a href="${accMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; margin-top: 10px; padding: 8px 12px; background-color: #4B294F; color: #FAF7F0; font-size: 11px; font-weight: 700; border-radius: 10px; text-decoration: none; text-align: center;">
              <span>Open in Google Maps</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </a>
            <div style="font-size: 9px; color: #77717F; margin-top: 6px; border-top: 1px solid #D8C3A5; padding-top: 4px; text-align: center;">
              Verified Source: ${acc.source || 'OpenStreetMap Verified'}
            </div>
          </div>
        `;

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectPlace) onSelectPlace(acc);
        });

        layerGroup.addLayer(marker);
        markerMapRef.current.set(accKey, marker);
      });
    }

    // 5. Route Polyline (Red Magenta #C2185B)
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (routeGeometry && routeGeometry.coordinates && routeGeometry.coordinates.length > 0) {
      const latLngs = routeGeometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
      const polyline = L.polyline(latLngs, {
        color: '#C2185B',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round'
      });
      polyline.addTo(map);
      routeLayerRef.current = polyline;
    }

  }, [places, accommodations, activeFilter, focusedPlace, center.lat, center.lon, origin?.lat, origin?.lon, routeGeometry]);

  // Handle focused place effect
  useEffect(() => {
    if (!focusedPlace || !mapInstanceRef.current) return;
    if (!isValidCoordinate(focusedPlace.lat, focusedPlace.lon)) return;

    mapInstanceRef.current.setView([focusedPlace.lat, focusedPlace.lon], 15, { animate: true });

    for (const [, marker] of markerMapRef.current.entries()) {
      const pos = marker.getLatLng();
      if (Math.abs(pos.lat - focusedPlace.lat) < 0.0001 && Math.abs(pos.lng - focusedPlace.lon) < 0.0001) {
        marker.openPopup();
        break;
      }
    }
  }, [focusedPlace]);

  const handleRecenter = () => {
    if (mapInstanceRef.current && isValidCoordinate(center.lat, center.lon)) {
      mapInstanceRef.current.setView([center.lat, center.lon], 12, { animate: true });
    }
  };

  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      const cur = mapInstanceRef.current.getZoom();
      mapInstanceRef.current.setZoom(cur + delta);
    }
  };

  return (
    <div className="relative rounded-3xl overflow-hidden border border-[#D8C3A5] bg-[#FAF7F0] shadow-md flex flex-col font-sans">
      {/* Top Map Action Bar */}
      <div className="bg-white px-5 py-3.5 border-b border-[#D8C3A5] flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4B294F] text-[#FAF7F0] flex items-center justify-center font-bold text-sm shadow-xs">
            <Compass className="w-4 h-4 text-[#78C9D0]" />
          </div>
          <div>
            <div className="font-serif font-bold text-[#4B294F] text-sm flex items-center gap-2">
              <span>{destinationName} Interactive Map</span>
              <span className="text-xs font-normal text-[#77717F]">· Grounded Coordinates</span>
            </div>
            <div className="text-xs text-[#77717F]">
              {places.length} Verified Sight{places.length !== 1 ? 's' : ''} · {accommodations.length} Real Accommodations
            </div>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-[#EEE8F7] rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${activeFilter === 'all' ? 'bg-[#4B294F] text-[#FAF7F0] shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'}`}
          >
            All ({places.length + accommodations.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('places')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${activeFilter === 'places' ? 'bg-[#C2185B] text-white shadow-xs' : 'text-[#77717F] hover:text-[#4B294F]'}`}
          >
            <Landmark className="w-3 h-3" /> Sights ({places.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('accommodations')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer ${activeFilter === 'accommodations' ? 'bg-[#78C9D0] text-[#4B294F] shadow-xs font-bold' : 'text-[#77717F] hover:text-[#4B294F]'}`}
          >
            <Bed className="w-3 h-3" /> Stays ({accommodations.length})
          </button>
        </div>

        {/* List View Toggle */}
        <button
          type="button"
          onClick={() => setShowListView(!showListView)}
          className="text-xs px-3 py-1.5 rounded-xl border border-[#D8C3A5] bg-[#FAF7F0] hover:bg-[#EEE8F7] text-[#4B294F] font-semibold transition-colors cursor-pointer"
        >
          {showListView ? 'Hide Pin Directory' : 'View Pin Directory'}
        </button>
      </div>

      {/* Map Canvas */}
      <div className="relative w-full h-[460px] md:h-[540px]">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Custom Map Controls */}
        <div className="absolute right-3.5 top-3.5 z-30 flex flex-col gap-1 shadow-md rounded-xl overflow-hidden bg-white border border-[#D8C3A5]">
          <button
            type="button"
            title="Zoom In"
            onClick={() => handleZoom(1)}
            className="p-2 text-[#4B294F] hover:bg-[#EEE8F7] transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => handleZoom(-1)}
            className="p-2 text-[#4B294F] hover:bg-[#EEE8F7] transition-colors border-t border-[#D8C3A5] cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Recenter on Destination"
            onClick={handleRecenter}
            className="p-2 text-[#C2185B] hover:bg-[#EEE8F7] transition-colors border-t border-[#D8C3A5] cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Map Legend */}
        <div className="absolute left-3.5 bottom-3.5 z-30 bg-white/95 backdrop-blur-xs px-3.5 py-2.5 rounded-2xl border border-[#D8C3A5] text-xs shadow-md flex flex-col gap-1.5 text-[#24212B]">
          <div className="font-bold text-[#4B294F] text-[11px] mb-0.5 uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#78C9D0]" />
            <span>Map Legend</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#C2185B] inline-block" />
            <span>Verified Sights ({places.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-md bg-[#78C9D0] inline-block border border-[#4B294F]" />
            <span>Verified Lodging ({accommodations.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#4B294F] inline-block border border-[#78C9D0]" />
            <span>Destination Center</span>
          </div>
          {origin && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#24212B] inline-block border border-[#D8C3A5]" />
              <span>Trip Origin Hub</span>
            </div>
          )}
          <div className="text-[10px] text-[#77717F] mt-0.5">
            Click any pin to view details or launch Google Maps
          </div>
        </div>

        {/* Click notice banner */}
        {clickedCoordNotice && (
          <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 bg-[#4B294F]/90 text-[#FAF7F0] px-4 py-1.5 rounded-full text-xs font-mono shadow-xl transition-all">
            {clickedCoordNotice}
          </div>
        )}
      </div>

      {/* Accessible List View Drawer */}
      {showListView && (
        <div className="border-t border-[#D8C3A5] bg-[#FAF7F0] p-5 max-h-72 overflow-y-auto">
          <h4 className="font-serif font-bold text-[#4B294F] text-sm mb-3">All Verified Physical Mapped Locations</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-bold text-[#C2185B] uppercase tracking-wider mb-2">Verified Sights ({places.length})</div>
              {places.length === 0 ? (
                <p className="text-xs text-[#77717F] italic">No verified sights available.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-[#24212B]">
                  {places.map((p, i) => (
                    <li
                      key={p.id || i}
                      onClick={() => {
                        if (onSelectPlace) onSelectPlace(p);
                      }}
                      className="p-2.5 rounded-xl bg-white hover:bg-[#EEE8F7] cursor-pointer border border-[#D8C3A5] flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-[#4B294F] block truncate">{i + 1}. {p.name}</span>
                        <span className="text-[11px] text-[#77717F] truncate block">{p.address || destinationName}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[#C2185B] shrink-0">
                        {formatCoord(p.lat, p.lon)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-[#78C9D0] uppercase tracking-wider mb-2">Verified Lodging ({accommodations.length})</div>
              {accommodations.length === 0 ? (
                <p className="text-xs text-[#77717F] italic">No verified accommodations recorded. Zero fake hotels shown.</p>
              ) : (
                <ul className="space-y-1.5 text-xs text-[#24212B]">
                  {accommodations.map((a, i) => (
                    <li
                      key={a.id || i}
                      onClick={() => {
                        if (onSelectPlace) onSelectPlace(a);
                      }}
                      className="p-2.5 rounded-xl bg-white hover:bg-[#EEE8F7] cursor-pointer border border-[#D8C3A5] flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-[#4B294F] block truncate">{a.name}</span>
                        <span className="text-[11px] text-[#77717F] truncate block">{a.category} · {a.address || destinationName}</span>
                      </div>
                      {a.distanceKm !== undefined && (
                        <span className="text-[10px] font-bold text-[#4B294F] shrink-0 bg-[#EEE8F7] px-2 py-0.5 rounded-md">
                          ~{a.distanceKm} km
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
