import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import pkg from '../../../../package.json';

const embedRange = (pkg as { dependencies: Record<string, string> }).dependencies['@geolonia/embed'];

/**
 * cmd_643 回帰ガード。
 *
 * バグ: @geolonia/embed v1.x は `Map`/`Marker` を `export type`(型のみ)で
 * 公開するため、`import { Map } from '@geolonia/embed'; new Map()` が実行時に
 * "Map is not a constructor" で失敗する(ビルドは型が存在するので緑になり見逃される)。
 * 修正: v5 系(`export { GeoloniaMap as Map, ... }` = 実値クラス)へ上げる。
 *
 * 実際の embed バンドルは jsdom で import できない(publicPath 検出で throw)ため、
 * ランタイム値の直接検証は e2e(puppeteer)側で行い、ここでは
 * 「型のみ export の壊れた版へ戻さない」ことをバージョンで固定する。
 */
describe('cmd_643: @geolonia/embed version guard', () => {
  it('uses @geolonia/embed major >= 5 (v1.x は Map/Marker が型のみ export でランタイム未定義)', () => {
    expect(embedRange).toBeTruthy();
    const major = Number(String(embedRange).replace(/^[^0-9]*/, '').split('.')[0]);
    expect(Number.isNaN(major)).toBe(false);
    expect(major).toBeGreaterThanOrEqual(5);
  });
});

// --- FacilityMapView 初期化テスト(vi.mock + render) ---

const { MapCtor, MarkerCtor, PopupCtor } = vi.hoisted(() => {
  // 通常関数で this に生やす(arrow だと `new` 不可)。
  const MapCtor = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, {
      on: vi.fn(),
      off: vi.fn(),
      once: vi.fn(),
      remove: vi.fn(),
      flyTo: vi.fn(),
      fitBounds: vi.fn(),
      addSprite: vi.fn(),
      getSprite: vi.fn(() => []),
      getSource: vi.fn(() => undefined),
      addSource: vi.fn(),
      getLayer: vi.fn(() => undefined),
      addLayer: vi.fn(),
      setFilter: vi.fn(),
      getCanvas: vi.fn(() => ({ style: {} })),
    });
  });
  const MarkerCtor = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, {
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      setPopup: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    });
  });
  const PopupCtor = vi.fn(function (this: Record<string, unknown>) {
    Object.assign(this, {
      setLngLat: vi.fn().mockReturnThis(),
      setHTML: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
    });
  });
  return { MapCtor, MarkerCtor, PopupCtor };
});

vi.mock('@geolonia/embed', () => ({
  Map: MapCtor,
  Marker: MarkerCtor,
  geolonia: { Popup: PopupCtor },
}));

const { FacilityMapView } = await import('../FacilityMapView');

describe('FacilityMapView init', () => {
  beforeEach(() => {
    MapCtor.mockClear();
  });

  it('マウント時に地図コンテナを描画し Map コンストラクタを呼ぶ(初期化が throw しない)', () => {
    const { container } = render(
      <FacilityMapView
        facilities={[]}
        selectedFacilityId={null}
        onSelect={() => {}}
      />,
    );
    // container div (data-lang="ja") が描画される
    expect(container.querySelector('[data-lang="ja"]')).not.toBeNull();
    // useGeonicDbMap.initMap 経由で Map が生成される
    expect(MapCtor).toHaveBeenCalledTimes(1);
  });

  it('cmd_647: コンテナ div にインライン style が設定されている (Tailwind クラスでなく inline style)', () => {
    const { container } = render(
      <FacilityMapView
        facilities={[]}
        selectedFacilityId={null}
        onSelect={() => {}}
      />,
    );
    const mapDiv = container.querySelector('[data-lang="ja"]') as HTMLElement | null;
    expect(mapDiv).not.toBeNull();
    // Tailwind 未インストール環境では className による CSS は無効。
    // inline style で高さが確実に設定されていることを検証する。
    expect(mapDiv!.style.width).toBe('100%');
    expect(mapDiv!.style.height).toBe('100%');
    expect(mapDiv!.style.minHeight).toBe('400px');
  });
});
