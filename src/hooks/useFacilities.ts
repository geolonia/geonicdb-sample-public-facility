import { useState, useEffect, useCallback } from 'react';
import { NgsiV2Client, type NgsiV2Entity } from '@geolonia/geonicdb-sdk/ngsi-v2';
import type { GeoJsonPoint } from '../lib/geo-types';

const baseUrl = (import.meta.env.VITE_GEONICDB_URL as string ?? '').replace(/\/+$/, '');
const client = new NgsiV2Client({ baseUrl });

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
      if (geoParams) {
        // georel は SDK NgsiV2QueryOptions に未実装 → raw fetch で escape hatch
        const params = new URLSearchParams({
          type,
          limit: '100',
          georel: geoParams.georel,
          coords: geoParams.coords,
          geometry: geoParams.geometry,
        });
        const url = `${baseUrl || ''}/v2/entities?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`georel query failed: ${res.status}`);
        const data = await res.json() as PublicFacilityEntity[];
        setFacilities(data);
      } else {
        // 通常取得: SDK を使用
        const data = await client.getEntities({ type, limit: 100 }) as PublicFacilityEntity[];
        setFacilities(data);
      }
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
