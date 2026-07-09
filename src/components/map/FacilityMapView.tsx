import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeonicDbMap, geolonia } from './GeonicDbMap';
import type { PublicFacility } from '../../types/public-facility';
import { FACILITY_CATEGORY_COLORS, SPRITE_URL } from '../../types/public-facility';

/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyMap = any;
/* eslint-enable @typescript-eslint/no-explicit-any */

interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: [number, number] };
    properties: {
      id: string;
      name: string;
      facilityType: string;
      phone: string;
      spriteIcon: string;
    };
  }>;
}

const SOURCE_ID = 'facility-source';
const LAYER_ID = 'facility-layer';
const SELECTED_LAYER_ID = 'facility-selected-layer';
/** addSprite('facility', ...) registers images as "facility:{name}" (MapLibre prefix rule) */
const SPRITE_ID = 'facility';
const ICON_IMAGE_EXPR = ['concat', `${SPRITE_ID}:`, ['get', 'spriteIcon']] as AnyMap;

interface FacilityMapViewProps {
  facilities: PublicFacility[];
  selectedFacilityId: string | null;
  onSelect?: (id: string) => void;
}

/** Convert facilities to GeoJSON FeatureCollection */
function toGeoJson(facilities: PublicFacility[]): GeoJsonFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: facilities
      .filter((f) => f.location)
      .map((f) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: f.location! },
        properties: {
          id: f.id,
          name: f.name,
          facilityType: f.facilityType,
          phone: f.phone || '',
          spriteIcon:
            (FACILITY_CATEGORY_COLORS[f.facilityType] ?? FACILITY_CATEGORY_COLORS['その他']).spriteIcon,
        },
      })),
  };
}

export function FacilityMapView({
  facilities,
  selectedFacilityId,
  onSelect,
}: FacilityMapViewProps) {
  const { containerRef, map, initMap, flyTo } = useGeonicDbMap();
  const [mapLoaded, setMapLoaded] = useState(false);
  const popupRef = useRef<AnyMap>(null);
  // Keep a lookup map for click handler
  const facilityLookupRef = useRef<Map<string, PublicFacility>>(new Map());

  // Initialize map centered on Itabashi area
  useEffect(() => {
    if (!containerRef.current) return;
    const m = initMap({ center: [139.709, 35.751], zoom: 13, styleUrl: 'geolonia/notebook' });
    if (!m) return;
    const onReady = () => setMapLoaded(true);
    m.once('load', onReady);
    return () => { m.off('load', onReady); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fly to selected facility when selectedFacilityId changes (guard mapLoaded to avoid pre-load flyTo)
  useEffect(() => {
    if (!selectedFacilityId || !mapLoaded) return;
    const facility = facilityLookupRef.current.get(selectedFacilityId);
    if (facility?.location) flyTo(facility.location, 15);
  }, [selectedFacilityId, flyTo, mapLoaded]);

  // Facility click handler (stable ref via useCallback)
  const handleLayerClick = useCallback(
    (e: AnyMap) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const id = feature.properties?.id;
      if (id) onSelect?.(id);
    },
    [onSelect],
  );

  // Hover handlers (stable refs for proper cleanup)
  const handleMouseEnter = useCallback(
    (e: AnyMap) => {
      if (!map) return;
      map.getCanvas().style.cursor = 'pointer';
      const feature = e.features?.[0];
      if (!feature || !geolonia.Popup) return;
      const coords = feature.geometry.coordinates.slice();
      const props = feature.properties;
      const parts = [props.facilityType, props.phone].filter(Boolean);
      const html = `<strong>${props.name}</strong>` +
        (parts.length ? `<div style="color:#666;margin-top:2px;font-size:12px">${parts.join(' | ')}</div>` : '');
      popupRef.current?.remove();
      popupRef.current = new geolonia.Popup({ closeButton: false, closeOnClick: false, offset: [0, -32] })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map);
    },
    [map],
  );

  const handleMouseLeave = useCallback(() => {
    if (!map) return;
    map.getCanvas().style.cursor = '';
    popupRef.current?.remove();
    popupRef.current = null;
  }, [map]);

  const [spriteReady, setSpriteReady] = useState(false);

  // Load custom sprite sheet (async) on first map load
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const anyMap = map as AnyMap;
    // Already loaded (e.g. HMR re-render) — defer to avoid synchronous setState in effect
    const sprites = anyMap.getSprite?.() ?? [];
    if (sprites.some((s: AnyMap) => s.id === SPRITE_ID)) {
      queueMicrotask(() => setSpriteReady(true));
      return;
    }

    // addSprite is async — listen for 'styledata' to know when sprite images are registered
    const onStyleData = () => {
      const updated = anyMap.getSprite?.() ?? [];
      if (updated.some((s: AnyMap) => s.id === SPRITE_ID)) {
        setSpriteReady(true);
        map.off('styledata', onStyleData);
      }
    };
    map.on('styledata', onStyleData);

    try {
      anyMap.addSprite(SPRITE_ID, SPRITE_URL);
    } catch {
      // sprite may already be added on HMR re-render — defer setState
      queueMicrotask(() => setSpriteReady(true));
    }

    return () => { map.off('styledata', onStyleData); };
  }, [map, mapLoaded]);

  // Add source + layers once sprite is loaded
  useEffect(() => {
    if (!map || !mapLoaded || !spriteReady) return;

    // Add GeoJSON source
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data: toGeoJson(facilities),
      });
    }

    // Main symbol layer (unselected icons)
    if (!map.getLayer(LAYER_ID)) {
      map.addLayer({
        id: LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        layout: {
          'icon-image': ICON_IMAGE_EXPR,
          'icon-size': 0.45,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      });
    }

    // Selected layer (larger icon with glow)
    if (!map.getLayer(SELECTED_LAYER_ID)) {
      map.addLayer({
        id: SELECTED_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['==', ['get', 'id'], ''],
        layout: {
          'icon-image': ICON_IMAGE_EXPR,
          'icon-size': 0.55,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      });
    }

    // Click handler
    map.on('click', LAYER_ID, handleLayerClick);
    map.on('click', SELECTED_LAYER_ID, handleLayerClick);

    // Hover: cursor + popup
    map.on('mouseenter', LAYER_ID, handleMouseEnter);
    map.on('mouseleave', LAYER_ID, handleMouseLeave);

    return () => {
      try {
        map.off('click', LAYER_ID, handleLayerClick);
        map.off('click', SELECTED_LAYER_ID, handleLayerClick);
        map.off('mouseenter', LAYER_ID, handleMouseEnter);
        map.off('mouseleave', LAYER_ID, handleMouseLeave);
      } catch { /* cleanup */ }
    };
  }, [map, mapLoaded, spriteReady, facilities, handleLayerClick, handleMouseEnter, handleMouseLeave]);

  // Build lookup synchronously via useMemo so flyTo always sees the latest facilities
  const facilityLookup = useMemo(() => {
    const lookup = new Map<string, PublicFacility>();
    for (const f of facilities) lookup.set(f.id, f);
    return lookup;
  }, [facilities]);
  // Update ref before effects run (safe to assign a ref during render)
  facilityLookupRef.current = facilityLookup;

  // Update GeoJSON data when facilities change
  useEffect(() => {
    if (!map || !mapLoaded || !spriteReady) return;
    const source = map.getSource(SOURCE_ID) as AnyMap;
    if (source) source.setData(toGeoJson(facilities));
  }, [facilities, map, mapLoaded, spriteReady]);

  // Update selected filter when selection changes
  useEffect(() => {
    if (!map || !mapLoaded || !map.getLayer(SELECTED_LAYER_ID)) return;
    map.setFilter(SELECTED_LAYER_ID, ['==', ['get', 'id'], selectedFacilityId ?? '']);
  }, [selectedFacilityId, map, mapLoaded]);

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      style={{ width: '100%', height: '100%', minHeight: '400px' }}
      data-lang="ja"
    />
  );
}
