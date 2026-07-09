import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { NgsiV2Client } from '@geolonia/geonicdb-sdk/ngsi-v2';

const { mockGetEntities } = vi.hoisted(() => ({
  mockGetEntities: vi.fn(),
}));

vi.mock('@geolonia/geonicdb-sdk/ngsi-v2', () => ({
  NgsiV2Client: vi.fn().mockImplementation(function (this: { getEntities: typeof mockGetEntities }) {
    this.getEntities = mockGetEntities;
  }),
}));

const { useFacilities } = await import('../useFacilities');
// beforeEach の clearAllMocks でクリアされる前に constructor 引数を保存
const initialClientConfig = vi.mocked(NgsiV2Client).mock.calls[0]?.[0];

describe('useFacilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A: geo クエリ時に SDK getEntities が georel/geometry/coords 付きで呼ばれる', async () => {
    mockGetEntities.mockResolvedValue([]);

    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const geoParams = {
      georel: 'near;maxDistance:1000',
      coords: '35.6,139.7',
      geometry: 'point' as const,
    };

    await act(async () => {
      await result.current.fetchFacilities(geoParams);
    });

    expect(mockGetEntities).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'PublicFacility',
        limit: 1000,
        georel: 'near;maxDistance:1000',
        geometry: 'point',
        coords: '35.6,139.7',
      }),
    );
  });

  it('B: geo クエリ時に raw fetch が呼ばれない', async () => {
    mockGetEntities.mockResolvedValue([]);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const geoParams = {
      georel: 'near;maxDistance:500',
      coords: '35.7,139.8',
      geometry: 'point' as const,
    };

    await act(async () => {
      await result.current.fetchFacilities(geoParams);
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('C: geoParams なしの通常取得も SDK getEntities を使い geo オプションは渡さない', async () => {
    const entities = [{ id: 'PublicFacility:001', type: 'PublicFacility' }];
    mockGetEntities.mockResolvedValue(entities);

    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const lastCall = mockGetEntities.mock.calls[mockGetEntities.mock.calls.length - 1][0];
    expect(lastCall).toMatchObject({ type: 'PublicFacility', limit: 1000 });
    expect(lastCall).not.toHaveProperty('georel');
    expect(result.current.facilities).toEqual(entities);
  });

  it('D: エラー時に error state が設定される', async () => {
    mockGetEntities.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Network error');
    expect(result.current.facilities).toEqual([]);
  });

  it('E: NgsiV2Client が service (tenant) オプションで初期化される', () => {
    expect(initialClientConfig?.service).toBe(import.meta.env.VITE_GEONICDB_TENANT);
  });
});
