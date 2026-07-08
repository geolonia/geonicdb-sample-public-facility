import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// VITE_GEONICDB_URL の env 設定が NgsiV2Client baseUrl に正しく反映されるかを検証する。
// モジュールは baseUrl をトップレベルで初期化するため、各テストで resetModules + 再 import する。

function mockNgsiClient() {
  const mockGetEntities = vi.fn().mockResolvedValue([]);
  const NgsiV2ClientMock = vi.fn().mockImplementation(function (
    this: Record<string, unknown>,
  ) {
    this.getEntities = mockGetEntities;
  });
  return { mockGetEntities, NgsiV2ClientMock };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('useFacilities — VITE_GEONICDB_URL env configuration', () => {
  it('E: VITE_GEONICDB_URL が設定されていれば NgsiV2Client に正しい baseUrl が渡される', async () => {
    const { NgsiV2ClientMock } = mockNgsiClient();

    vi.stubEnv('VITE_GEONICDB_URL', 'https://demo.geonicdb.com/api');
    vi.doMock('@geolonia/geonicdb-sdk/ngsi-v2', () => ({
      NgsiV2Client: NgsiV2ClientMock,
    }));

    const { useFacilities } = await import('../useFacilities');
    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(NgsiV2ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://demo.geonicdb.com/api' }),
    );
  });

  it('F: VITE_GEONICDB_URL の末尾スラッシュは除去される', async () => {
    const { NgsiV2ClientMock } = mockNgsiClient();

    vi.stubEnv('VITE_GEONICDB_URL', 'https://demo.geonicdb.com/api/');
    vi.doMock('@geolonia/geonicdb-sdk/ngsi-v2', () => ({
      NgsiV2Client: NgsiV2ClientMock,
    }));

    const { useFacilities } = await import('../useFacilities');
    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(NgsiV2ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://demo.geonicdb.com/api' }),
    );
  });

  it('G: VITE_GEONICDB_URL が空文字の場合、baseUrl は空文字になる', async () => {
    const { NgsiV2ClientMock } = mockNgsiClient();

    vi.stubEnv('VITE_GEONICDB_URL', '');
    vi.doMock('@geolonia/geonicdb-sdk/ngsi-v2', () => ({
      NgsiV2Client: NgsiV2ClientMock,
    }));

    const { useFacilities } = await import('../useFacilities');
    const { result } = renderHook(() => useFacilities('PublicFacility'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(NgsiV2ClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: '' }),
    );
  });
});
