import { useState, useEffect, useCallback } from 'react';
import { NgsiV2Client, type NgsiV2Entity } from '@geolonia/geonicdb-sdk/ngsi-v2';
import type { GeoJsonPoint } from '../lib/geo-types';

const baseUrl = (import.meta.env.VITE_GEONICDB_URL as string ?? '').replace(/\/+$/, '');
if (!baseUrl || !import.meta.env.VITE_GEONICDB_TENANT) {
  console.warn('[useFacilities] VITE_GEONICDB_URL / VITE_GEONICDB_TENANT が未設定です。施設データが取得できない可能性があります。');
}
const client = new NgsiV2Client({
  baseUrl,
  service: import.meta.env.VITE_GEONICDB_TENANT as string | undefined,
});

export interface PublicFacilityEntity extends NgsiV2Entity {
  location?: { type: 'geo:json'; value: GeoJsonPoint };
}

interface GeoParams {
  georel: string;
  coords: string;
  geometry: string;
}

export function useFacilities(type = 'PublicFacility') {
  const [facilities, setFacilities] = useState<PublicFacilityEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFacilities = useCallback(async (geoParams?: GeoParams) => {
    setLoading(true);
    setError(null);
    try {
      // SDK 0.14.0+ で georel/geometry/coords をネイティブサポート
      const data = await client.getEntities({
        type,
        limit: 100,
        ...(geoParams && {
          georel: geoParams.georel,
          geometry: geoParams.geometry as 'point' | 'line' | 'polygon' | 'box',
          coords: geoParams.coords,
        }),
      }) as PublicFacilityEntity[];
      setFacilities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    void fetchFacilities();
  }, [fetchFacilities]);

  return { facilities, loading, error, fetchFacilities };
}
