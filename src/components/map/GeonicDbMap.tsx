/**
 * Geolonia Map API based map component for visualizing GeonicDB entities
 */

import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react';
import { Map as GeoloniaMap, Marker as GeoloniaMarker, geolonia } from '@geolonia/embed';
import type * as mapboxgl from 'mapbox-gl';
import type { NgsiV2Entity as NgsiEntity } from '@geolonia/geonicdb-sdk/ngsi-v2';
import type { GeoJsonPoint } from '../../lib/geo-types';

// Re-export map primitives so consumers don't need @geolonia/embed directly
export { GeoloniaMarker as Marker, geolonia };
export type { mapboxgl };

export interface GeonicDbMapProps {
  /** Initial center coordinates [lng, lat] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Map style (default: geolonia/basic) */
  styleUrl?: string;
  /** Entities to display on the map */
  entities?: NgsiEntity[];
  /** Callback when an entity marker is clicked */
  onEntityClick?: (entity: NgsiEntity) => void;
  /** Callback when the map is clicked (returns [lng, lat]) */
  onMapClick?: (lngLat: [number, number]) => void;
  /** CSS class name for the map container */
  className?: string;
  /** Inline styles for the map container (overrides defaults) */
  style?: CSSProperties;
  /** Whether to show entity popups on hover */
  showPopups?: boolean;
  /** Whether to auto-fit bounds to markers */
  fitToMarkers?: boolean;
}

// Geolonia basic style (clean vector tiles)
const DEFAULT_STYLE = 'geolonia/basic';

// Extract location from entity (supports both normalized and keyValues formats)
function getEntityLocation(entity: NgsiEntity): [number, number] | null {
  const location = entity.location;
  if (!location || typeof location === 'string') return null;

  // Normalized format: { type: "geo:json", value: { type: "Point", coordinates: [...] } }
  const value = location.value as GeoJsonPoint | undefined;
  if (value?.type === 'Point' && Array.isArray(value.coordinates)) {
    return value.coordinates;
  }

  // keyValues format: { type: "Point", coordinates: [...] }
  const loc = location as unknown as GeoJsonPoint;
  if (loc.type === 'Point' && Array.isArray(loc.coordinates)) {
    return loc.coordinates;
  }

  return null;
}

// Generate marker color based on entity type
function getMarkerColor(entityType: string): string {
  const colors: Record<string, string> = {
    Room: '#3b82f6', // blue
    ParkingSpot: '#22c55e', // green
    AirQualitySensor: '#f59e0b', // amber
    TrafficFlow: '#ef4444', // red
    EnvironmentSensor: '#8b5cf6', // purple
    EnvSensor: '#8b5cf6', // purple
    TemperatureSensor: '#f97316', // orange
    GeoFeature: '#0ea5e9', // brand blue
  };
  return colors[entityType] || '#6b7280'; // gray default
}

export function GeonicDbMap({
  center = [139.7671, 35.6812], // Tokyo default
  zoom = 13,
  styleUrl,
  entities = [],
  onEntityClick,
  onMapClick,
  className = '',
  style: customStyle,
  showPopups = true,
  fitToMarkers = false,
}: GeonicDbMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const mapLoadedRef = useRef(false);
  const pendingUpdateRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapLoadedRef.current = false;

    const map = new GeoloniaMap({
      container: mapContainerRef.current,
      style: styleUrl || DEFAULT_STYLE,
      center,
      zoom,
    });

    mapRef.current = map;

    // Mark map as loaded when ready
    const onReady = () => {
      mapLoadedRef.current = true;
      // If entities were set before map loaded, trigger update now
      if (pendingUpdateRef.current) {
        pendingUpdateRef.current = false;
        window.dispatchEvent(new CustomEvent('geonicdb-map-ready'));
      }
    };

    map.on('load', onReady);
    // Fallback: 'idle' fires even if 'load' doesn't (e.g. @geolonia/embed)
    map.once('idle', onReady);

    // Map click handler
    if (onMapClick) {
      map.on('click', (e: mapboxgl.MapMouseEvent) => {
        onMapClick([e.lngLat.lng, e.lngLat.lat]);
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      mapLoadedRef.current = false;
    };
  }, [styleUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when entities change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const doUpdate = () => {
      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      // Add new markers
      entities.forEach((entity) => {
        const coords = getEntityLocation(entity);
        if (!coords) return;

        const color = getMarkerColor(entity.type);

        // Create marker element
        const el = document.createElement('div');
        el.className = 'geonicdb-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        const marker = new GeoloniaMarker({ element: el }).setLngLat(coords).addTo(map);

        // Add popup on hover
        if (showPopups) {
          const PopupClass = geolonia.Popup;
          if (PopupClass) {
            const popup = new PopupClass({
              closeButton: false,
              closeOnClick: false,
              offset: 15,
            }).setHTML(`
              <div style="font-family: sans-serif; font-size: 12px;">
                <strong>${entity.id}</strong><br/>
                <span style="color: #666;">${entity.type}</span>
              </div>
            `);

            el.addEventListener('mouseenter', () => {
              marker.setPopup(popup);
              popup.addTo(map);
            });

            el.addEventListener('mouseleave', () => {
              popup.remove();
            });
          }
        }

        // Click handler
        if (onEntityClick) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            onEntityClick(entity);
          });
        }

        markersRef.current.push(marker);
      });

      // Auto-fit bounds to show all markers
      if (fitToMarkers && markersRef.current.length > 0) {
        const allCoords = entities
          .map((e) => getEntityLocation(e))
          .filter((c): c is [number, number] => c !== null);

        if (allCoords.length === 1) {
          map.flyTo({ center: allCoords[0], zoom: 14 });
        } else if (allCoords.length > 1) {
          const bounds = allCoords.reduce(
            (b, coord) => {
              return [
                [Math.min(b[0][0], coord[0]), Math.min(b[0][1], coord[1])],
                [Math.max(b[1][0], coord[0]), Math.max(b[1][1], coord[1])],
              ] as [[number, number], [number, number]];
            },
            [
              [allCoords[0][0], allCoords[0][1]],
              [allCoords[0][0], allCoords[0][1]],
            ] as [[number, number], [number, number]]
          );
          map.fitBounds(bounds, { padding: 30 });
        }
      }
    };

    if (mapLoadedRef.current) {
      doUpdate();
    } else {
      // Map not loaded yet — schedule update for when it's ready
      pendingUpdateRef.current = true;
      const handler = () => doUpdate();
      window.addEventListener('geonicdb-map-ready', handler, { once: true });
      return () => window.removeEventListener('geonicdb-map-ready', handler);
    }
  }, [entities, onEntityClick, showPopups, fitToMarkers]);

  const defaultStyle: CSSProperties = { width: '100%', height: '100%', minHeight: '400px' };

  return (
    <div
      ref={mapContainerRef}
      className={className}
      style={{ ...defaultStyle, ...customStyle }}
    />
  );
}

// Hook for using the map imperatively
export function useGeonicDbMap() {
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const initMap = useCallback(
    (options?: { center?: [number, number]; zoom?: number; styleUrl?: string }) => {
      if (!containerRef.current || map) return;

      const newMap = new GeoloniaMap({
        container: containerRef.current,
        style: options?.styleUrl || DEFAULT_STYLE,
        center: options?.center || [139.7671, 35.6812],
        zoom: options?.zoom || 13,
      });

      setMap(newMap);
      return newMap;
    },
    [map]
  );

  const destroyMap = useCallback(() => {
    if (map) {
      map.remove();
      setMap(null);
    }
  }, [map]);

  const flyTo = useCallback(
    (center: [number, number], zoom?: number) => {
      map?.flyTo({ center, zoom });
    },
    [map]
  );

  const fitBounds = useCallback(
    (bounds: [[number, number], [number, number]], padding?: number) => {
      map?.fitBounds(bounds, { padding: padding || 50 });
    },
    [map]
  );

  return {
    containerRef,
    map,
    initMap,
    destroyMap,
    flyTo,
    fitBounds,
  };
}
